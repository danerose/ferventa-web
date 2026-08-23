---
name: react-atomic-design
description: Define reglas estrictas de Atomic Design (Atoms, Molecules, Organisms, Templates, Primitives) para React 19 + TypeScript. Prohibición de tags HTML primitivos (button, h1-h6, span, a, input, etc.) en componentes compuestos, protocolo de búsqueda antes de crear y tipado estricto con TSX. Consultar en cualquier tarea de UI.
---

# React 19 Atomic Design Estricto (ferventa-web)

Toda interfaz gráfica y componente en este proyecto se rige por esta skill. El objetivo es mantener un sistema de diseño consistente, desacoplado, reutilizable y escalable en React 19 + TypeScript.

---

## 0. Reglas Absolutas e Inquebrantables

1. **PROHIBICIÓN TOTAL DE ETIQUETAS/TAGS PRIMITIVOS EN COMPONENTES COMPUESTOS**:
   - **NUNCA** utilices tags nativos HTML como `<button>`, `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`, `<p>`, `<span>`, `<a>`, `<input>`, `<textarea>`, `<select>`, `<img>` directamente en páginas (`pages/`), organismos (`organisms/`) o moléculas (`molecules/`).
   - **Siempre DEBE utilizarse un componente atómico o de maquetación** para representar cualquier elemento visual.
   - Si necesitas maquetación de contenedores → usa `<Box>`, `<Flex>`, `<Grid>` o `<Stack>` de `src/app/presentation/components/primitives/`.
   - Si necesitas un botón → usa `<PrimaryButton>`, `<SecondaryButton>` o `<TertiaryButton>`.
   - Si necesitas un input → usa `<TextInput>`, `<NumberInput>` o `<AutocompleteInput>`.
   - Si necesitas una tecla o atajo → usa `<KbdBadge>`.
   - Si necesitas un icono → usa `<Icon name="..." />`.
   - La única excepción permitida para renderizar el tag nativo (`<button>`, `<input>`) es dentro de la implementación interna del propio componente átomo responsable de él.

2. **UBICACIÓN Y ESTRUCTURA DE COMPONENTES (`src/app/presentation/components/`)**:
   ```
   src/app/presentation/components/
   ├── atoms/
   │   ├── Button/
   │   │   ├── PrimaryButton.tsx
   │   │   ├── SecondaryButton.tsx
   │   │   └── TertiaryButton.tsx
   │   ├── Input/
   │   │   ├── TextInput.tsx
   │   │   ├── NumberInput.tsx
   │   │   └── AutocompleteInput.tsx
   │   ├── Icon/
   │   │   └── Icon.tsx
   │   └── KbdBadge/
   │       └── KbdBadge.tsx
   ├── molecules/
   │   ├── Modal/
   │   │   ├── Modal.tsx
   │   │   ├── ConfirmModal.tsx
   │   │   └── AlertModal.tsx
   │   ├── DateTimePicker/
   │   │   └── DateTimePicker.tsx
   │   ├── AppointmentCard/
   │   │   └── AppointmentCard.tsx
   │   └── TicketReceipt/
   │       └── TicketReceipt.tsx
   ├── organisms/
   │   ├── Sidebar/
   │   │   └── Sidebar.tsx
   │   ├── DashboardFilters/
   │   │   └── DashboardFilters.tsx
   │   ├── AppointmentForm.tsx
   │   └── Drawers/
   │       └── SaleDetailDrawer.tsx
   ├── primitives/
   │   ├── Box/Box.tsx
   │   ├── Flex/Flex.tsx
   │   ├── Grid/Grid.tsx
   │   └── Stack/Stack.tsx
   └── index.ts
   ```

