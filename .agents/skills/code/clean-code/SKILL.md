---
name: clean-code
description: Apply this skill when writing, refactoring, or reviewing any TypeScript/React code in the project (components, stores, entities, repositories, use cases, data sources, or utilities). Enforces Clean Architecture with constructor dependency injection, SOLID/KISS/DRY principles, zero hardcoded values (mandatory enums/types), prohibition of business logic or utility functions inside .tsx files, and strict single-responsibility limits per store.
---

# Clean Code — Clean Architecture + SOLID/KISS/DRY

## 0. When It Triggers
- You are about to create or modify: an entity, a repository (interface or implementation), a use case, a data source, a Zustand store, or any `.tsx` file.
- You are auditing existing code for violations (see Section 9, "Audit Patterns").
- Before considering ANY code task complete in this project.

If a task is solely pure styling/CSS without logic, consult the `atomic-design` skill instead.

---

## 1. The 4 Layers and Dependency Direction

```
Component (.tsx)
     │ uses (Zustand hook)
     ▼
Store (Zustand)
     │ calls
     ▼
UseCase (domain/usecases)
     │ depends on (interface)
     ▼
IRepository (domain/repository)
     ▲ implements
Repository (data/repositories)
     │ calls
     ▼
DataSource Local | Remote (data/datasources)
```

Dependencies **must always point inward** (toward domain). Nothing in `domain/` has any awareness of React, Zustand, `fetch`, `localStorage`, or external libraries.

| Layer | May Import From | MUST NEVER Import From |
|---|---|---|
| `presentation/components` (.tsx) | Other components, store hooks, `core/types`, `core/utils` | `usecases`, `repository`, `datasources`, or `entities` directly |
| `presentation/stores` | `domain/usecases`, `domain/entities`, `core/utils` | `data/repositories`, `data/datasources`, `data/model` |
| `domain/usecases` | `domain/entities`, `domain/repository` (interfaces) | `data/*`, React, Zustand |
| `domain/repository` (interfaces) | `domain/entities` | Any concrete implementation |
| `data/repositories` | `domain/repository` (implements), `data/datasources`, `data/model` | `presentation/*`, `domain/usecases` |
| `data/datasources` | `core/services` (e.g. `NetworkService`), `data/model` | `domain/*`, `presentation/*` |

When a component needs data, the path is always:
`Component (.tsx) → Store (Zustand) → UseCase → Repository Interface → Repository Implementation → DataSource (Remote/Local) → NetworkService / Storage`.
Skipping any step (e.g. a store calling a `Repository` directly, a repository calling `fetch()` directly, or a page calling `new APIRepository()`) is an architectural violation.

### Strict Repository & Domain Rules:
1. **Repositories Represent Domain Aggregates, NEVER User Roles:**
   - Prohibited: `AdminRepository`, `MechanicRepository`, `ReceptionistRepository`.
   - Required: `AppointmentRepository`, `MaintenanceRepository`, `BranchRepository`, `InventoryRepository`, `SalesRepository`.
   - A repository models a business boundary (Bounded Context), not the identity or permissions of who executes the action.
2. **Repositories Delegate I/O to DataSources and Use `NetworkService`:**
   - Repositories must NEVER call `fetch()`, declare private `baseUrl` or `fetchWithAuth`, or read `localStorage` directly.
   - Remote I/O is performed by `RemoteDataSource` using `NetworkService`.
   - Local persistence (tokens, cache, active branch) is performed by `LocalDataSource` using typed storage wrappers.
3. **Repository Interfaces Reside in `domain/repository/`:**
   - Contracts (`IAppointmentRepository`, `IAuthRepository`) belong strictly in `domain/repository/{Name}/`.
   - It is a severe violation of Dependency Inversion to declare repository interfaces inside `data/repositories/`.
4. **DataSources Return Models (DTOs), Repositories Map to Entities:**
   - `RemoteDataSource` returns typed models (`AppointmentModel`, `ProductModel`).
   - `Repository` translates models into immutable domain entities (`Appointment`, `Product`) via `.toEntity()` mappers.

### Strict Presentation Rules:
1. **Pages (.tsx) MUST ONLY consume Stores**:
   - Never instantiate a repository (`new APISalesRepository()`) inside a `.tsx` file or call repositories directly.
   - All data fetching, caching, search debouncing, and business state mutations live inside the feature's dedicated Zustand store via UseCases.
