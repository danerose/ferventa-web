# Master TODO — Protocolo de Auditoría Integral y Verificación Continua

Este documento establece la guía de instrucciones y el checklist paso a paso para auditar el proyecto **archivo por archivo, carpeta por carpeta y configuración por configuración**.

El objetivo es garantizar el cumplimiento al 100% de las directivas estipuladas en [AGENT.md](file:///c:/Users/Alexis/Documents/Development/Ssvel/Ferventa/ferventa-web/AGENT.md) y en las 5 skills maestras:
- [project-structure](file:///c:/Users/Alexis/Documents/Development/Ssvel/Ferventa/ferventa-web/.agents/skills/project/structure/SKILL.md)
- [daisyui](file:///c:/Users/Alexis/Documents/Development/Ssvel/Ferventa/ferventa-web/.agents/skills/design/daisyui/SKILL.md)
- [theme-palette](file:///c:/Users/Alexis/Documents/Development/Ssvel/Ferventa/ferventa-web/.agents/skills/design/theme-palette/SKILL.md)
- [atomic-design](file:///c:/Users/Alexis/Documents/Development/Ssvel/Ferventa/ferventa-web/.agents/skills/design/atomic/SKILL.md)
- [clean-code](file:///c:/Users/Alexis/Documents/Development/Ssvel/Ferventa/ferventa-web/.agents/skills/code/clean-code/SKILL.md)

---

## ⚠️ Regla de Oro: Preservación del Contexto

> **Instrucción crítica:** Ante cada carácter, tipo, función o archivo modificado, debes volver a cotejar el cambio contra las 5 skills y `AGENT.md`. Nunca asumas que un cambio menor está exento de las reglas de arquitectura, diseño atómico o tematización dinámica.

---

## Fase 1: Auditoría de Configuraciones y Raíz del Proyecto

Revisar minuciosamente cada archivo de configuración en la raíz:

- [x] **`package.json`**:
  - Verificar versiones y dependencias: React 19, TypeScript, DaisyUI 5, Tailwind CSS 4, Zustand 5.
  - Comprobar que los scripts de validación (`build`, `lint`) se ejecuten limpiamente sin errores.
- [x] **`tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json`**:
  - Validar que el modo estricto (`strict: true`) esté habilitado.
  - Validar alias de importación (`@/*` apuntando a `./src/*`).
- [x] **`vite.config.ts`**:
  - Confirmar integración correcta de `@tailwindcss/vite` y `@vitejs/plugin-react`.
- [x] **`eslint.config.js`**:
  - Confirmar que las reglas de hooks y TypeScript no tengan advertencias ignoradas.
- [x] **`index.html`**:
  - Confirmar inclusión de fuentes tipográficas modernas (`Inter`, `JetBrains Mono`), viewport y atributo de tema `data-theme` predeterminado de DaisyUI.

---

## Fase 2: Alineación Obligatoria con `project-structure` ## 2. Complete Reference Tree

> **DIRECTIVA MANDATORIA:** La estructura de carpetas y archivos de TODO el proyecto DEBE cumplir cabalmente con la referencia estipulada en [project-structure/SKILL.md ## 2. Complete Reference Tree](file:///c:/Users/Alexis/Documents/Development/Ssvel/Ferventa/ferventa-web/.agents/skills/project/structure/SKILL.md).
>
> **Si hace falta crear services, clases, datasources, modelos o nuevos archivos para cumplir con este árbol, HAY QUE CREARLOS OBLIGATORIAMENTE.**

### Checklist de Implementación Estructural del Árbol de Referencia:

- [x] **Capa `src/core/`:**
  - [x] **`constants/`:** Crear carpeta `src/core/constants/routes/routes.const.ts` y su barrel único `src/core/constants/index.ts`.
  - [x] **`di/`:** Crear `src/core/di/container.ts` (Composition Root único donde vive `new` para instanciar repositorios, datasources y casos de uso).
  - [x] **`services/`:** Crear `src/core/services/network/NetworkService.ts`, modularizar `ThermalPrintService` en su carpeta de unidad `src/core/services/print/ThermalPrintService.ts` y exportar todo mediante un único `src/core/services/index.ts`.
  - [x] **Limpieza de `src/core/index.ts`:** Eliminar importaciones prohibidas/cíclicas desde `@/app/presentation/stores`. `core` jamás debe depender de `presentation`.
- [x] **Capa `src/app/data/`:**
  - [x] **`datasources/`:** Crear `src/app/data/datasources/` con subcarpetas `local/` y `remote/` para cada dominio (`Auth/`, `Admin/`, `ClientPortal/`, `Inventory/`, `POS/`, `SpecialOrders/`, etc.) y su único barrel `src/app/data/datasources/index.ts`.
  - [x] **`model/`:** Crear `src/app/data/model/` con DTOs y mappers backend <-> entidad por dominio (`Auth/AuthSessionModel.ts`, etc.) y su único barrel `src/app/data/model/index.ts`.
  - [x] **`repositories/`:** Migrar archivos sueltos (`APIAdminRepository.ts`, etc.) a carpetas de unidad por feature (`data/repositories/Admin/AdminRepository.ts`, `data/repositories/Auth/AuthRepository.ts`, etc.) con su único barrel `src/app/data/repositories/index.ts`.
- [x] **Capa `src/app/domain/`:**
  - [x] **`entities/`:** Organizar cada entidad en su carpeta de unidad (`domain/entities/Auth/AuthSession.ts`, `domain/entities/Client/Client.ts`, etc.) bajo el único barrel `domain/entities/index.ts`.
  - [x] **`repository/`:** Unificar carpeta de contratos (eliminar duplicidad `domain/repositories` vs `domain/repository`), ubicando interfaces en `domain/repository/{Feature}/I{Feature}Repository.ts` con su único barrel `domain/repository/index.ts`.
  - [x] **`usecases/`:** Migrar casos de uso sueltos a carpetas de unidad de feature (`domain/usecases/auth/AuthUseCases.ts`, `domain/usecases/appointment/AppointmentUseCases.ts`, etc.) con su único barrel `domain/usecases/index.ts`.
- [x] **Regla de un solo `index.ts` por capa:**
  - Auditar que **ninguna** carpeta de unidad (`User/`, `Auth/`, `Button/`, etc.) ni carpeta intermedia (`atoms/`, `local/`, `remote/`) contenga un archivo `index.ts`.
- [x] **Nomenclatura obligatoria:**
  - Entidades: `{Name}.ts` dentro de `domain/entities/{Name}/`
  - Interfaces de repositorio: `I{Name}Repository.ts` dentro de `domain/repository/{Name}/`
  - Casos de uso: `{Name}UseCases.ts` dentro de `domain/usecases/{name}/`
  - Repositorios: `{Name}Repository.ts` dentro de `data/repositories/{Name}/`
  - DataSources: `{Name}LocalDataSource.ts` y `{Name}RemoteDataSource.ts` dentro de `data/datasources/{local|remote}/{Name}/`
  - Modelos/DTOs: `{Name}Model.ts` dentro de `data/model/{Name}/`
  - Stores: `{name}.store.ts` dentro de `presentation/stores/{name}/`
  - Páginas: `{Name}Page.tsx` dentro de `presentation/pages/{feature}/`
  - Enums: `{Name}.ts` dentro de `core/enums/{Name}/`
  - Utils: `{name}.util.ts` dentro de `core/utils/{topic}/`

---

## Fase 3: Auditoría de Clean Architecture y Código Limpio (`clean-code`)

Auditar línea por línea el código fuente:

- [ ] **Flujo Unidireccional:**
  - Verificar que ningún componente (`.tsx`) o store importe directamente repositorios, datasources o modelos de datos.
  - Confirmar que el flujo sea: `Componente → Store → UseCase → IRepository → Repository → DataSource`.
- [ ] **Inyección de Dependencias por Constructor:**
  - Verificar que todas las clases `UseCases` y `Repository` reciban dependencias por parámetro de constructor.
  - Confirmar que el operador `new` para estas clases viva **únicamente** en `src/core/di/container.ts`.
- [ ] **Cero Hardcoding de Valores:**
  - Ejecutar búsqueda de strings o números literales comparados (`=== 'admin'`, `=== 'pending'`, etc.).
  - Migrar todo string/estado a un `enum` en `src/core/enums/` o getter en la entidad correspondiente.
- [ ] **Archivos `.tsx` Libres de Lógica y Helpers:**
  - Verificar que ningún archivo `.tsx` declare funciones nombradas (`function format...` o `const calculate... = () =>`).
  - Mover toda lógica de cálculo, parseo y formateo a funciones puras en `src/core/utils/`.
  - Asegurar que `useState` solo se use para UI efímera (menú abierto/cerrado, dropdown activo).
  - Mover llamadas a API o dispatch de negocio de `useEffect` hacia acciones de Zustand y UseCases.
- [ ] **Responsabilidad Única por Store:**
  - Verificar que cada store controle únicamente su dominio.
  - Eliminar acceso directo a `localStorage` o `fetch` desde stores (debe pasar por UseCase → Repository → DataSource).

---

## Fase 4: Auditoría de Paleta de Temas (`theme-palette`) y DaisyUI 5 (`daisyui`)

Auditar la consistencia visual y de diseño:

- [ ] **Configuración Dual en `src/index.css`:**
  - Confirmar que `src/index.css` declara los plugins oficiales `@plugin "daisyui/theme"` para `light` (*Industrial Precision*) y `dark` (*Interstellar Logic*).
  - Validar que `data-theme="light"` y `data-theme="dark"` apliquen los tokens exactos definidos en [theme-palette/SKILL.md](file:///c:/Users/Alexis/Documents/Development/Ssvel/Ferventa/ferventa-web/.agents/skills/design/theme-palette/SKILL.md).
- [ ] **Erradicación de Colores Estáticos:**
  - Eliminar clases estáticas: `bg-white`, `text-white`, `bg-black`, `text-black`, `bg-slate-100`, `text-gray-900`, `border-gray-200`, `#hex`.
  - Usar tokens semánticos: `bg-base-100`, `bg-base-200`, `bg-base-300`, `text-base-content`, `text-base-content/70`, `bg-primary`, `text-primary-content`, `bg-secondary`, `bg-accent`, `border-base-300`.
- [ ] **Tipografía Oficial:**
  - Asegurar uso de `font-display-lg`, `font-headline-md`, `font-body-base`, `font-body-sm`.
  - Asegurar que todo dato numérico crítico (precios, códigos SKU, VINs, cantidades) use `font-data-mono` (JetBrains Mono).
- [ ] **Radios de Borde:**
  - Botones e inputs: `0.5rem` (8px).
  - Tarjetas y contenedores de panel: `1rem` (16px).
  - Chips y badges de estado: `rounded-full` (pastilla).

---

## Fase 5: Auditoría de Atomic Design (`atomic-design`)

Auditar todos los archivos dentro de `src/app/presentation/components/` y `src/app/presentation/pages/`:

- [ ] **Cero Tags Nativos Fuera de Atoms / Primitives:**
  - Buscar tags como `<button>`, `<input>`, `<a>`, `<span>`, `<p>`, `<h1>`-`<h6>`, `<select>` fuera de `atoms/` y `primitives/`.
  - Sustituirlos por sus respectivos átomos o crear el átomo faltante.
- [ ] **Identidad Única por Átomo:**
  - Verificar que ningún átomo use un `variantMap` con estilos o colores completamente dispares.
  - Comprobar que cada átomo (`PrimaryButtonAtom`, `SecondaryButtonAtom`, etc.) tenga una sola identidad justificada en una frase.
- [ ] **Tipado Estricto de Props:**
  - Verificar que las props de los átomos utilicen tipos compartidos desde `src/core/types/` (ej. `Size`), sin uniones literales inline duplicadas (`size?: 'sm' | 'md' | 'lg'`).
- [ ] **DaisyUI Confinado a Atoms:**
  - Comprobar que las clases `btn`, `input`, `badge`, `card` de DaisyUI solo se declaren dentro de átomos.

---

## Fase 6: Pruebas Automatizadas y Verificación sin Navegador (Headless)

> **Instrucción de ejecución:** Para no demorar el flujo de desarrollo, todas las pruebas unitarias y e2e deben ejecutarse **en modo headless (sin abrir la interfaz gráfica del navegador)**.

### Comandos de Verificación Requeridos

1. **Chequeo de Tipos TypeScript (Strict):**
   ```powershell
   npm run build
   # o alternativamente:
   npx tsc -b --noEmit
   ```
2. **Auditoría de Linter:**
   ```powershell
   npm run lint
   ```
3. **Pruebas Unitarias / Integración (Headless / Silent):**
   ```powershell
   npx vitest run --reporter=verbose
   ```
4. **Pruebas E2E en Modo Headless (sin abrir ventana de navegador):**
   ```powershell
   npx playwright test --headed=false
   ```

---

## Fase 7: Checklist de Aprobación Final por Archivo

Antes de cerrar la revisión de cualquier archivo:
- [ ] ¿Cumple con la estructura de carpetas de `project-structure ## 2. Complete Reference Tree` y no tiene un `index.ts` propio dentro de su subcarpeta?
- [ ] ¿Cumple con la dirección de dependencias de Clean Architecture?
- [ ] ¿Está libre de strings, números o estados hardcodeados?
- [ ] ¿No contiene funciones utilitarias declaradas dentro de un archivo `.tsx`?
- [ ] ¿Es 100% Dark/Light Mode First usando tokens semánticos de DaisyUI según `theme-palette` sin clases estáticas?
- [ ] ¿Pasó la compilación de TypeScript (`npm run build`) y el linter sin errores?
- [ ] ¿Pasaron las pruebas automatizadas en modo headless?
