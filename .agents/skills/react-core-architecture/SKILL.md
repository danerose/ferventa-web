---
name: react-core-architecture
description: Reglas obligatorias para la arquitectura de código en ferventa-web (React 19 + TypeScript). SIEMPRE usar esta skill al crear o editar cualquier archivo, store, servicio, tipo o componente. Gobierna la ubicación de tipos, enums, funciones de utilidad en core y la separación de capas.
---

# ferventa-web: Arquitectura de Código, Tipos, Enums y Utils en `src/core`

## 1. Propósito de esta Skill

Garantizar una separación estricta de responsabilidades en el código TypeScript y React 19:
1. `src/core` es la **única fuente de verdad** para tipos base, enums, constantes, servicios de infraestructura, stores globales de Zustand (`useAuthStore`, `usePrinterSettingsStore`) y funciones de utilidad genéricas.
2. `src/app/domain` orquesta las reglas de negocio a través de `entities`, `repository` (interfaces) y `usecases`.
3. `src/app/data` implementa el acceso a datos (`datasources`, `model`, `repositories`).
4. `src/app/presentation` maneja la interfaz en React 19 (`components`, `pages`), donde los componentes siguen **Atomic Design estricto**.

---

## 2. Regla 1 — Enums y Tipos Globales en `src/core` (Cero Hardcoding)

**Prohibido**:
- Escribir uniones literales inline sin abstraer: `status: 'pending' | 'completed'` ❌
- Usar strings mágicos en condiciones o componentes: `if (role === 'admin')` ❌

**Obligatorio**:
- Todo rol, estado, tipo de servicio o variante DEBE ser un `enum` exportado desde `src/core/enums/`:
  ```ts
  // src/core/enums/UserRole.ts
  export enum UserRole {
    Admin = 'admin',
    Cashier = 'cashier',
  }
  ```
- Todo tipo de prop compartida se define en `src/core/types/` (ej. `ButtonSize.ts`, `InputColor.ts`).

---

## 3. Regla 2 — Funciones de Utilidad en `src/core/utils/`

**Toda función de utilidad que no sea exclusiva de un único flujo interno de negocio va en `src/core/utils/`.**

- *¿Qué va en `src/core/utils/`?*:
  - Concatenación de clases de Tailwind: `cn.ts`.
  - Formateadores (`formatDate.ts`, `formatCurrency.ts`, `formatPhoneNumber.ts`).
  - Transformaciones de texto (`capitalize.ts`, `truncate.ts`).
  - Validadores genéricos (`validateEmail.ts`).

- *Prohibido*:
  - Declarar funciones utilitarias genéricas dentro del cuerpo de un componente React.
  - Crear archivos monolíticos con 50 funciones distintas. Usa utilidades modulares y exportables.

---

## 4. Regla 3 — Modos Claro y Oscuro en React (Tailwind v4)

Todo componente de presentación DEBE utilizar la variante `dark:` para garantizar excelente lectura visual:
```tsx
// ✅ Correcto: Soporte para Modo Claro y Oscuro
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
  <span className="text-slate-600 dark:text-slate-400">Detalles</span>
</div>
```

---

## 5. Checklist de Arquitectura

- [ ] ¿Los enums están en `src/core/enums/` y no hay strings mágicos quemados?
- [ ] ¿Los tipos de props e interfaces base están en `src/core/types/` o en las entidades de dominio?
- [ ] ¿Las funciones de formateo/utilidad están en `src/core/utils/`?
- [ ] ¿Se utilizan los componentes primitivos de maquetación (`Box`, `Flex`, `Grid`, `Stack`)?
- [ ] ¿Se importan los módulos con los alias `@/core/...`, `@/app/domain/...`, `@/app/data/...`, `@/app/presentation/...`?