2. **Every Feature MUST Have Its Own Store & Use Cases**:
   - Avoid using `useState` or `useEffect` for business logic (such as debounce timers `setTimeout`, toast array management, or paginated lists).
   - In `.tsx` components, `useState` is strictly reserved for ephemeral UI state (e.g., `isModalOpen`, `activeDropdownTab`).
3. **Grouped and Hierarchical Imports**:
   - Never write multiple separate import lines from the same package path (e.g. 5 consecutive lines of `import { ... } from '@/app/data'`).
   - Group them into a single import statement and order by layer hierarchy: External libs → Core → Data/Domain → Presentation.
4. **Core Hooks Barrel**:
   - Hooks must be imported through `@/core/hooks`, never through direct file paths like `@/core/hooks/useBarcodeScanner`.

---

## 2. Dependency Injection and Single-Responsibility UseCases

### Single-Responsibility UseCase Rule:
A Use Case (*Interactor*) represents **ONE single business interaction/action** (Single Responsibility Principle).
- **PROHIBITED (Anti-pattern)**: Monolithic "UseCase Mirrors" (e.g. `export class BranchUseCases { getBranches(); createBranch(); updateBranch(); ... }`). These merely duplicate the repository interface and violate SRP.
- **MANDATORY**: Each Use Case lives in its own file (`src/app/domain/usecases/{domain}/{Action}UseCase.ts`) and exposes an `execute(...)` method.
- **Facading**: Domain barrels or aggregate facades may be created solely for backward-compatibility, but they MUST delegate to individual UseCase instances.

### Strict `erasableSyntaxOnly` Constructor Pattern:
Due to TypeScript `"erasableSyntaxOnly": true`, **parameter properties in constructors are strictly prohibited** (e.g. `constructor(private readonly repo: IRepo)` causes compiler error `TS1294`). All properties must be declared as explicit class fields:

```ts
// domain/usecases/auth/LoginUseCase.ts
export class LoginUseCase {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository;
  }

  async execute(credentials: LoginCredentials): Promise<User> {
    if (!credentials.usernameOrEmail?.trim()) {
      throw new Error('El usuario es requerido');
    }
    return this.authRepository.login(credentials);
  }
}
```

```ts
// data/repositories/Auth/AuthRepository.ts
export class AuthRepository implements IAuthRepository {
  private readonly remote: AuthRemoteDataSource;
  private readonly local: AuthLocalDataSource;

  constructor(remote: AuthRemoteDataSource, local: AuthLocalDataSource) {
    this.remote = remote;
    this.local = local;
  }

  async login(credentials: LoginCredentials): Promise<User> {
    const model = await this.remote.login(credentials);
    await this.local.saveSession(model);
    return model.toEntity();
  }
}
```

All wiring ("who instantiates whom") is centralized in **a single composition root**, `core/di/container.ts`. Nowhere else in the project should `new` be used on a Repository, DataSource, or UseCase:

```ts
// core/di/container.ts
export const loginUseCase = new LoginUseCase(authRepository);
export const authUseCases = new AuthUseCases(authRepository); // Backward-compatible facade
```

Stores import pre-wired use cases (e.g. `loginUseCase` or `authUseCases`) directly from `core/di/container.ts`. Stores never instantiate dependencies and never import `AuthRepository` or `AuthRemoteDataSource`.

---

## 3. Zero Hardcoded Values

Comparing against raw strings or numbers scattered across code is prohibited. Every state, role, status, or category must be defined once as an `enum`, a `type` with `as const`, or encapsulated as an entity getter.

```ts
// ❌ WRONG
if (user.role === 'admin') { ... }
if (service.status === 'pending' || service.status === 'in_progress') { ... }
```

```ts
// ✅ RIGHT — core/enums/UserRole/UserRole.ts
export enum UserRole {
  Admin = 'admin',
  Client = 'client',
  Driver = 'driver',
}

// Usage
if (user.role === UserRole.Admin) { ... }
```

When a check represents a **recurrent business rule** (rather than an isolated check), that logic belongs inside an entity getter rather than being re-implemented across the codebase:

```ts
// domain/entities/User/User.ts
export class User {
  constructor(public readonly role: UserRole /* ... */) {}

  get isAdmin(): boolean {
    return this.role === UserRole.Admin;
  }
}

// Usage
if (user.isAdmin) { ... }
```

The same applies to magic numbers (`if (items.length > 10)`), routes (`'/dashboard'`), API endpoints, and any literals representing business logic — place them in `core/constants` or `core/enums`.

### Strict Centralized API Endpoints:
Endpoints must NEVER be written as hardcoded template literals inside repository or datasource methods (`fetch('${this.baseUrl}/appointments/${id}/approve')`).
All paths must be registered in `src/core/constants/endpoints/api.endpoints.ts` (`API_ENDPOINTS.APPOINTMENTS.APPROVE(id)`). This guarantees single-point changes and zero URL drift.

---

## 4. A `.tsx` File Declares Neither Functions Nor Business Logic

A `.tsx` component file may ONLY contain:
- JSX rendering.
- Props destructuring and selector/action subscriptions from stores.
- `useState` **strictly** for transient, local UI state that does not need to survive unmounting and is not consumed elsewhere (e.g. modal open/closed, active tab index, hover, focus).

A `.tsx` file MUST **NEVER** contain:
- Named helper functions or `const fn = () => {}` that calculate, parse, format, or transform data.
- `useEffect` hooks that call APIs, trigger domain logic, or mutate business data — those belong in store actions (which invoke use cases).
- Inline data formatting (dates, currency, strings, etc.).

Mental checklist for state location:
1. **Does it survive re-renders or do other components need it?** → **Store**.
2. **Does it involve business logic or async I/O?** → **Store + UseCase**.
3. **Is it purely ephemeral UI state that dies when unmounted?** → `useState` is permitted.

```tsx
// ❌ WRONG
function ServiceCard({ service }: Props) {
  const [loading, setLoading] = useState(false);

  const formattedDate = new Date(service.createdAt).toLocaleDateString('es-MX');

  const handleCancel = async () => {
    setLoading(true);
    await fetch(`/api/services/${service.id}/cancel`, { method: 'POST' });
    setLoading(false);
  };

  return <div>{formattedDate}...</div>;
}
```

```tsx
// ✅ RIGHT
function ServiceCard({ service }: Props) {
  const { cancelService, isCancelling } = useServiceStore();
  const formattedDate = formatDate(service.createdAt);

  return <div>{formattedDate}...</div>;
}
```

---

## 5. Utilities and Helpers Belong in `core/utils`

No utility function (`formatDate`, `formatCurrency`, `capitalize`, validators, parsers) may be declared inside a component, store, or use case. They reside in `core/utils/{topic}/{name}.util.ts` as pure functions (no `useState`, no network calls, no `this`) and are imported where needed.

---

## 6. Single Responsibility per Store

Each store handles **strictly** the scope defined by its domain.

| A Store CAN | A Store CAN NEVER |
|---|---|
| Maintain state for its specific domain | Import a `Repository` or `DataSource` directly |
| Expose actions that call use cases of its domain | Define unrelated utility functions (e.g., `capitalizeName` inside `auth.store.ts`) |
| Expose selectors derived from its state | Execute inline business logic that belongs in a use case |
| Trigger browser APIs through use cases | Call `localStorage` or `fetch` **directly** — that flows through UseCase → Repository → DataSource |

```ts
// ❌ WRONG — auth.store.ts doing work outside its responsibility
import { authRepository } from '@/data/repositories/Auth';

export const useAuthStore = create<AuthState>((set) => ({
  login: async (credentials) => {
    const user = await authRepository.login(credentials); // ❌ store bypassing use case to call repository
    localStorage.setItem('user', JSON.stringify(user));    // ❌ store touching browser storage directly
    set({ user, displayName: capitalizeName(user.name) });  // ❌ utility declared/used inline
  },
}));

function capitalizeName(name: string) { /* ... */ } // ❌ utility living in store file
```

```ts
// ✅ RIGHT
import { authUseCases } from '@/core/di/container';
import { capitalize } from '@/core/utils/string/string.util';

export const useAuthStore = create<AuthState>((set) => ({
  login: async (credentials) => {
    const user = await authUseCases.login(credentials);
    set({ user, displayName: capitalize(user.name) });
  },
}));
```

---

## 7. SOLID / KISS / DRY — Applied Cheat Sheet

