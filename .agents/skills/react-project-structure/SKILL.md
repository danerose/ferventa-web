---
name: react-project-structure
description: Reglas estrictas de arquitectura de carpetas (Clean Architecture + Atomic Design) para el proyecto ferventa-web (React 19 + TypeScript). OBLIGATORIO consultar antes de crear o ubicar cualquier archivo en el proyecto.
---

# Estructura del Proyecto y Clean Architecture — ferventa-web (React 19)

Este documento define la arquitectura limpia (Clean Architecture) y la organización estricta de carpetas para el proyecto `ferventa-web`.

---

## 1. Estructura Global de Carpetas (`src/`)

El proyecto sigue una separación rigurosa dividida entre `src/core/` (infraestructura y transversales) y `src/app/` (lógica de negocio y presentación en React):

```
src/
├── core/                                # Capa transversal y de infraestructura global
│   ├── constants/                       # Constantes globales (STORAGE_KEYS, API_ENDPOINTS, TIMEOUTS)
│   ├── enums/                           # Enums globales (UserRole, ServiceStatus, PaymentType, etc.)
│   ├── services/                        # Servicios transversales (NetworkService, LocalStorage, PrintService)
│   ├── stores/                          # Stores globales de Zustand (useAuthStore, usePrinterSettingsStore)
│   ├── types/                           # Tipos base y utilitarios globales de TypeScript
│   ├── utils/                           # Funciones de utilidad puras (cn, formatDate, formatCurrency, validation)
│   └── index.ts                         # Barrel export de core
│
├── app/                                 # Módulo principal de la aplicación y negocio
│   │
│   ├── domain/                          # Capa Pura de Dominio (Cero dependencias de React, UI o Data)
│   │   ├── entities/                    # Entidades puras de negocio (Sale, Product, Appointment, Branch)
│   │   ├── repository/                  # Interfaces / contratos de repositorios (ISalesRepository, IAdminRepository)
│   │   ├── usecases/                    # Casos de uso de negocio (CreateSaleUseCase, GetInventoryUseCase)
│   │   └── index.ts
│   │
│   ├── data/                            # Capa de Datos (Implementaciones de persistencia y API)
│   │   ├── datasources/                 # Fuentes de datos remotas o locales (APISalesDataSource)
│   │   ├── model/                       # DTOs y modelos de datos externos con mappers hacia entidades
│   │   ├── repositories/                # Implementaciones concretas de los repositorios de dominio
│   │   └── index.ts
│   │
│   └── presentation/                    # Capa de Presentación / UI (React 19)
│       ├── components/                  # Componentes con Atomic Design estricto
│       │   ├── atoms/                   # Átomos (Button/, Input/, Icon/, KbdBadge/)
│       │   ├── molecules/               # Moléculas (Modal/, DateTimePicker/, AppointmentCard/)
│       │   ├── organisms/               # Organismos (Sidebar/, DashboardFilters/, Drawers/)
│       │   ├── primitives/              # Componentes de maquetación (Box, Flex, Grid, Stack)
│       │   └── index.ts
│       ├── pages/                       # Vistas / Páginas de ruta React (POSPage, InventoryPage, etc.)
│       └── index.ts
│
├── assets/                              # Estilos globales (index.css, tailwind/daisyui), fuentes e imágenes
├── App.tsx                              # Componente raíz de la aplicación con Router
└── main.tsx                             # Punto de entrada principal de React 19
```

---

## 2. Flujo de Datos y Capas

El flujo de dependencias siempre apunta hacia adentro (hacia el Dominio):

```
┌────────────────────────────────────────────────────────┐
│               src/app/presentation                     │
│  [Pages / Organisms] ────(hooks / state)────► [Stores]  │
└───────────────────────────┬────────────────────────────┘
                            │ ejecuta / consume
                            ▼
┌────────────────────────────────────────────────────────┐
│                     src/app/domain                     │
│               [UseCases / Entities]                    │
│                      │ interactúa con                  │
│                      ▼                                 │
│             [Repository Interfaces]                    │
└───────────────────────────▲────────────────────────────┘
                            │ implementa
┌───────────────────────────┴────────────────────────────┐
│                      src/app/data                      │
│             [Repository Impls]                         │
│                      │ consume                         │
│                      ▼                                 │
│                [DataSources / DTOs]                    │
└───────────────────────────┬────────────────────────────┘
                            │ utiliza
                            ▼
┌────────────────────────────────────────────────────────┐
│                       src/core                         │
│   [Enums] [Utils] [Services] [Stores] [Types]          │
└────────────────────────────────────────────────────────┘
```

---

## 3. Reglas Estrictas por Capa

### 3.1 `src/core/`
- Contiene todo elemento transversal que no pertenezca a un flujo exclusivo de negocio.
- `enums/`: **Obligatorio** para todos los roles, estados, métodos de pago y opciones (`UserRole.ts`, `ServiceStatus.ts`). Cero strings hardcodeados.
- `utils/`: Todas las funciones de utilidad puras (`cn.ts`, `formatCurrency.ts`, `formatDate.ts`).
- `services/`: Servicios globales de infraestructura (`printTicketService.ts`, `LocalStorageService`).
- `stores/`: Stores de Zustand globales (`useAuthStore.ts`, `usePrinterSettingsStore.ts`).

### 3.2 `src/app/domain/`
- Es la capa más pura. **NO depende de React, Hooks, UI ni de Data**.
- `entities/`: Interfaces o tipos TypeScript puros de negocio (`Sale`, `Product`, `Appointment`).
- `repository/`: Contratos de interfaces (`export interface ISalesRepository`).
- `usecases/`: Clases u orquestadores que ejecutan acciones de negocio.

### 3.3 `src/app/data/`
- Implementa los contratos definidos en `src/app/domain/repository/`.
- `model/`: DTOs que mapean respuestas del backend hacia las `Entities` de dominio.
- `repositories/`: Implementaciones de los repositorios consumiendo APIs HTTP (`APISalesRepository.ts`).

### 3.4 `src/app/presentation/` (Components, Pages)
- **Componentes (`src/app/presentation/components/`)**:
  - Atomic Design estricto (`atoms`, `molecules`, `organisms`, `primitives`).
  - Prohibido el uso de tags primitivos (`<button>`, `<h1>`-`<h6>`, `<p>`, `<span>`, `<input>`) fuera del átomo o primitivo base.
  - Átomos y Moléculas **NUNCA** tocan llamados API o servicios directamente.
- **Páginas (`src/app/presentation/pages/`)**:
  - Páginas asociadas a cada ruta (ej. `POSPage.tsx`, `InventoryPage.tsx`).

---

## 4. Checklist para Nuevos Archivos o Pantallas

- [ ] ¿El archivo fue ubicado en la capa correcta (`src/core/`, `src/app/domain/`, `src/app/data/`, `src/app/presentation/`)?
- [ ] ¿Si es un tipo o enum transversal, está en `src/core/enums/` o `src/core/types/`?
- [ ] ¿Si es un formateador o helper, está en `src/core/utils/` y no inline?
- [ ] ¿El componente UI está categorizado en `atoms`, `molecules`, `organisms`, `primitives` o `pages`?
- [ ] ¿No existen tags primitivos sueltos en las páginas u organismos?
