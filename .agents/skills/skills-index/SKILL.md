---
name: skills-index
description: Índice maestro de todas las skills del proyecto ferventa-web (React 19 + TypeScript). OBLIGATORIO consultar SIEMPRE al iniciar cualquier tarea de código, UI, arquitectura, refactor o modificación — antes de crear, editar o revisar cualquier archivo. Establece las reglas estrictas de Clean Code, Atomic Design, Clean Architecture y React 19.
---

# Índice Maestro de Skills — ferventa-web (React 19 + TypeScript)

Este es el punto de entrada obligatorio antes de escribir o modificar una sola línea de código en el proyecto `ferventa-web`.

---

## 1. Mapa de Skills

| Skill | Archivo | Cuándo Consultarla | Reglas Clave |
|---|---|---|---|
| **Clean Code** | `.agents/skills/react-clean-code/SKILL.md` | Al escribir o revisar cualquier función, clase, store o componente React. | SOLID, DRY, KISS, YAGNI. Cero strings o roles hardcodeados (usar `src/core/enums/`). Utils en `src/core/utils/`. Cero `any` en TypeScript. |
| **Atomic Design** | `.agents/skills/react-atomic-design/SKILL.md` | Al crear, editar o revisar componentes visuales o páginas en React. | **Cero tags HTML primitivos** (`<button>`, `<h1>`-`<h6>`, `<p>`, `<span>`, `<a>`, `<input>`) fuera del átomo base. Componentes atómicos (`PrimaryButton`, `SecondaryButton`, `TextInput`, `Box`, `Flex`, `Grid`, `Stack`). Átomos y Moléculas NO tocan llamadas API o stores. |
| **Estructura del Proyecto** | `.agents/skills/react-project-structure/SKILL.md` | Al decidir la ubicación de cualquier archivo nuevo o refactorizar carpetas. | Clean Architecture: `src/core/`, `src/app/data/` (`datasources`, `model`, `repositories`), `src/app/domain/` (`entities`, `repository`, `usecases`), `src/app/presentation/` (`components`, `pages`). |
| **Arquitectura de Código** | `.agents/skills/react-core-architecture/SKILL.md` | Al crear enums, tipos, utilidades o conectar capas de datos y Zustand stores. | Enums y Types en `src/core/`. Utils genéricos en `src/core/utils/`. Los stores/vistas consumen UseCases o Repositorios de Dominio. |
| **UI / Diseño Visual** | `.agents/skills/design-ui/SKILL.md` | Al diseñar interfaces, estilos, paleta de colores y componentes visuales. | Sistema visual responsivo, soporte perfecto para Modo Claro y Modo Oscuro (`dark:`), tokens de color, tipografía Inter / JetBrains Mono, espaciados y componentes DaisyUI 5. |
| **DaisyUI 5** | `.agents/skills/daisyui/SKILL.md` | Al utilizar o consultar clases de la biblioteca de UI DaisyUI 5 para Tailwind. | Clases semánticas DaisyUI 5 (`btn`, `modal`, `card`, `badge`, `table`, `drawer`, etc.) combinadas con sintaxis Tailwind v4. |

---

## 2. Reglas Inquebrantables del Proyecto

1. **PROHIBIDO usar tags HTML primitivos** (`<button>`, `<h1>`-`<h6>`, `<p>`, `<span>`, `<a>`, `<input>`, etc.) en páginas u organismos compuestos fuera de los componentes de UI. Todo elemento DEBE utilizar un componente atómico o de maquetación (`PrimaryButton`, `SecondaryButton`, `TextInput`, `Box`, `Flex`, `Grid`, `Stack`).
2. **CERO HARDCODING DE ROLES O ESTADOS**: Todo rol, estado de servicio, tipo de pago o filtro DEBE ser un `enum` exportado desde `src/core/enums/`. Cero strings mágicos en lógica de negocio.
3. **UTILS EN CORE**: Toda función utilitaria (`formatDate`, `formatCurrency`, `cn`, `truncate`, etc.) DEBE residir en `src/core/utils/`. Prohibido declararlas dentro de componentes o stores.
4. **SOPORTE RIGUROSO MODO CLARO / OSCURO**: Todo componente visual DEBE responder limpiamente tanto a tema claro como a modo oscuro con contraste adecuado (evitando textos oscuros sobre fondo oscuro o textos blancos en modo claro).
5. **TYPESCRIPT ESTRICTO (CERO ANY)**: Prohibido usar `any`. Utiliza `unknown`, genéricos o tipos discriminados.

---

## 3. Checklist Previo a Entregar Cualquier Tarea

- [ ] ¿Consulté las skills aplicables según la tarea?
- [ ] ¿Verifiqué si existía un componente atómico similar en `src/app/presentation/components/` antes de crear uno nuevo?
- [ ] ¿No existen tags primitivos directos (`<button>`, `<h1>`, etc.) en vistas o componentes compuestos?
- [ ] ¿No hay roles o cadenas mágicas hardcodeadas? (Uso de `src/core/enums/`).
- [ ] ¿No hay utilidades inline o redundantes? (Uso de `src/core/utils/`).
- [ ] ¿El componente se visualiza correctamente en Modo Claro y Modo Oscuro?
- [ ] ¿Se ejecutó `npm run build` con 0 errores TypeScript?