3. **PROTOCOLO DE BÚSQUEDA PREVIA (SEARCH BEFORE CREATE)**:
   Antes de crear un nuevo archivo o componente:
   - Inspecciona minuciosamente `src/app/presentation/components/`.
   - Si ya existe un átomo o molécula que cubre esa función (ej. `Modal`, `SecondaryButton`, `TextInput`), **reutilízalo**.
   - Si requiere una variación de estilo o propiedad adicional, **extiende sus props con tipado estricto** (`interface ComponentProps`) en lugar de duplicarlo.

4. **REGLA DE CONEXIÓN A STORES Y REPOSITORIOS**:
   - **Átomos y Moléculas**: Tienen **PROHIBIDO** conectarse a stores globales de Zustand, servicios o llamadas API directas. Son componentes de presentación pura que reciben datos exclusivamente por `props` y notifican acciones mediante callbacks (`onClick`, `onChange`, `onConfirm`).
   - **Organismos y Páginas (`pages/`)**: Son los únicos autorizados para consumir stores de Zustand (`useAuthStore`, `usePrinterSettingsStore`) o interactuar con repositorios de la capa de datos.

---

## 1. Clasificación Atómica en React 19

| Nivel | Responsabilidad | Conexión a Store | Ejemplos en el Proyecto |
|---|---|---|---|
| **Primitivo** | Contenedor base de layout y maquetación (`div`, `flex`, `grid`). | ❌ Prohibido | `Box`, `Flex`, `Grid`, `Stack` |
| **Átomo** | Envuelve un único elemento primitivo de UI o clase de Tailwind/DaisyUI. Sin lógica de negocio. | ❌ Prohibido | `PrimaryButton`, `SecondaryButton`, `TertiaryButton`, `TextInput`, `NumberInput`, `Icon`, `KbdBadge` |
| **Molécula** | Combina 2 o más átomos en una unidad funcional simple (ej. Modal, ConfirmModal, DateTimePicker, AppointmentCard). | ❌ Prohibido | `Modal`, `ConfirmModal`, `AlertModal`, `DateTimePicker`, `AppointmentCard` |
| **Organismo** | Combina moléculas y átomos en una sección compleja de la pantalla (Sidebar, DashboardFilters, Formulario completo, Drawers). | ✅ Permitido | `Sidebar`, `DashboardFilters`, `AppointmentForm`, `SaleDetailDrawer`, `AppointmentDetailDrawer` |
| **Página (`page`)** | Pantalla completa asociada a una ruta de React Router (`src/app/presentation/pages/`). Coordina stores, UseCases y los inyecta a organismos. | ✅ Obligatorio | `POSPage`, `InventoryPage`, `OperationsDashboardPage`, `MaintenanceManagementPage`, `SettingsPage` |

---

## 2. Ejemplos de Implementación en React TSX

### Átomo: `PrimaryButton.tsx`
```tsx
import React from 'react';
import { cn } from '@/core/utils/cn';

export interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  loading = false,
  disabled = false,
  size = 'md',
  className,
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'btn btn-primary font-semibold rounded-lg transition-all duration-150 active:scale-[0.98]',
        size === 'sm' && 'btn-sm text-xs',
        size === 'lg' && 'btn-lg text-lg',
        className
      )}
      {...props}
    >
      {loading && <span className="loading loading-spinner loading-xs mr-2" />}
      {children}
    </button>
  );
};
```

---

## 3. Checklist Obligatorio

- [ ] ¿CERO tags primitivos (`<button>`, `<h1>`-`<h6>`, `<p>`, `<span>`, `<input>`) en vistas o componentes compuestos fuera del átomo base?
- [ ] ¿Se utilizaron los componentes primitivos de maquetación (`<Flex>`, `<Grid>`, `<Stack>`, `<Box>`)?
- [ ] ¿Se verificó primero si ya existía un componente similar en `components/` antes de crearlo?
- [ ] ¿Las moléculas y átomos NO tocan stores ni realizan llamadas a servicios?
- [ ] ¿Se probó la interfaz tanto en Modo Claro como en Modo Oscuro?
