---
name: project-structure
description: Defines the folder structure and layer boundaries (data/domain/presentation) every new feature, module, or screen must follow in this React + TypeScript project. Use whenever creating a new feature, screen, module, or deciding where a new file (datasource, repository, usecase, store, component) should live. Trigger on "nueva funcionalidad", "nuevo feature", "nuevo módulo", "dónde va este archivo", or any request to scaffold a new part of the app. This skill governs WHERE files go; for HOW to write the code inside them, see the react-clean-code skill — apply both together.
---

# React + TypeScript Feature Architecture

This defines the folder structure for every feature in this codebase. It's adapted from a Clean Architecture layout the user already relies on in their Flutter projects, simplified for React + TypeScript idioms (fewer single-file folders, fewer redundant suffixes, interface/impl split only where it earns its keep).

**Pairs with `react-clean-code`:** this skill decides *where* a file goes; `react-clean-code` decides *how* the code inside it should be written (naming, function size, typing, no logic in components, etc.). Apply both whenever scaffolding or adding to a feature.

---

## 1. Top-level layout

```yaml
src:
  app:
    data:
      datasources:
        - auth.local-datasource.ts
        - auth.remote-datasource.ts
      repositories:
        - auth.repository.ts
      mappers:
        - auth.mapper.ts
    domain:
      types:
        - User.ts
      usecases:
        - requestOtp.usecase.ts
        - verifyOtp.usecase.ts
        - clearUserSession.usecase.ts
    presentation:
      components:
        atoms:
        primtives:
        organisms:
        templates:
        layouts:
      hooks:
        - useAuth.ts
      store:
        - auth.store.ts
      pages:
        - LoginPage.tsx
    register:           # app-wide DI wiring, if the project uses it
  core:
    constants:
    enums.ts:
    env:
    exceptions:
    extensions:
    i18n:
    router:
    services:
    theme:
    utils:
  main.tsx:
```

`core/` holds anything cross-cutting that isn't tied to one feature (theme, routing, env config, shared services like network/storage, i18n). `features/` holds everything that belongs to one business capability.

---

## 2. Anatomy of a feature

```yaml
features:
  auth:
    data:
      datasources:
        - auth.local-datasource.ts
        - auth.remote-datasource.ts
      repositories:
        - auth.repository.ts
      mappers:
        - auth.mapper.ts
    domain:

    presentation:
      components:   # atoms/molecules/organisms — see component-architecture skill

    auth.register.ts:   # DI wiring for this feature, if used
```

Data flow: `View → Hook → Usecase → Repository → Datasource`, with `Mapper` converting the datasource's raw shape into the domain `type` before it reaches the usecase.

### Layer responsibilities

| Layer | Owns | Never contains |
|---|---|---|
| `data/datasources` | The actual fetch/SDK call, one per source (local storage, remote API) | Business rules, UI state |
| `data/repositories` | Picks which datasource(s) to call, combines them if needed | Formatting, validation |
| `data/mappers` | Converts raw API/storage shape → domain `type` | Side effects, fetching |
| `domain/types` | The shape the rest of the app works with | — |
| `domain/usecases` | One business operation each (`verifyOtp`, `saveScannedConfig`) — the orchestration layer | Direct fetch calls, JSX |
| `presentation/hooks` | UI state (loading/error), calls usecases | Business rules, fetch calls |
| `presentation/store` | Shared state across components | Formatting, validation logic |
| `presentation/components` | Rendering only (see `react-clean-code`) | Any of the above |

---

## 3. Decision guide: how much structure does this feature actually need?

Not every feature needs every layer — a feature with no remote data and no reusable business rule doesn't need `usecases/` or `repositories/`. Match the structure to what the feature actually does:

