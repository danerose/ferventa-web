---
name: Industrial Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45474c'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#00190e'
  on-tertiary: '#ffffff'
  tertiary-container: '#00301e'
  on-tertiary-container: '#00a472'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 16px
  margin: 24px
  max-width: 1440px
---

## Brand & Style

The brand personality is authoritative, dependable, and precision-engineered. This design system is built for high-utility environments where speed of information retrieval and accuracy of data entry are paramount. It avoids decorative excess in favor of a **Corporate / Modern** aesthetic with slight **Industrial** undertones.

The target audience consists of service advisors, mechanics, and parts managers who require a tool that feels like a physical piece of workshop equipment: sturdy, reliable, and logical. The UI should evoke a sense of organized control, reducing the cognitive load of managing complex inventory and service schedules. High whitespace and a structured grid ensure that even data-heavy screens remain legible in fast-paced workshop settings.

## Colors

The palette is anchored by **Slate 900 (#1e293b)**, providing a professional, "industrial blue" foundation that ensures high contrast for text and primary navigation. **Amber 500 (#f59e0b)** is reserved strictly for high-priority actions, warnings, and active status indicators, mimicking automotive caution lights.

- **Primary:** Navigation, primary buttons, and structural headers.
- **Accent/Warning:** Secondary actions, pending statuses, and alerts.
- **Success:** Completed repairs, paid invoices, and positive stock levels.
- **Danger:** Overdue tasks, critical stock shortages, and destructive actions.
- **Background:** A cool-toned light gray to reduce glare on shop floor tablets.

## Typography

The system utilizes **Inter** for its exceptional legibility and neutral character. For technical data—such as VIN numbers, SKU codes, and currency—**JetBrains Mono** is introduced to ensure character distinction (e.g., distinguishing '0' from 'O') which is critical in parts management.

Hierarchy is established through weight rather than dramatic size shifts. Use `label-caps` for table headers and section overviews. `data-mono` should be the default for all numerical inputs in the Point of Sale interface.

## Layout & Spacing

This design system uses a **Fluid Grid** with a 4px baseline rhythm. 

- **Desktop:** 12-column grid, 24px side margins, 16px gutters. Panels and cards should span at least 3 columns.
- **Tablet:** 8-column grid, 16px margins. Primary touch targets must maintain a minimum height of 44px.
- **Mobile:** 4-column grid, 16px margins. Data tables should transition to a "card-stack" format for legibility.

Emphasis is placed on **density**. Workshop tools benefit from seeing more data at once; therefore, vertical padding in lists and tables should be tight (`sm` or `md`) to minimize scrolling.

## Elevation & Depth

Hierarchy is achieved through **Tonal Layering** and **Low-Contrast Outlines**.

- **Level 0 (Background):** #f8fafc. Used for the application canvas.
- **Level 1 (Cards/Panels):** White surface with a 1px border (#e2e8f0). No shadow.
- **Level 2 (Modals/Dropdowns):** White surface with a soft ambient shadow (0px 4px 12px rgba(30, 41, 59, 0.08)) to indicate temporary interaction layers.
- **Active State:** Elements being dragged or interacted with should use a subtle glow of the primary color rather than heavy black shadows.

## Shapes

The design system employs a **Soft** shape language. 

- **Components:** Buttons, inputs, and small widgets use a 0.25rem (4px) radius to maintain a professional, organized look.
- **Containers:** Large cards and dashboard panels use a 0.5rem (8px) radius.
- **Indicators:** Status badges (chips) are fully rounded (pill-shaped) to distinguish them from interactive buttons.

This subtle rounding balances the industrial hardness of the dark color palette with modern software expectations.

## Components

### Buttons
- **Primary:** Solid #1e293b with white text. 4px radius. High emphasis.
- **Secondary:** Border 1px #cbd5e1, background transparent, text #1e293b.
- **Action (Accent):** Solid #f59e0b with white text for "Add to Cart" or "Finalize Repair."

### Inputs & Fields
- **Default State:** 1px border #cbd5e1, 4px radius.
- **Focus State:** 2px border #1e293b.
- **Critical Data:** Use monospaced font for price and quantity inputs.

### Chips/Badges
- **Status Indicators:** Use light tinted backgrounds with dark text (e.g., Success: #dcfce7 background with #10b981 text).

### Data Tables
- Header background: #f1f5f9.
- Row border-bottom: 1px #f1f5f9.
- Hover state: #f8fafc.
- Tables are the core of the system; use "Condensed" vertical padding (8px) to maximize data density.

### Cards
- White background, 1px border #e2e8f0.
- Headers within cards should have a subtle bottom divider to separate metadata from the body content.