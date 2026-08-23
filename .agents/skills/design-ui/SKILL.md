---
name: design-ui
description: Sistema de Diseño Visual para ferventa-web. Tokens de color, tipografía, espaciado, componentes DaisyUI 5, animación y reglas para temas Claro y Oscuro.
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  on-surface: '#0b1c30'
  on-surface-variant: '#45474c'
  primary: '#091426'
  on-primary: '#ffffff'
  secondary: '#855300'
  tertiary: '#00190e'
  error: '#ba1a1a'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  dark-background: '#090e1a'
  dark-surface: '#0f172a'
  dark-surface-bright: '#1e293b'
typography:
  sans: Inter, system-ui, sans-serif
  mono: JetBrains Mono, monospace
---

# Sistema de Diseño Visual — ferventa-web

Este sistema de diseño establece la identidad visual de alta gama para la plataforma web de gestión, punto de venta (POS) y talleres.

---

## 1. Identidad y Filosofía Visual

- **Estilo**: Diseño profesional de alta densidad de información, tarjetas limpias, bordes sutiles y micro-interacciones.
- **Tipografía**:
  - **Inter**: Para interfaz de usuario, títulos, labels y datos legibles.
  - **JetBrains Mono**: Para datos numéricos de precisión, folios, códigos SKU, barras y tickets térmicos.
- **Jerarquía y Espaciado**: Sistema basado en unidades de 4px / 8px con esquinas redondeadas modernas (`rounded-lg`, `rounded-xl`, `rounded-2xl`).

---

## 2. Paleta de Colores y Tokens Semánticos

- **Primary (`#091426` / `dark:bg-slate-900`)**: Acciones principales y encabezados corporativos.
- **Neutral / Surface**:
  - **Modo Claro**: Fondo `#f8f9ff`, Tarjetas `#ffffff`, Bordes `#e2e8f0`.
  - **Modo Oscuro**: Fondo `#090e1a`, Tarjetas `#0f172a`, Bordes `#1e293b`.
- **Badges de Estado**:
  - Exitoso / Terminado: `bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400`
  - En Proceso / Alerta: `bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400`
  - Cancelado / Error / Stock Bajo: `bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400`

---

## 3. Regla del Simulador Térmico y Recibos
- **Simulador Térmico y Recibos de Ticket (`TicketReceipt`)**:
  - Tienen prohibido aplicar modo oscuro.
  - **SIEMPRE deben mantenerse en papel blanco puro (`#ffffff`) con texto negro puro (`#000000`)** tanto en pantalla como en impresión térmica.

---

## 4. Integración con Atomic Design

Todos los elementos visuales definidos en esta guía visual se implementan **exclusivamente como componentes atómicos**:

1. **Botones**: `PrimaryButton.tsx`, `SecondaryButton.tsx`, `TertiaryButton.tsx` (en `components/atoms/Button/`).
2. **Entradas de Texto**: `TextInput.tsx`, `NumberInput.tsx`, `AutocompleteInput.tsx` (en `components/atoms/Input/`).
3. **Modales y Diálogos**: `Modal.tsx`, `ConfirmModal.tsx`, `AlertModal.tsx` (en `components/molecules/Modal/`).
4. **Layout Primitivo**: `Box.tsx`, `Flex.tsx`, `Grid.tsx`, `Stack.tsx` (en `components/primitives/`).