| Situation | What to create |
|---|---|
| Feature only fetches and displays data, no transformation | `datasource` + `hook` — skip `repository`/`mapper` if the API shape is already what the UI needs |
| API shape differs meaningfully from what the UI needs (renamed fields, computed values, merging two calls) | Add a `mapper` and a domain `type` |
| Business rule that could be reused or needs its own unit test (validation, multi-step flow, "what happens on submit") | Add a `usecase` |
| Only one implementation of a datasource/service exists and no test needs to swap it | **Skip** the interface/impl split — just export the concrete function. Add the interface later if a second implementation or a mock actually shows up. |
| A datasource genuinely has two implementations (e.g. local vs remote, or you're actively mocking it in tests) | Split `interface` + `impl` |
| Shared across 2+ features | Promote it into `core/` instead of duplicating per feature |

Default to the smaller structure. Add layers when a real need shows up, not preemptively — an empty `repositories/` folder with one pass-through function is a smell, not a best practice.

---

## 4. Naming

No redundant suffixes that just repeat the folder name. The folder already tells you what the file is:

```
Avoid:  domain/usecases/auth/RequestOtpUsecase.usecase.ts
Prefer: domain/usecases/requestOtp.usecase.ts
```

Keep exactly one suffix that disambiguates the *kind* of file when the plain name alone would be ambiguous (`.usecase.ts`, `.repository.ts`, `.store.ts`, `.mapper.ts`) — but don't stack folder name + suffix + type name.

One barrel file (`index.ts`) per folder that has more than a couple of exports, re-exporting its contents — mirrors the `models.dart`/`usecases.dart` pattern from the Flutter structure, adapted to TS:

```ts
// domain/usecases/index.ts
export * from './requestOtp.usecase';
export * from './verifyOtp.usecase';
```

---

## 5. Worked example

A `scanner` feature that validates a scanned QR against the backend.

```yaml
features:
  scanner:
    data:
      datasources:
        - scanner.remote-datasource.ts   # POST /scan
      repositories:
        - scanner.repository.ts
      mappers:
        - scanTicket.mapper.ts
    domain:
      types:
        - ScanResult.ts
      usecases:
        - validateScannedTicket.usecase.ts
    presentation:
      hooks:
        - useTicketScanner.ts
      store:
        - scanner.store.ts
      views:
        - ScannerView.tsx
```

```ts
// data/datasources/scanner.remote-datasource.ts — only place that knows the endpoint
export async function scanTicket(qrPayload: string): Promise<ScanTicketApiResponse> {
  const response = await fetch('/api/scan', {
    method: 'POST',
    body: JSON.stringify({ qr: qrPayload }),
  });
  return response.json();
}

// data/mappers/scanTicket.mapper.ts — API shape → domain type
export function mapScanResponseToScanResult(raw: ScanTicketApiResponse): ScanResult {
  return {
    status: raw.ticket_status,
    ticketId: raw.ticket_id,
    scannedAt: new Date(raw.scanned_at),
  };
}

// data/repositories/scanner.repository.ts — orchestrates the datasource + mapper
export async function getScanResult(qrPayload: string): Promise<ScanResult> {
  const raw = await scanTicket(qrPayload);
  return mapScanResponseToScanResult(raw);
}

// domain/usecases/validateScannedTicket.usecase.ts — business rule lives here
export async function validateScannedTicket(qrPayload: string): Promise<ScanResult> {
  if (!qrPayload) throw new InvalidQrError();
  return getScanResult(qrPayload);
}

// presentation/hooks/useTicketScanner.ts — UI state only
export function useTicketScanner() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  async function handleScan(qrPayload: string) {
    setIsScanning(true);
    const scanResult = await validateScannedTicket(qrPayload);
    setResult(scanResult);
    setIsScanning(false);
  }

  return { result, isScanning, handleScan };
}

// presentation/views/ScannerView.tsx — rendering only
export function ScannerView() {
  const { result, isScanning, handleScan } = useTicketScanner();
  // ...renders QR camera + result, per react-clean-code component rules
}
```

Note there's no `repository interface` and no separate `entity` vs `model` here — there's one datasource implementation and the API shape only needed light reshaping, so the lighter structure from Section 3 applies.

---

## 6. `core/` reference

| Folder | Holds |
|---|---|
| `constants/` | Fixed values reused across features: routes, storage keys, api base paths, durations |
| `enums.ts` | Small shared unions/enums not tied to one feature |
| `env/` | Per-environment config (`dev`, `staging`, `production`) |
| `exceptions/` | Custom error classes |
| `extensions/` | Reusable helpers that extend a built-in type's behavior (string/date helpers) |
| `i18n/` | Localization strings and setup |
| `router/` | Route definitions and navigation config |
| `services/` | Cross-feature infrastructure: network client, storage, permissions — split interface/impl here specifically, since these are exactly the kind of thing you swap or mock |
| `theme/` | Colors, typography, light/dark mode |
| `utils/` | Small pure functions with no feature ownership (date formatting, string helpers) — one file per function, never a grab-bag |

If something in `core/` starts being used by only one feature, move it back into that feature — `core/` is for things genuinely shared.

---

## 7. Before creating a new feature, check

- [ ] Does this feature need `data/domain/presentation` at all, or is it small enough for the lighter structure (Section 3)?
- [ ] Is there a real second implementation before adding an interface/impl split?
- [ ] Is the domain `type` different enough from the API shape to justify a mapper, or can the datasource return something already usable?
- [ ] Are file names free of redundant suffixes that repeat the folder?
- [ ] Is anything here actually shared across features and belongs in `core/` instead?
- [ ] Does the code inside each file follow `react-clean-code` (no logic in components/stores, named types, no magic values)?

If a folder ends up with a single pass-through file that adds no real behavior, question whether that layer was needed for this feature.