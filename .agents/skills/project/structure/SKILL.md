---
name: project-structure
description: Apply this skill when creating new files or folders, or deciding where existing code should live within the React + TypeScript project using Clean Architecture. Defines the complete directory tree (data/domain/presentation/core), the single index.ts per layer rule (never per subfolder or unit), and mandatory naming conventions per file type.
---

# Project Structure — Directory Tree and Naming Conventions

## 0. When It Triggers
- You are about to create a new file (entity, repository, use case, data source, model, store, utility, enum, type, component).
- You are unsure which folder code should belong to.
- You are refactoring and moving code to its proper location.

For architectural rules and layer responsibilities, refer to `clean-code`. For internal organization of `components/`, refer to `atomic-design`.

---

## 1. Core Rule: One Folder per Unit, but EXACTLY ONE `index.ts` per Layer

Every functional unit (an entity, a repository, a use case, an atom...) lives in its own dedicated folder. However, the `index.ts` barrel that exports it **must NOT reside inside that unit folder**. It exists exactly once, at the root of the **layer** — the top-level functional folder grouping units of the same type (`entities/`, `usecases/`, `components/`, `stores/`, `datasources/`, `enums/`, etc.) — regardless of how many grouping subdirectories exist between that layer root and the implementation file.

```ts
// ❌ WRONG — an index.ts inside each unit folder
entities/
├── User/
│   ├── User.ts
│   └── index.ts        // ❌ does not belong here
├── Client/
│   ├── Client.ts
│   └── index.ts        // ❌ does not belong here
└── Driver/
    ├── Driver.ts
    └── index.ts        // ❌ does not belong here
```

```ts
// ✅ RIGHT — a single index.ts at the root of the "entities" layer
entities/
├── User/
│   └── User.ts
├── Client/
│   └── Client.ts
├── Driver/
│   └── Driver.ts
└── index.ts             // Sole barrel: export * from './User/User'; export * from './Client/Client'; ...
```

This rule holds even if there are multiple grouping directories between the layer root and the file — no intermediate index file is permitted. For instance, in `components/`, where two intermediate levels (`atoms/` → `Button/`) precede the file:

```ts
// ❌ WRONG
components/
├── atoms/
│   └── Button/
│       ├── PrimaryButtonAtom.tsx
│       ├── SecondaryButtonAtom.tsx
│       ├── TertiaryButtonAtom.tsx
│       └── index.ts          // ❌ does not belong here
├── primitives/
│   └── Flex/
│       ├── FlexPrimitive.tsx
│       └── index.ts          // ❌ does not belong here
└── index.ts
```

```ts
// ✅ RIGHT — exactly one index.ts at the root of "components" for the entire layer
components/
├── atoms/
│   └── Button/
│       ├── PrimaryButtonAtom.tsx
│       ├── SecondaryButtonAtom.tsx
│       └── TertiaryButtonAtom.tsx
├── primitives/
│   └── Flex/
│       └── FlexPrimitive.tsx
└── index.ts                  // Sole barrel for the entire components layer
```

**General Rule: A layer = a first-level functional folder within `data/`, `domain/`, `presentation/`, or `core/`** (`entities`, `repository`, `usecases`, `datasources`, `model`, `repositories`, `components`, `stores`, `pages`, `constants`, `enums`, `types`, `services`, `utils`). Each layer has **exactly one** `index.ts`, placed at its own root, which re-exports everything underneath — regardless of depth. No internal subfolders — neither grouping folders (`local/`, `remote/`, `atoms/`, `Button/`) nor individual unit folders (`User/`, `auth/`, `UserRole/`) — may contain their own `index.ts`.

Levels above a layer (`app/data/`, `app/domain/`, `app/presentation/`, `core/`) also have their own `index.ts` — but those re-export from each constituent layer's index (`data/index.ts` re-exports from `datasources/index.ts`, `model/index.ts`, and `repositories/index.ts`), never from individual unit files.

Every layer `index.ts` **only re-exports** — zero business logic, zero inline type definitions.

---

## 2. Complete Reference Tree

