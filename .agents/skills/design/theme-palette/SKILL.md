---
name: theme-palette
description: Official design system theme palette and color configuration skill for Ferventa Web. Defines the dual-theme system — Light Mode ("Industrial Precision") and Dark Mode ("Interstellar Logic") —, their complete Material/Industrial design tokens, and their exact semantic mappings to DaisyUI 5 and Tailwind CSS v4. Use this whenever working on colors, themes, backgrounds, borders, typography, or UI styling across the application.
---

# Theme Palette — Dual Design System (Industrial Precision & Interstellar Logic)

## 0. When It Triggers
- You are styling or creating any UI component (Primitive, Atom, Molecule, Organism, Template, Page).
- You need to select colors for backgrounds, text, borders, buttons, badges, alerts, or interactive states.
- You are configuring or modifying theme CSS variables in `src/index.css`.
- You need to verify that a component responds accurately to theme switching between Light and Dark modes.

---

## 1. System Overview

Ferventa Web employs a tailored **Dual-Theme Design System** engineered for high-density automotive workshop environments:

| Mode | Theme Name | Philosophy & Aesthetic | Primary Focus |
|---|---|---|---|
| **Light** | **Industrial Precision** | Sturdy, authoritative, corporate modern with industrial workshop cues. | High contrast, daylight legibility on tablets, cool-tinted canvas to eliminate screen glare. |
| **Dark** | **Interstellar Logic** | Sleek, technical, pro-tool minimalism with deep-space dark tones. | Reduced eye fatigue for power users, deep surfaces with tonal elevation, vibrant technical accents. |

---

## 2. Color Tokens & Semantic DaisyUI 5 Mapping

Both themes map to DaisyUI 5 semantic color classes. **Never use static Tailwind colors** (`bg-white`, `text-black`, etc.). Always use DaisyUI semantic tokens:

### Palette Mapping Table

| Semantic Role | DaisyUI Token | Light Mode: *Industrial Precision* | Dark Mode: *Interstellar Logic* | Usage / Purpose |
|---|---|---|---|---|
| **Base Surface (Canvas)** | `bg-base-100` | `#f8f9ff` (cool surface) | `#10131a` (deep slate/black) | Application background canvas, modal backdrop, default card base. |
| **Elevated Surface (Panels)** | `bg-base-200` | `#e5eeff` (container) | `#181c22` (elevated container) | Secondary cards, sidebars, drawer panels, table headers. |
| **Highest Surface (Borders/Hover)** | `bg-base-300` | `#d3e4fe` (highest container) | `#272a31` (high container) | Hover states, active list rows, subtle dividers, borders. |
| **Base Text** | `text-base-content` | `#0b1c30` (deep industrial slate) | `#e0e2eb` (crisp cool white) | Body text, table data, primary headings. |
| **Muted / Secondary Text** | `text-base-content/70` | `#45474c` (slate-variant) | `#c1c6d5` (cool-grey variant) | Labels, helper text, timestamps, table column headers. |
| **Primary Action** | `bg-primary`, `btn-primary` | `#091426` (deep navy industrial) | `#aac7ff` (technical sky blue) | The single primary CTA per screen/section. |
| **Primary Text/Content** | `text-primary-content` | `#ffffff` | `#002f64` | Text inside primary buttons/badges. |
| **Secondary Action** | `bg-secondary`, `btn-secondary` | `#855300` (warm industrial amber) | `#aec7f7` (cool-toned blue-grey) | Supporting actions, filters, paired secondary CTAs. |
| **Secondary Content** | `text-secondary-content` | `#ffffff` | `#143057` | Text inside secondary buttons/badges. |
| **Accent / Highlight** | `bg-accent`, `btn-accent` | `#fea619` (caution amber) | `#e3711f` (burnt orange technical) | Action emphasis, caution badges, POS highlight items. |
| **Accent Content** | `text-accent-content` | `#684000` | `#ffffff` | Text inside accent elements. |
| **Neutral Container** | `bg-neutral`, `btn-neutral` | `#1e293b` (slate 900) | `#272a31` (neutral dark container) | Structural headers, dark badges, code blocks. |
| **Neutral Content** | `text-neutral-content` | `#ffffff` | `#e0e2eb` | Text inside neutral containers. |
| **Info Status** | `alert-info`, `badge-info` | `#1275e2` | `#4090fe` | Informational callouts, active connections. |
| **Success Status** | `alert-success`, `badge-success` | `#00a472` (emerald) | `#4edea3` (vibrant mint) | Completed repairs, paid sales, positive stock. |
| **Warning Status** | `alert-warning`, `badge-warning` | `#fea619` (amber) | `#ffb68c` (warm peach) | Pending quotes, overdue items, low stock warnings. |
| **Error Status** | `alert-error`, `badge-error` | `#ba1a1a` (deep red) | `#ffb4ab` (soft coral red) | Critical errors, canceled services, unpaid alerts. |

