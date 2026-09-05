---
name: atomic-design
description: Apply this skill when creating, modifying, or reviewing any UI component (primitive, atom, molecule, organism, or template) built with React + TypeScript + TailwindCSS + DaisyUI. Enforces a single visual identity per atom, strict prop typing from core/types (no inline literal unions), a mandatory search-before-create workflow, theme-driven "Dark/Light Mode First" dynamic colors (no hardcoded bg/text colors), and visual consistency (sizes, radius, colors, and icon placement) across the app.
---

# Atomic Design — Custom Design System Built on DaisyUI

## 0. When It Triggers
- You are about to create any new visual component.
- You are about to modify props on an existing component.
- The user requests a UI change and you need to decide whether to reuse an existing component or create a new one.

For rules on where business logic lives (stores/usecases), refer to the `clean-code` skill. For exact folder placement, refer to `project-structure`.

---

## 1. Atomic Hierarchy and Purpose

| Level | Purpose | Can use native HTML tags (`<button>`, `<input>`, `<span>`...)? | Can connect to a store? |
|---|---|---|---|
| **Primitive** | Pure layout: `Box`, `Flex`, `Grid`, `Stack` | Yes (they serve as base layout containers) | No |
| **Atom** | Indivisible element with a single visual identity: button, input, badge, icon, text | **Yes — only authorized level besides Primitive** | No |
| **Molecule** | 2+ atoms combined with a clear functional purpose (a card, a table row) | No | No — receives everything via props |
| **Organism** | Full section composed of atoms/molecules (a form, a paginated table) | No | Yes — can read/dispatch actions from a store |
| **Template** | Full page skeleton, defines overall layout | No | No — orchestrates organisms/molecules passed as children/props |

**Hard Rule:** No native HTML tag (`<button>`, `<input>`, `<a>`, `<span>`, `<h1>`-`<h6>`, `<p>`, etc.) may ever appear outside a file within `components/atoms/` or `components/primitives/`. If you need a native element inside a Molecule, Organism, or Template, that indicates a missing Atom — find it and reuse it, or create it.

---

## 2. Golden Rule: One Atom = One Unique Visual Identity

An atom represents **one** design, not a family of designs selected via color/style props. This is the most common mistake:

```ts
// ❌ WRONG — this is not a PrimaryButton; it is 5 components disguised as one
const variantMap = {
  solid: 'bg-[#1e293b] text-white hover:bg-[#0f172a] border-none shadow-sm',
  outline: 'border border-[#1e293b] text-[#1e293b] bg-transparent hover:bg-[#f1f5f9]',
  soft: 'bg-[#cbd5e1]/40 text-[#1e293b] hover:bg-[#cbd5e1]/60',
  ghost: 'bg-transparent text-[#1e293b] hover:bg-[#f1f5f9]',
  link: 'bg-transparent text-[#1e293b] underline hover:text-[#0f172a] p-0 min-h-0',
};
```

The set of atoms per category must remain **lean, focused, and deliberate**, where each has a purpose explainable in a single sentence:

```
components/atoms/Button/
├── PrimaryButtonAtom.tsx     // The SOLE primary action on the screen/section (Solid visual identity)
├── SecondaryButtonAtom.tsx   // Alternative action, paired alongside the primary (Outline visual identity)
└── TertiaryButtonAtom.tsx    // Lower visual weight action: cancel, dismiss, view more (Ghost visual identity)
```

### Critical Button Rules:
1. **Never use a `variant` prop that flips button identity**:
   - `PrimaryButtonAtom` is ALWAYS **solid** (`btn btn-primary`, `btn btn-error`, etc.).
   - `SecondaryButtonAtom` is ALWAYS **outline** (`btn btn-outline border-base-300`, etc.).
   - `TertiaryButtonAtom` is ALWAYS **ghost / subtle** (`btn btn-ghost text-base-content`, etc.).
   - Passing `variant?: 'solid' | 'outline' | 'soft' | 'ghost' | 'link'` is an antipattern because a `PrimaryButton variant="outline"` would look identical to a `SecondaryButton`, destroying visual hierarchy.
