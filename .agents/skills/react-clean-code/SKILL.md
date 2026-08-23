---
name: react-clean-code
description: Reglas estrictas de Clean Code, SOLID, DRY, KISS, YAGNI, TypeScript estricto y React 19 para el proyecto ferventa-web. OBLIGATORIO consultar y seguir en cada tarea de código nuevo, refactor o modificación.
---

# React 19 + TypeScript Clean Code (ferventa-web)

Esta skill define los estándares de calidad y código limpio obligatorios para todo el código React 19 + TypeScript generado en este proyecto. No son sugerencias estilísticas; son **reglas estrictas** que garantizan código testeable, mantenible y escalable.

---

## 1. Principios Fundamentales

Todo código debe cumplir estrictamente con:

- **SOLID**:
  - **Single Responsibility (SRP)**: Una función, componente, store o archivo tiene una única razón para cambiar.
  - **Open/Closed (OCP)**: Abierto a extensión, cerrado a modificación directa mediante props y abstracciones.
  - **Liskov Substitution (LSP)**: Subtipos y componentes derivados deben cumplir el contrato base.
  - **Interface Segregation (ISP)**: Interfaces pequeñas y específicas en lugar de interfaces monolíticas.
  - **Dependency Inversion (DIP)**: Los módulos de alto nivel dependen de abstracciones (interfaces en `domain/repository`), no de implementaciones concretas.
- **DRY (Don't Repeat Yourself)**: Cero duplicación de lógica. Si una función o cálculo se repite, se extrae a `src/core/utils/` o a un hook reutilizable.
- **KISS (Keep It Simple, Stupid)**: La solución más clara y directa es superior a abstracciones innecesarias o trucos complejos.
- **YAGNI (You Aren't Gonna Need It)**: No programes funcionalidades anticipadas o código especulativo.
- **Explícito sobre Implícito**: Nombres descriptivos, tipado estricto, flujo de datos unidireccional y transparente.

---

## 2. Nomenclatura Estricta

- **Variables y Estado**: Deben describir exactamente su contenido o propósito (`authenticatedUser`, `activeSaleList`, `isSubmittingForm`).
  - *Prohibidos*: nombres vagos como `data`, `temp`, `obj`, `val`, `item`, `res`, `stuff`.
- **Funciones y Handlers**: Verbos que indican una acción clara (`fetchClientList`, `handleCreateSale`, `validatePhoneNumber`).
- **Booleanos**: Deben leerse como pregunta o estado (`isLoading`, `hasPermission`, `isLowStock`, `canSubmit`).
- **Enums y Constantes**: PascalCase para el enum e IS_CONSTANT para constantes clave (`export enum UserRole { Admin = 'admin', Cashier = 'cashier' }`).

---

## 3. Cero Hardcoding (Regla Estricta)

Queda **terminantemente prohibido** hardcodear valores literales mágicos en componentes o páginas:

### 3.1 Roles, Estados y Tipos Fijos → `src/core/enums/`
Nunca utilices strings directos como `'admin'`, `'in_progress'`, `'completed'`:
```tsx
// ❌ Prohibido: string literal suelto o hardcodeado
if (user.role === 'admin') { ... }
const status = 'in_progress';

// ✅ Obligatorio: uso de Enums declarados en src/core/enums/
import { UserRole } from '@/core/enums/UserRole';
import { ServiceStatus } from '@/core/enums/ServiceStatus';

if (user.role === UserRole.Admin) { ... }
const status = ServiceStatus.InProgress;
```

---

## 4. Funciones de Utilidad (Utils / Helpers)

**Toda función de utilidad transversal o genérica DEBE ubicarse en `src/core/utils/`.**

- Un componente **NUNCA** debe contener funciones utilitarias como `formatDate`, `formatCurrency`, `cn`, etc. declaradas inline si se pueden reutilizar.
- Utiliza la función `cn(...)` de `@/core/utils/cn` para combinar clases de Tailwind CSS sin duplicados o conflictos.

```tsx
// ✅ Importar la utilidad desde src/core/utils
import { formatCurrency } from '@/core/utils/formatCurrency';
import { cn } from '@/core/utils/cn';
```

---

## 5. Tipado Estricto de TypeScript

- **Cero `any`**: Prohibido usar `any`. Usa `unknown`, genéricos o tipos discriminados.
- **Tipos e Interfaces en `src/core/types` o `src/app/domain/entities`**: Nunca declares tipos globales inline en componentes.
- Tipar siempre props de componentes React (`interface ComponentProps`), parámetros de funciones y valores de retorno.

---

## 6. Checklist Obligatorio de Clean Code

- [ ] ¿Cumple con SOLID, DRY, KISS y YAGNI?
- [ ] ¿Cero strings o roles hardcodeados? (¿Están en `src/core/enums/`?).
- [ ] ¿Todas las funciones de formateo y utilidades están en `src/core/utils/`?
- [ ] ¿No hay tipos `any` ni uniones literales inline sin nombre?
- [ ] ¿El componente funciona e ilustra contraste limpio en Tema Claro y Tema Oscuro?
