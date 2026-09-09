# Guía Maestra del Proyecto y Directivas de Agente — Ferventa Web

Bienvenido al repositorio **Ferventa Web**. Este documento define el contexto integral de la aplicación, el stack tecnológico, los principios arquitectónicos obligatorios, las reglas inquebrantables (no negociables) y la referencia canónica a todas las skills del sistema.

Cualquier agente o desarrollador que trabaje en este proyecto **debe seguir estas directivas sin excepción**.

---

## 1. Contexto de la Aplicación

**Ferventa Web** es una plataforma integral de autogestión para talleres mecánicos, centros de servicio automotriz y punto de venta de refacciones/autopartes.

### Módulos Principales
- **Portal de Clientes (`ClientPortalPage`):** Agendamiento de citas, consulta de estatus de servicios y cotizaciones de clientes.
- **Autenticación (`LoginPage`):** Control de acceso protegido basado en roles (`admin`, `mecanico`, `recepcion`, etc.).
- **Gestión de Citas y Taller (`AdminDashboardPage`):** Control visual de citas, estados de recepción, asignación de bahías/mecánicos.
- **Tablero de Operaciones (`OperationsDashboardPage`):** Métricas operativas en tiempo real, productividad de mecánicos y flujo de trabajo.
- **Punto de Venta / POS (`POSPage`):** Venta directa en mostrador de refacciones, emisión de tickets y cobro multimoneda.
- **Control de Inventario y Proveedores (`InventoryPage`):** Stock de autopartes, alertas de mínimos, entradas, salidas y proveedores.
- **Gestión de Mantenimientos (`MaintenanceManagementPage`):** Catálogo de paquetes de afinación, servicios preventivos y correctivos.
- **Control de Asistencia (`AttendancePage`):** Registro de turnos y asistencias del personal del taller.
- **Pedidos Especiales / Órdenes Especiales (`SpecialOrdersPage`):** Gestión de refacciones bajo encargo, anticipos y recepción directa.
- **Configuración y Horarios (`ScheduleSettingsPage`, `SettingsPage`, `UsersPage`):** Horarios de atención, bahías disponibles y administración de usuarios.

---

## 2. Stack Tecnológico