2. **Use the semantic `color` prop instead**:
   - `color?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error'`.
   - Allows contextual color roles (e.g. destructive primary button: `<PrimaryButton color="error">Eliminar</PrimaryButton>`), while strictly preserving the atom's solid/outline/ghost identity.
3. **No Redundant Wrapper Files**:
   - Never keep both `PrimaryButton.tsx` and `PrimaryButtonAtom.tsx`. The canonical file is strictly `PrimaryButtonAtom.tsx`.
   - Aliases (`export { PrimaryButtonAtom as PrimaryButton, PrimaryButtonAtom }`) are exported cleanly from `components/index.ts`.
4. **No Hardcoded Hex Colors**:
   - Never use static hex codes (e.g. `headerBackground = '#091426'` or `color = '#855300'`).
   - Use DaisyUI tokens and semantic classes (`bg-neutral text-neutral-content`, `btn-primary`, `bg-base-200`, `border-base-300`).

Before adding a fourth button atom (or in any component category), ask: **"In which exact scenario do I use this instead of the existing ones?"**. If you cannot answer in a single clear sentence, it is not a new atom — it is visual noise masquerading as a design system.

**What a `size` and `color` prop MAY control within an atom**: `size` (`xs` / `sm` / `md` / `lg` / `xl`), `color` (semantic DaisyUI role), `disabled`, `loading`, and icon placement (`iconStart`, `iconEnd`).
**What a prop must NEVER control**: The visual fill/border family that redefines what the component *is* (flipping solid to outline or ghost).

---

## 3. Dark/Light Mode First: Zero Static Colors

All components across all levels (Primitives, Atoms, Molecules, Organisms, Templates) must be **"Dark/Light Mode First"**.

### The Rule
Never use hardcoded, static background or text colors (e.g., `bg-white`, `text-white`, `bg-black`, `text-black`, `bg-slate-100`, `text-gray-900`, or raw hex values like `bg-[#ffffff]`) on components that adapt to themes. Doing so breaks DaisyUI's light/dark mode theme switching.

- Colors must always be resolved by DaisyUI's semantic theme tokens:
  - **Backgrounds:** `bg-base-100`, `bg-base-200`, `bg-base-300`, `bg-primary`, `bg-neutral`, etc.
  - **Text:** `text-base-content`, `text-primary-content`, `text-neutral-content`, etc.
  - **Borders:** `border-base-200`, `border-base-300`, etc.
- **Allowed Exception:** Only use specific, static colors when the element represents an explicit, fixed status that must look identical in both dark and light modes (e.g., `alert-success`, `alert-error`, `badge-warning`, or dedicated brand status indicators).

```tsx
// ❌ WRONG — breaks when toggling between light and dark modes
<div className="bg-white text-gray-800 border-gray-200">
  <span className="text-white bg-blue-600">Active</span>
</div>

// ✅ RIGHT — dynamically controlled by DaisyUI theme configuration
<div className="bg-base-100 text-base-content border-base-300">
  <span className="bg-primary text-primary-content">Active</span>
</div>
```

---

## 4. Mandatory Consistency

All atoms within the same category (all buttons together, all inputs together) share the **exact same single source of truth** for scales and conventions — individual components never invent their own:

| Token | Single Source of Truth | Consumed By |
|---|---|---|
| Size Scale | `core/types/Size/Size.ts` → `type Size = 'sm' \| 'md' \| 'lg'` | Any atom with a `size` prop |
| Border Radius | A single shared Tailwind class/token, never custom values per component | Any atom with rounded corners |
| Icon Placement | Consistent prop naming convention: `iconStart` / `iconEnd` | Any atom/molecule accepting an icon |
| Color Palette | DaisyUI semantic colors (`primary`, `secondary`, `neutral`, `error`...), never standalone hex like `#1e293b` | Every atom |

If you are refactoring existing code and find stray hex values, mismatched radiuses, or inconsistent sizes within the same category, treat it as a violation of this rule even if the component "works".

---

## 5. Props: No Inline Literal Unions

The same "zero hardcoding" principle from `clean-code` applies to component props: the union of possible values is declared **once** in `core/types` and reused everywhere — never duplicate literal unions across components.