---

## 3. Typography Tokens

Both design systems utilize **Inter** for UI clarity and **JetBrains Mono** for precision data (VINs, SKUs, currency, timestamps):

| Token Name | Font Family | Size | Weight | Line Height | Purpose |
|---|---|---|---|---|---|
| `font-display-lg` | Inter | 32px | 700 | 40px (-0.02em) | Main page titles, dashboard KPIs. |
| `font-display-lg-mobile` | Inter | 24px | 700 | 32px (-0.02em) | Page titles on mobile viewports. |
| `font-headline-md` | Inter | 20px | 600 | 28px | Section headers, card titles, modal titles. |
| `font-body-base` | Inter | 16px | 400 | 24px | Standard paragraphs, modal body content. |
| `font-body-sm` | Inter | 14px | 400 | 20px | Table cell text, form labels, tooltips. |
| `font-data-mono` | JetBrains Mono | 14px | 500 | 20px | Currency, quantities, VIN codes, SKU numbers. |
| `font-label-caps` | Inter | 12px | 700 | 16px (+0.05em) | Uppercase table headers, badge chips, status indicators. |

---

## 4. Spacing, Shapes & Radii

| Element | Radius Token | Value | Applied To |
|---|---|---|---|
| Selector | `--radius-selector` / `rounded-full` | `9999px` (pill) | Status chips, badges, toggle switches, avatars. |
| Field | `--radius-field` / `rounded-DEFAULT` | `0.5rem` (8px) | Buttons, text inputs, select inputs, date pickers. |
| Box | `--radius-box` / `rounded-lg` | `1rem` (16px) | Dashboard cards, data panels, modals, drawers. |
| Large Containers | `rounded-xl` | `1.5rem` (24px) | Hero containers, prominent feature blocks. |

**Spacing Grid:** Built on an 8px square baseline rhythm (with 4px for tight density in tables and compact workshop lists).

---

## 5. CSS Implementation Reference (`src/index.css`)

DaisyUI 5 custom themes are declared via `@plugin "daisyui/theme"` in `src/index.css`:

```css
@import "tailwindcss";
@plugin "daisyui";

@plugin "daisyui/theme" {
  name: "light";
  default: true;
  prefersdark: false;
  color-scheme: light;

  --color-base-100: #f8f9ff;
  --color-base-200: #e5eeff;
  --color-base-300: #d3e4fe;
  --color-base-content: #0b1c30;

  --color-primary: #091426;
  --color-primary-content: #ffffff;

  --color-secondary: #855300;
  --color-secondary-content: #ffffff;

  --color-accent: #fea619;
  --color-accent-content: #684000;

  --color-neutral: #1e293b;
  --color-neutral-content: #ffffff;

  --color-info: #1275e2;
  --color-info-content: #ffffff;

  --color-success: #00a472;
  --color-success-content: #ffffff;

  --color-warning: #fea619;
  --color-warning-content: #684000;

  --color-error: #ba1a1a;
  --color-error-content: #ffffff;

  --radius-selector: 1rem;
  --radius-field: 0.5rem;
  --radius-box: 1rem;
  --border: 1px;
}

@plugin "daisyui/theme" {
  name: "dark";
  default: false;
  prefersdark: true;
  color-scheme: dark;

  --color-base-100: #10131a;
  --color-base-200: #181c22;
  --color-base-300: #272a31;
  --color-base-content: #e0e2eb;

  --color-primary: #aac7ff;
  --color-primary-content: #002f64;

  --color-secondary: #aec7f7;
  --color-secondary-content: #143057;

  --color-accent: #e3711f;
  --color-accent-content: #ffffff;

  --color-neutral: #272a31;
  --color-neutral-content: #e0e2eb;

  --color-info: #4090fe;
  --color-info-content: #002958;

  --color-success: #4edea3;
  --color-success-content: #002113;

  --color-warning: #ffb68c;
  --color-warning-content: #481d00;

  --color-error: #ffb4ab;
  --color-error-content: #690005;

  --radius-selector: 1rem;
  --radius-field: 0.5rem;
  --radius-box: 1rem;
  --border: 1px;
}
```

---

## 6. Checklist for Theme Compliance

- [ ] Does the element use `bg-base-100`, `bg-base-200`, or `bg-base-300` instead of `bg-white` or `bg-slate-900`?
- [ ] Is text styled with `text-base-content` or `text-base-content/70` instead of `text-gray-900` or `text-white`?
- [ ] Are buttons using `btn-primary`, `btn-secondary`, or `btn-accent` with automatic content color resolution?
- [ ] Are status badges using semantic tokens (`badge-success`, `badge-warning`, `badge-error`)?
- [ ] Does technical data (prices, VINs, quantities) apply `font-data-mono`?
- [ ] Was the component visually tested in both Light (`data-theme="light"`) and Dark (`data-theme="dark"`) modes?