| Principle | Applied Meaning in This Stack |
|---|---|
| **S**ingle Responsibility | One store = one domain. One use case = one business operation. One utility = one pure transformation. |
| **O**pen/Closed | Add new behaviors by implementing `IRepository` or new entities, not by nesting cascading `if/else` checks in existing use cases. |
| **L**iskov Substitution | Any implementation of `IAuthRepository` must seamlessly substitute another without breaking `AuthUseCases` (essential for test mocks). |
| **I**nterface Segregation | Keep repository interfaces lean and domain-focused (`IAuthRepository`, `IClientRepository`), not a bloated monolithic interface. |
| **D**ependency Inversion | Use cases depend on `IRepository` interfaces, never directly on concrete `Repository` classes. |
| **KISS** | Avoid unneeded patterns (factories, heavy DI frameworks, observers). Simple constructor injection solves 95% of use cases cleanly. |
| **DRY** | When a check, calculation, or format is used 2+ times, extract it to a utility, enum, or entity getter. Do not copy/paste. |

---

## 8. Declarative Role-Based Access Control (RBAC)

All views, routes, actions, and sensitive UI elements must enforce access control according to the role permissions matrix derived from `API_DOCS.md`.

### Rules for RBAC:
1. **Never compare role strings inline:**
   - ❌ `if (user.role === 'admin')` or `if (role === 'administrator')`
   - ✅ `if (hasRole(user, [UserRole.Admin]))` or `if (hasPermission(user, PERMISSIONS.APPOINTMENTS_DELETE))`
2. **Protect Routes with Typed Roles:**
   - Use `<ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Seller]}>`. Unauthorized users must be redirected to their default allowed view or a Forbidden page.
3. **Protect Sensitive UI Elements with `<Authorize>`:**
   ```tsx
   <Authorize roles={[UserRole.Admin]} permissions={[PERMISSIONS.APPOINTMENTS_DELETE]} fallback={null}>
     <DeleteAppointmentButtonAtom onClick={handleDelete} />
   </Authorize>
   ```
4. **Dynamic Sidebars / Navigations:**
   - Filter menu items dynamically with `hasRole(user, item.allowedRoles)` or `item.permission`. Never hardcode role-visibility lists or show unauthorized routes.

---

## 9. Final Checklist Before Completing a Task

- [ ] Are all repeated strings/numbers extracted into `enum`, `const`, or an entity getter?
- [ ] Are all API endpoints referenced from `core/constants/endpoints/api.endpoints.ts` (zero hardcoded URLs)?
- [ ] Are all `.tsx` files free of inline utility functions, calculations, or data formatting?
- [ ] Are `useState` and `useEffect` used solely for ephemeral, local UI states rather than domain logic?
- [ ] Does every store communicate through use cases rather than importing repositories/datasources directly?
- [ ] Are all repositories representing domain aggregates rather than user roles (no `AdminRepository`)?
- [ ] Do all repositories delegate remote I/O to DataSources and `NetworkService` (zero direct `fetch()` or `localStorage`)?
- [ ] Are repository interfaces placed in `domain/repository/` rather than `data/`?
- [ ] Are views and actions protected by RBAC (`ProtectedRoute`, `<Authorize>`, `useAuthorization`)?
- [ ] Do classes (`UseCases`, `Repository`, `DataSource`) receive their dependencies via constructor injection?
- [ ] Are instances created with `new` restricted strictly to `core/di/container.ts`?

---

## 10. Audit Patterns for Existing Code

- `useState(` in `.tsx` — verify against Section 4 whether it is purely ephemeral UI state.
- `useEffect(` in `.tsx` — almost always belongs as a store action.
- `=== '` or `== "` — literal string comparison, prime candidate for an enum.
- `role === 'admin'` or `user.role ===` — manual string role check, candidate for `hasRole` / `hasPermission`.
- `fetch(` in `repositories/` or `components/` — violation of `DataSource` and `NetworkService` layering.
- `localStorage.getItem(` in `repositories/` — violation of `LocalDataSource` layering.
- `function ` or `const .* = (.*) =>` inside `.tsx` (other than the exported component itself).
- `import.*Repository` or `import.*DataSource` inside `stores/` or `pages/`.
- `new .*Repository(`, `new .*UseCases(` outside `core/di/container.ts`.