```
src/
├── app/
│   ├── data/
│   │   ├── datasources/
│   │   │   ├── local/
│   │   │   │   └── Auth/
│   │   │   │       └── AuthLocalDataSource.ts
│   │   │   ├── remote/
│   │   │   │   └── Auth/
│   │   │   │       └── AuthRemoteDataSource.ts
│   │   │   └── index.ts
│   │   ├── model/
│   │   │   ├── Auth/
│   │   │   │   └── AuthSessionModel.ts
│   │   │   └── index.ts
│   │   ├── repositories/
│   │   │   ├── Auth/
│   │   │   │   └── AuthRepository.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Auth/
│   │   │   │   └── AuthSession.ts
│   │   │   └── index.ts
│   │   ├── repository/
│   │   │   ├── Auth/
│   │   │   │   └── IAuthRepository.ts
│   │   │   └── index.ts
│   │   ├── usecases/
│   │   │   ├── auth/
│   │   │   │   └── AuthUseCases.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── presentation/
│       ├── components/               // Refer to atomic-design skill
│       │   ├── atoms/
│       │   │   └── Button/
│       │   │       ├── PrimaryButtonAtom.tsx
│       │   │       ├── SecondaryButtonAtom.tsx
│       │   │       └── TertiaryButtonAtom.tsx
│       │   ├── primitives/
│       │   │   └── Flex/
│       │   │       └── FlexPrimitive.tsx
│       │   ├── molecules/
│       │   │   ├── Card/
│       │   │   │   └── AppointmentCard.tsx
│       │   │   ├── Receipt/
│       │   │   │   ├── TicketReceipt.tsx
│       │   │   │   └── QuotationReceipt.tsx
│       │   │   └── Modal/
│       │   │       ├── Modal.tsx
│       │   │       ├── ConfirmModal.tsx
│       │   │       └── AlertModal.tsx
│       │   ├── organisms/
│       │   │   └── Form/
│       │   │       └── LoginFormOrganism.tsx
│       │   ├── templates/
│       │   │   └── Section/
│       │   │       └── ClientDetailsSectionTemplate.tsx
│       │   └── index.ts
│       ├── stores/
│       │   ├── auth/
│       │   │   └── auth.store.ts
│       │   └── index.ts
│       ├── pages/
│       │   ├── auth/
│       │   │   └── LoginPage.tsx
│       │   └── index.ts
│       └── index.ts
├── core/
│   ├── constants/
│   │   ├── routes/
│   │   │   └── routes.const.ts
│   │   └── index.ts
│   ├── enums/
│   │   ├── UserRole/
│   │   │   └── UserRole.ts
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useBarcodeScanner.ts
│   │   └── index.ts           // Sole barrel for core hooks: export * from './useBarcodeScanner'
│   ├── types/
│   │   ├── Size/
│   │   │   └── Size.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── network/
│   │   │   └── NetworkService.ts
│   │   └── index.ts
│   ├── di/
│   │   └── container.ts       // Sole location using `new` for Repository/UseCase/DataSource
│   └── utils/
│       ├── date/
│       │   └── date.util.ts
│       ├── string/
│       │   └── string.util.ts
│       └── index.ts
├── App.tsx
└── main.tsx
```

This tree demonstrates the `auth` feature end-to-end as a blueprint. **Every new feature (clients, drivers, services...) must replicate this exact pattern**, placing its unit folder inside the corresponding existing layer (`entities/Client/`, `usecases/client/`, `stores/clients/`, etc.) and re-exporting through that layer's single `index.ts` — never creating private subfolder index files.

---

## 3. Mandatory Naming Conventions per File Type

| Layer / Type | File Pattern | Unit Folder (No index.ts inside) |
|---|---|---|
| Entity | `{Name}.ts` | `domain/entities/{Name}/` |
| Repository Interface | `I{Name}Repository.ts` | `domain/repository/{Name}/` |
| Use Case | `{Name}UseCases.ts` | `domain/usecases/{name}/` |
| Repository (Implementation) | `{Name}Repository.ts` | `data/repositories/{Name}/` |
| Local DataSource | `{Name}LocalDataSource.ts` | `data/datasources/local/{Name}/` |
| Remote DataSource | `{Name}RemoteDataSource.ts` | `data/datasources/remote/{Name}/` |
| Model / DTO | `{Name}Model.ts` | `data/model/{Name}/` |
| Store (Zustand) | `{name}.store.ts` | `presentation/stores/{name}/` |
| Page / Route View | `{Name}Page.tsx` | `presentation/pages/{feature}/` |
| Atomic Component | Refer to `atomic-design` | `presentation/components/{level}/{Category}/` |
| Utility | `{name}.util.ts` | `core/utils/{topic}/` |
| Enum | `{Name}.ts` | `core/enums/{Name}/` |
| Cross-cutting Type | `{Name}.ts` | `core/types/{Name}/` |
| Constant | `{name}.const.ts` | `core/constants/{topic}/` |

Remember: `index.ts` **never** goes in the folders in the right column — it goes only once at the layer root (`entities/index.ts`, `usecases/index.ts`, `stores/index.ts`, etc.), as detailed in Sections 1 and 2.

---

## 4. Decision Tree: Where Does New Code Belong?

1. **Pure business logic or entity state without external dependencies (no React, fetch, storage)?** → `domain/entities` (for models/entities) or `domain/usecases` (for business actions).
2. **Contract or interface describing available operations without implementing them?** → `domain/repository`.
3. **Actual I/O implementation (HTTP calls, `localStorage`, `IndexedDB`)?** → `data/datasources` (`local/` or `remote/` accordingly).
4. **Data serialization/mapping between external APIs/storage and domain entities?** → `data/model` (DTO) + `data/repositories` (mapping).
5. **UI state for a domain plus action triggers that invoke use cases?** → `presentation/stores`.
6. **Complete view attached to a router path?** → `presentation/pages`.
7. **Reusable visual UI element?** → `presentation/components` (refer to `atomic-design` for exact level).
8. **Cross-cutting constant, enum, type, or pure utility with no domain-specific business logic?** → Corresponding subfolder under `core/`.

---

## 5. Final Checklist

- [ ] Does the new file live inside its dedicated unit folder, WITHOUT a private `index.ts` inside it?
- [ ] Is there exactly one `index.ts` at the root of the layer, rather than multiple ones in intermediate folders?
- [ ] Does the file name strictly follow the naming convention for its layer (Section 3 table)?
- [ ] Did you mirror the structure of existing features rather than introducing a custom organizational pattern?
- [ ] Are all implementation files placed inside unit folders (none left loose at the layer root)?