```ts
// ❌ WRONG — each atom reinvents its own size union
interface PrimaryButtonProps {
  size?: 'sm' | 'md' | 'lg';
}
interface TextInputProps {
  size?: 'sm' | 'md' | 'lg'; // Duplicated and prone to desynchronization
}
```

```ts
// ✅ RIGHT — core/types/Size/Size.ts
export type Size = 'sm' | 'md' | 'lg';

// PrimaryButtonAtom.tsx
import type { Size } from '@/core/types/Size';

interface PrimaryButtonProps {
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  iconStart?: ReactNode;
}
```

Every atom without exception must have **strictly typed** props (never `any`). Where applicable, accept typed `disabled` and `loading` props rather than redefining ad-hoc booleans when shared types exist.

---

## 6. Mandatory Protocol: Search Before You Create

Before creating or modifying **any** component, follow this exact sequence:

1. **Search by purpose** in `components/atoms/`, `components/primitives/`, `components/molecules/`, `components/organisms/`, and `components/templates/` (using keywords like "button", "input", "date", "card"...).
2. If a component exists that fulfills the purpose, or can fulfill it by adding a prop **without violating the single visual identity rule** (Section 2) → **reuse it**. Do not create a new one.
3. If it does NOT exist, determine the correct atomic level using Section 1 and create it there.
4. Never use a native HTML tag (`<button>`, `<input>`, `<a>`...) directly inside a Molecule/Organism/Template "for speed". That always represents a missing or improperly reused Atom.

If during a refactoring task you encounter a stray `<button>` outside `atoms/`, or a duplicate component, report and fix it as part of your task.

---

## 7. Folder Structure and Naming Conventions

```
components/
├── atoms/
│   └── Button/
│       ├── PrimaryButtonAtom.tsx
│       ├── SecondaryButtonAtom.tsx
│       └── TertiaryButtonAtom.tsx
├── primitives/
│   └── Flex/
│       └── FlexPrimitive.tsx
├── molecules/
│   └── Card/
│       └── StatCardMolecule.tsx
├── organisms/
│   └── Form/
│       └── LoginFormOrganism.tsx
├── templates/
│   └── Section/
│       └── ClientDetailsSectionTemplate.tsx
└── index.ts   // SOLE barrel file for the entire components layer — nothing else
```

- Mandatory suffix per level: `Atom`, `Primitive`, `Molecule`, `Organism`, `Template`.
- Name pattern: `<Descriptor><Suffix>` (`PrimaryButtonAtom`, `StatCardMolecule`, `LoginFormOrganism`).
- Each component lives in its category folder (`Button/`, `Card/`) alongside siblings of the same functional family.
- **`index.ts` lives ONLY ONCE, at the root of `components/`.** No intermediate subfolders (`atoms/`, `Button/`, `molecules/`, `Card/`, etc.) may have their own `index.ts`. See the `project-structure` skill for the comprehensive rule.

---

## 8. DaisyUI: Where It Lives

DaisyUI classes (`btn`, `input`, `card`, `badge`...) are used **strictly inside an Atom**. Molecules, Organisms, and Templates compose existing atoms and primitives — they must never apply raw DaisyUI component classes directly. This ensures a single point of change: if the "primary button" styling evolves, you update `PrimaryButtonAtom.tsx`, and no other part of the application is unexpectedly broken.

---

## 9. Final Checklist

- [ ] Does the atom have a single visual identity (no multi-style `variantMap`)?
- [ ] If creating a new atom in an existing category (e.g. another button), can you explain in one sentence when to use this instead of the existing ones?
- [ ] Are all colors "Dark/Light Mode First" using DaisyUI semantic tokens (no static `bg-white`, `text-white`, `bg-black`, etc. unless it's a fixed-status alert)?
- [ ] Do props use types from `core/types` instead of duplicated inline literal unions?
- [ ] Did you search existing components in `components/` before creating this one?
- [ ] Are all native HTML tags confined strictly inside an Atom or Primitive?
- [ ] Are size scale, border radius, and icon positions consistent with sibling components in the same category?
- [ ] Does the component follow `<Descriptor><Suffix>` naming and live in its dedicated folder?
- [ ] Did you avoid creating any intermediate `index.ts` files inside subfolders of `components/`?