- **Framework & Runtime:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Empaquetador & Dev Server:** [Vite 8](https://vite.dev/)
- **Estilos & Utility CSS:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Librería de Componentes & Temas:** [DaisyUI 5](https://daisyui.com/)
- **Enrutamiento:** [React Router DOM 7](https://reactrouter.com/)
- **Gestor de Estado Global:** [Zustand 5](https://zustand-demo.pmnd.rs/)
- **Iconografía:** [Lucide React](https://lucide.dev/)
- **Utilidades de Clases:** `clsx` + `tailwind-merge`

---

## 3. Arquitectura del Proyecto

El proyecto está estructurado estrictamente bajo los principios de **Clean Architecture** (separación en 4 capas) combinada con **Atomic Design** en la capa de presentación:

```
src/
├── core/                                # Capa Transversal e Infraestructura
│   ├── constants/                       # Constantes globales compartidas
│   ├── di/                              # Contenedor único de Inyección de Dependencias (container.ts)
│   ├── enums/                           # Enums globales (roles, estados, tipos de pago...)
│   ├── services/                        # Servicios de red y storage (NetworkService, etc.)
│   ├── types/                           # Tipos TypeScript transversales (Size, etc.)
│   └── utils/                           # Funciones de utilidad puras sin estado
│
└── app/                                 # Módulo de Dominio y Negocio
    ├── domain/                          # Capa Pura de Negocio (sin dependencias de UI/React)
    │   ├── entities/                    # Entidades puras y reglas de dominio
    │   ├── repository/                  # Interfaces de repositorios (IAuthRepository, etc.)
    │   └── usecases/                    # Casos de uso específicos
    ├── data/                            # Implementación de Datos e I/O
    │   ├── datasources/                 # Fuentes de datos (local y remote)
    │   ├── model/                       # DTOs y mappers backend <-> entidad
    │   └── repositories/                # Implementaciones concretas de los repositorios
    └── presentation/                    # Capa Visual y de Interfaz (React 19)
        ├── components/                  # Atomic Design Estricto (primitives, atoms, molecules, organisms, templates)
        ├── pages/                       # Vistas completas vinculadas a rutas
        └── stores/                      # Stores de Zustand (un store por dominio)
```

---

## 4. Reglas Inquebrantables (No Negociables)

1. **Flujo de Dependencias Unidireccional:**
   `Componente (.tsx) → Store (Zustand) → UseCase → IRepository → Repository (data) → DataSource (local/remote) → NetworkService / Storage`.
   Ningún componente ni store puede saltarse este flujo para invocar un repositorio o datasource directamente. Los repositorios delegan I/O a DataSources y consumen `NetworkService`; nunca hacen `fetch()` directo ni leen `localStorage` por su cuenta.
2. **Inyección de Dependencias por Constructor:**
   Toda clase (`UseCase`, `Repository`, `DataSource`) recibe sus dependencias por constructor. Queda prohibido el uso de `new` fuera del Composition Root: [core/di/container.ts](file:///c:/Users/Alexis/Documents/Development/Ssvel/Ferventa/ferventa-web/src/core/di/container.ts).
3. **Cero Tags Nativos Fuera de Atoms y Primitives:**
   Queda estrictamente prohibido usar `<button>`, `<input>`, `<a>`, `<span>`, `<h1>`-`<h6>`, `<p>`, etc., dentro de Molecules, Organisms, Templates o Pages. Si se necesita un elemento nativo, debe consumirse un Atom existente o crearse uno nuevo.
4. **Dark/Light Mode First — Cero Colores Estáticos:**
   Prohibido usar clases de color fijo como `bg-white`, `text-white`, `bg-black`, `bg-slate-100`, `text-gray-900` o `#hex`. Todo elemento visual debe emplear tokens semánticos de DaisyUI (`bg-base-100`, `bg-base-200`, `text-base-content`, `bg-primary`, `border-base-300`). La única excepción permitida son alertas o estados fijos (`alert-success`, `text-error`, etc.) que requieran el mismo color en ambos temas.
5. **Cero Hardcoding de Valores:**
   Prohibido comparar contra cadenas o números literales (`user.role === 'admin'`). Todo estado, rol o categoría debe provenir de `core/enums/` o getters de la entidad.
6. **Cero Lógica o Funciones Utilitarias en Archivos `.tsx`:**
   Los archivos `.tsx` solo contienen JSX, destructuring de props, selectors de stores y `useState` exclusivamente para estado efímero de UI. Ninguna función utilitaria, formateo inline (`toLocaleDateString`) ni `useEffect` con lógica de negocio está permitido en un `.tsx`.
7. **Una Carpeta por Unidad, UN SOLO `index.ts` por Capa:**
   Cada entidad, átomo, repositorio o usecase vive en su propia carpeta, pero **nunca** lleva un `index.ts` en su carpeta de unidad ni en carpetas intermedias. Solo existe exactamente un `index.ts` en la raíz de cada capa (`entities/index.ts`, `components/index.ts`, etc.).
8. **Identidad Única por Átomo:**
   Un átomo representa un único diseño visual, no una familia de diseños controlada por un `variantMap` de colores o estilos.
9. **Cumplimiento Estricto del Árbol de Referencia Canónico (`project-structure` ## 2):**
   La estructura de directorios y archivos debe cumplir obligatoriamente con el árbol definido en [project-structure/SKILL.md ## 2. Complete Reference Tree](file:///c:/Users/Alexis/Documents/Development/Ssvel/Ferventa/ferventa-web/.agents/skills/project/structure/SKILL.md). Si faltan capas de infraestructura, servicios (ej. `NetworkService`), contratos, modelos DTO, datasources locales/remotos, o el contenedor de dependencias (`container.ts`), **es mandatorio crearlos** para lograr el 100% de apego a la arquitectura.
10. **Prohibición de Repositorios Nombrados por Rol ("God Repositories"):**
    Queda estrictamente prohibido crear repositorios o carpetas basados en roles de usuario (`AdminRepository`, `MechanicRepository`). Los repositorios representan agregados de dominio o contextos delimitados (ej. `AppointmentRepository`, `MaintenanceRepository`, `InventoryRepository`, `BranchRepository`).
11. **Catálogo Centralizado de Endpoints (Cero URLs Hardcodeadas):**
    Queda estrictamente prohibido hardcodear rutas o URLs de API en cadenas de texto dentro de métodos (`fetchWithAuth('/appointments/...')`). Toda ruta debe residir en `src/core/constants/endpoints/api.endpoints.ts`.
12. **Control de Acceso Basado en Roles (RBAC) Obligatorio:**
    Toda ruta protegida, vista y acción sensible debe ser validada mediante tokens de permisos o roles tipados (`UserRole`), utilizando `ProtectedRoute` con `allowedRoles`, el hook `useAuthorization()` o el componente `<Authorize>`. Prohibido el acceso no restringido a rutas de administración y la comparación manual de strings de roles.

---

## 5. Índice y Referencias a las Skills Oficiales

El desarrollo del proyecto está gobernado por las siguientes 5 skills maestras:

| Skill | Archivo Maestro | Cobertura y Responsabilidad |
|---|---|---|
| **`project-structure`** | [.agents/skills/project/structure/SKILL.md](file:///c:/Users/Alexis/Documents/Development/Ssvel/Ferventa/ferventa-web/.agents/skills/project/structure/SKILL.md) | Estructura completa de carpetas, un solo `index.ts` por capa, tabla de nomenclatura por archivo y árbol de decisiones. |
| **`atomic-design`** | [.agents/skills/design/atomic/SKILL.md](file:///c:/Users/Alexis/Documents/Development/Ssvel/Ferventa/ferventa-web/.agents/skills/design/atomic/SKILL.md) | Sistema atómico (Primitives, Atoms, Molecules, Organisms, Templates), regla Dark/Light Mode First, tipado en `core/types` y protocolo de búsqueda previa. |
| **`clean-code`** | [.agents/skills/code/clean-code/SKILL.md](file:///c:/Users/Alexis/Documents/Development/Ssvel/Ferventa/ferventa-web/.agents/skills/code/clean-code/SKILL.md) | Clean Architecture, DI por constructor en `container.ts`, SOLID/KISS/DRY, cero lógica en `.tsx`, stores de responsabilidad única. |
| **`daisyui`** | [.agents/skills/design/daisyui/SKILL.md](file:///c:/Users/Alexis/Documents/Development/Ssvel/Ferventa/ferventa-web/.agents/skills/design/daisyui/SKILL.md) | Guía oficial de DaisyUI 5, protocolo de selección semántica de componentes y configuración de temas. |
| **`theme-palette`** | [.agents/skills/design/theme-palette/SKILL.md](file:///c:/Users/Alexis/Documents/Development/Ssvel/Ferventa/ferventa-web/.agents/skills/design/theme-palette/SKILL.md) | Paletas oficiales: Light (*Industrial Precision*) y Dark (*Interstellar Logic*), tokens de color, tipografía y mapeo en `src/index.css`. |

### Verificación de Sub-referencias en `daisyui/SKILL.md`
Se ha verificado que la skill [daisyui/SKILL.md](file:///c:/Users/Alexis/Documents/Development/Ssvel/Ferventa/ferventa-web/.agents/skills/design/daisyui/SKILL.md) enlaza correctamente a todos sus módulos secundarios relativos existentes en el proyecto:
- **Instalación:** `[./install/SKILL.md](./install/SKILL.md)` → Localizado y verificado en `.agents/skills/design/daisyui/install/SKILL.md`.
- **Uso de clases:** `[./usage/SKILL.md](./usage/SKILL.md)` → Localizado y verificado en `.agents/skills/design/daisyui/usage/SKILL.md`.
- **Configuración de temas:** `[./config/SKILL.md](./config/SKILL.md)` → Localizado y verificado en `.agents/skills/design/daisyui/config/SKILL.md`.
- **Colores y paleta:** `[./colors/SKILL.md](./colors/SKILL.md)` → Localizado y verificado en `.agents/skills/design/daisyui/colors/SKILL.md`.
- **Catálogo de 68 componentes:** `[./components/](./components/)` → Localizado y verificado en `.agents/skills/design/daisyui/components/` (todos los enlaces individuales como `button.md`, `modal.md`, `drawer.md`, etc., están presentes).

---

## 6. Mantenimiento del Contexto

Cualquier cambio de código, por mínimo que sea (incluso una sola línea, tipo o función), debe validar que **no rompa ninguna de las reglas anteriores**. Si existe duda, el agente debe re-consultar el archivo de skill correspondiente antes de proceder.
