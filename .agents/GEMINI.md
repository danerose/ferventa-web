# Guía Maestra del Proyecto y Directivas del Agente (Ferventa Web)

Bienvenido al repositorio `ferventa-web`. Este archivo define las reglas de alto nivel y la arquitectura obligatoria que rige todo el desarrollo en este proyecto.

---

## 🎯 Arquitectura General

El proyecto utiliza **React 19 + TypeScript + Vite + Tailwind CSS v4 + DaisyUI 5** bajo los principios de **Clean Architecture** y **Atomic Design Estricto**.

### Estructura de Carpetas (`src/`)

```
src/
├── core/                                # Capa de Infraestructura y Transversales
│   ├── constants/                       # Constantes globales (STORAGE_KEYS, TIMEOUTS, etc.)
│   ├── enums/                           # Enums globales (UserRole, ServiceStatus, PaymentType, etc.)
│   ├── services/                        # Servicios de infraestructura (NetworkService, LocalStorage, PrintService)
│   ├── stores/                          # Stores globales (useAuthStore, usePrinterSettingsStore)
│   ├── types/                           # Tipos TypeScript compartidos y utilitarios
│   └── utils/                           # Funciones de utilidad puras (formatCurrency, formatDate, cn, etc.)
│
└── app/                                 # Módulo Principal de Negocio
    ├── domain/                          # Capa Pura de Dominio (Entities, Repositories Contracts, UseCases)
    │   ├── entities/                    # Entidades puras de negocio (Sale, Product, Appointment, etc.)
    │   ├── repository/                  # Interfaces de repositorios (ISalesRepository, IAdminRepository)
    │   └── usecases/                    # Casos de uso de negocio (CreateSaleUseCase, GetInventoryUseCase)
    ├── data/                            # Capa de Datos e Implementación (APISalesRepository, DataSources)
    │   ├── datasources/                 # Fuentes de datos de API (HTTP, Axios, Fetch)
    │   ├── model/                       # DTOs y mappers backend -> dominio
    │   └── repositories/                # Implementaciones concretas de repositorios
    └── presentation/                    # Capa de UI (React 19)
        ├── components/                  # Atomic Design Estricto
        │   ├── atoms/                   # Átomos (PrimaryButton, SecondaryButton, TextInput, Icon, KbdBadge)
        │   ├── molecules/               # Moléculas (Modal, ConfirmModal, DateTimePicker, AppointmentCard)
        │   ├── organisms/               # Organismos (Sidebar, DashboardFilters, AppointmentForm, Drawers)
        │   ├── primitives/              # Primitivos de Maquetación (Box, Flex, Grid, Stack)
        │   └── index.ts                 # Barrel exports de componentes
        └── pages/                       # Vistas / Páginas de Ruta (POSPage, InventoryPage, OperationsDashboardPage)
```

---

## 📚 Índice de Skills Disponibles (`.agents/skills/`)

Antes de crear, refactorizar o modificar cualquier componente o módulo, consulta la skill correspondiente:

| Skill | Ubicación | Propósito y Reglas Clave |
|---|---|---|
| **Skills Index** | `.agents/skills/skills-index/SKILL.md` | Índice maestro y reglas inquebrantables del proyecto. |
| **Atomic Design** | `.agents/skills/react-atomic-design/SKILL.md` | **Cero tags HTML primitivos** fuera de los átomos. Estructura de componentes React TSX. |
| **Estructura de Proyecto** | `.agents/skills/react-project-structure/SKILL.md` | Clean Architecture (`core`, `domain`, `data`, `presentation`). |
| **Clean Code** | `.agents/skills/react-clean-code/SKILL.md` | Principios SOLID, DRY, KISS, YAGNI. Tipado estricto en TS, cero `any`. |
| **Arquitectura de Código** | `.agents/skills/react-core-architecture/SKILL.md` | Enums en `src/core/enums/`, Utils en `src/core/utils/`, Zustand/Stores. |
| **Diseño UI** | `.agents/skills/design-ui/SKILL.md` | Sistema visual, tokens semánticos, modo claro/oscuro y DaisyUI 5. |
| **DaisyUI 5** | `.agents/skills/daisyui/SKILL.md` | Biblioteca de componentes UI y prototipo de uso. |

---

## ⚠️ Reglas Inquebrantables

1. **CERO TAGS PRIMITIVOS EN COMPONENTES COMPUESTOS**: Prohibido usar `<button>`, `<h1>`-`<h6>`, `<p>`, `<span>`, `<input>` directamente en páginas u organismos. Todo elemento visual debe provenir de un componente de UI (`PrimaryButton`, `SecondaryButton`, `TextInput`, `Box`, `Flex`, `Grid`, `Stack`).
2. **CERO HARDCODING DE ROLES O ESTADOS**: Todo estado o rol debe ser un `enum` exportado en `src/core/enums/`.
3. **SOPORTE RIGUROSO PARA MODO CLARO Y OSCURO**: Todos los componentes y páginas deben verse impecables tanto en Tema Claro como en Tema Oscuro (`dark:bg-slate-900 dark:text-slate-100`).
