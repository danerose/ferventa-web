---
name: react-atomic-design
description: Enforces Atomic Design (atoms/molecules/organisms/templates) and a typed, NuxtUI-style DaisyUI props API for every UI component in this React + TypeScript project. ALWAYS use this skill whenever building UI for a new feature or requirement — even if the user doesn't say "atomic design" explicitly. Trigger on mentions of Button, Input, Card, Form, Icon, Modal, Grid, layout, "component library", "design system", DaisyUI, or any request that needs new UI. This skill governs component classification, reuse-before-create, folder placement, and prop design. Pairs with react-clean-code (how code inside a file is written) and react-feature-architecture (where feature files live).
---

# React Atomic Design + DaisyUI

Every requirement that needs UI goes through this skill first, before writing a single component. The goal: never end up with two components doing the same thing, never end up with an `any` prop, and never end up with a component split for the wrong reason (state instead of essence).

---

## 0. Workflow — run this for every new UI requirement

Before writing any component, work through these steps in order:

1. **Inventory.** List every visual element the requirement needs (buttons, inputs, icons, badges, a card, a list, a form...).
2. **Check for existing atoms first.** For each element in the inventory, look in `src/components/atoms/`. If one already matches that *essence* (a Button, an Icon, an Input), reuse it — even if it's missing a prop you need. Extend its `Props` type instead of creating a near-duplicate component.
3. **Classify the new composite piece** (the card, the form, the section) using Section 1 below.
4. **Type its data explicitly.** If it receives domain data (a hotel, a user), the prop type is the real domain type (`Hotel`, `User`) imported from that feature's `domain/types` — never `any`, never a loose inline object shape guessed on the spot.
5. **Place the file** per Section 3 (shared design system vs. feature-specific).
6. **Style it with DaisyUI base classes**, expose the variant/size/color/state props from Section 4 — never hardcoded one-off Tailwind strings for things the design system already has a prop for.
7. **Use layout primitives** (Section 5) instead of hand-writing Tailwind flex/grid utility strings in JSX.

Only after this checklist is code actually written.

---

## 1. Classification

Run top to bottom, stop at the first "yes":

1. **Wraps one native element or one DaisyUI base class, holds no business logic, isn't meaningful split further?**
   → **Atom.** `Button`, `Input`, `Textarea`, `Select`, `Icon`, `Image`, `Avatar`, `Badge`, `Text`, `Spinner`, `Checkbox`, `Toggle`.

   Atoms are split by **essence, not by state.** `Button` and `IconButton` are different atoms because their structure differs. `Button` with `variant="primary"` vs `variant="secondary"`, or `loading`/`disabled`/`skeleton`, are the **same** atom with different prop values — never separate components (no `DisabledPrimaryButton`).

2. **Combines 2+ atoms into one reusable unit with a single, narrow purpose, no data fetching?**
   → **Molecule.** `Card` (Image + Text + Badge + Button), `FormField` (Label + Input + error Text), `SearchBar` (Input + Button), `MenuItem`.

   A molecule bound to a specific domain shape (a card that renders a `Hotel`, a card that renders a `User`) is still a molecule — the domain type just becomes its typed prop (`hotel: Hotel`). Different domain shapes with meaningfully different content/layout are different molecules (`HotelCard` ≠ `UserCard`), not one molecule with an `any`/union prop trying to cover both.

3. **Combines molecules/atoms into a self-contained section, may hold local UI state (open/closed, current step, validation, list filters) and exposes callbacks — but receives its data via props, not by fetching it itself?**
   → **Organism.** `Form` (FormFields + submit Button + validation state, exposes `onSubmit`), `Navbar`, `ProductGrid`, `CommentThread`, `Modal` (as a shell).

4. **Defines the skeletal region layout of a screen — headers, slots, grid areas — with no real content of its own, using `children`/named slots?**
   → **Template.** `DashboardTemplate`, `AuthTemplate`. A page that arranges a `Form` organism next to a `ProductList` organism is composing templates/organisms, not turning the `Form` itself into something else.

5. **Renders one specific screen with real data (fetched via a hook/usecase per `react-feature-architecture`) plugged into a template?**
   → This is a **View** (`presentation/views/` per `react-feature-architecture`), not a component. Views are the only place allowed to call hooks that fetch data. Everything under `components/` receives data exclusively through props.

If something doesn't cleanly fit one level, it's usually doing too much — split it rather than inventing a level in between.

---

## 2. Layout primitives (their own atom category)

Instead of hand-writing Tailwind flex/grid strings inline (`className="flex flex-wrap lg:flex-row gap-4"`), use typed layout primitives — same idea as Flutter's `Row`/`Column`/`Wrap`:

```
components/atoms/
    Flex/       // direction, wrap, gap, justify, align as typed props
    Grid/       // cols, gap, responsive cols per breakpoint as typed props
    Stack/      // vertical Flex shorthand
    Box/        // padding/margin/background escape hatch
```

```tsx
// Avoid
<div className="flex flex-wrap lg:flex-row gap-4 justify-between">

// Prefer
<Flex direction="row" wrap gap="md" justify="between">
```

These count as atoms (single-purpose, no business logic) but live in their own conceptual bucket — no visual style, purely structural. Every prop maps to a Tailwind/DaisyUI class through the same `Record` lookup pattern as Section 4, so `direction="row"` always resolves to the same class, defined once.

---

## 3. Where components live

Two places, depending on whether the component is reusable design-system UI or bound to one feature's domain:

```yaml
src:
  components:              # shared design system — no feature import ever
    atoms:
      Button:
      Input:
      Flex:
      Icon:
    molecules:
      FormField:
      SearchBar:
    organisms:
      Navbar:
    templates:
      DashboardTemplate:
  app:
    features:
      hotels:
        presentation:
          components:       # feature-specific, may import this feature's domain types
            molecules:
              HotelCard:      # imports Hotel from ../../domain/types
            organisms:
              HotelFiltersForm:
```

Rule: `src/components/` never imports a domain type from any feature — it's the reusable kit. Anything that binds to a specific domain shape (`Hotel`, `User`) lives inside that feature's `presentation/components/`, built by composing atoms/molecules pulled from the shared kit.

Folder = level, PascalCase component name, one folder per component:

```yaml
Button:
  Button.tsx
  Button.types.ts   # once props pass ~5 fields; trivial atoms can keep types inline
  index.ts          # export { Button } from './Button'; export type { ButtonProps } ...
```

No `.atom.tsx` / `.molecule.tsx` suffixes — the folder path already encodes the level.

Import direction only ever goes down: atoms import nothing custom; molecules import atoms; organisms import molecules/atoms; templates import organisms. An atom never imports a molecule.

---

## 4. Props contract (NuxtUI-style, DaisyUI-backed)

Every visual atom/molecule shares this base shape so the whole library feels like one system:

```ts
interface BaseVariantProps {
  color?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'solid' | 'outline' | 'soft' | 'dash' | 'ghost' | 'link';
  disabled?: boolean;
  loading?: boolean;
  skeleton?: boolean;
  className?: string;   // escape hatch, always merged, never required
}
```

Non-negotiable:

- **No `any` props, ever.** If a component receives domain data, the prop is the real domain type. If a component is generic enough to accept several shapes, use a proper generic (`<T,>`) or a discriminated union — not `any`, not `unknown` left unchecked.
- **Prop → DaisyUI class through one `Record` lookup**, defined once per component — not inline ternaries in JSX:

```ts
const colorMap: Record<NonNullable<BaseVariantProps['color']>, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-accent',
  neutral: 'btn-neutral',
  info: 'btn-info',
  success: 'btn-success',
  warning: 'btn-warning',
  error: 'btn-error',
};
```

- **Sensible defaults** for every optional prop (`size = 'md'`, `variant = 'solid'`).
- **`React.forwardRef`** on atoms wrapping a native focusable element (`Button`, `Input`, `Textarea`, `Select`).
- **Compose classNames with a shared `cn()`** (`clsx` + `tailwind-merge`) so a consumer's `className` always wins:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- **Zero business logic in atoms/molecules.** No `fetch`, no usecase calls, no data-fetching `useEffect`. Organisms may hold local UI state and expose callbacks (`onSubmit`, `onSelect`) — the actual side effect runs in the View that renders them (per `react-feature-architecture`).
- Always reach for DaisyUI's component classes first (`btn`, `input`, `select`, `checkbox`, `toggle`, `badge`, `card`, `alert`, `avatar`, `loading`, `modal`, `navbar`, `menu`, `tabs`, `fieldset`) instead of hand-rolled Tailwind. Never hardcode hex colors — always go through DaisyUI's semantic tokens so theme switching keeps working.

---

## 5. Worked example

Requirement: "show a list of hotels as cards with a favorite button."

**Step 0 inventory:** need a card, an image, a title/subtitle text, a favorite icon-button, a grid to lay them out.

**Step 0 check existing atoms:** `Image`, `Text`, `IconButton`, `Grid` already exist in `src/components/atoms/` → reuse. No existing molecule renders a `Hotel` → create one.

```tsx
// app/features/hotels/presentation/components/molecules/HotelCard/HotelCard.tsx
import { Image } from '@/components/atoms/Image';
import { Text } from '@/components/atoms/Text';
import { IconButton } from '@/components/atoms/IconButton';
import type { Hotel } from '../../../domain/types/Hotel';

interface HotelCardProps {
  hotel: Hotel;                 // real domain type, never `any`
  isFavorite: boolean;
  onToggleFavorite: (hotelId: string) => void;
}

export function HotelCard({ hotel, isFavorite, onToggleFavorite }: HotelCardProps) {
  return (
    <div className="card bg-base-100 shadow">
      <Image src={hotel.thumbnailUrl} alt={hotel.name} />
      <div className="card-body">
        <Text variant="title">{hotel.name}</Text>
        <Text variant="subtitle">{hotel.city}</Text>
        <IconButton
          icon="heart"
          variant={isFavorite ? 'solid' : 'outline'}
          onClick={() => onToggleFavorite(hotel.id)}
        />
      </div>
    </div>
  );
}
```

```tsx
// app/features/hotels/presentation/views/HotelListView.tsx
import { Grid } from '@/components/atoms/Grid';
import { HotelCard } from '../components/molecules/HotelCard';
import { useHotelList } from '../hooks/useHotelList';

export function HotelListView() {
  const { hotels, favoriteIds, toggleFavorite } = useHotelList();

  return (
    <Grid cols={{ base: 1, md: 2, lg: 3 }} gap="md">
      {hotels.map((hotel) => (
        <HotelCard
          key={hotel.id}
          hotel={hotel}
          isFavorite={favoriteIds.has(hotel.id)}
          onToggleFavorite={toggleFavorite}
        />
      ))}
    </Grid>
  );
}
```

Notice: `HotelCard` never fetches, never knows about the API — it only renders a typed `Hotel`. The `Grid` primitive replaces a hand-written responsive Tailwind grid string. Data fetching happens in `useHotelList`, per `react-feature-architecture`.

---

## 6. Before finishing any component, check

- [ ] Ran the Section 0 workflow — didn't create a component that already exists in a different shape
- [ ] Classified with Section 1, not "felt like an atom"
- [ ] Split by essence, not by state — no `DisabledButton`/`LoadingCard` type components
- [ ] Lives in the right place: shared `src/components/{level}/` if generic, feature `presentation/components/{level}/` if bound to a domain type
- [ ] Fully-typed `Props`, real domain type where data is involved — no `any`
- [ ] Prop → DaisyUI class goes through a `Record` lookup, not inline ternaries
- [ ] Layout uses `Flex`/`Grid`/`Stack` primitives, not raw Tailwind flex/grid strings
- [ ] No data fetching or usecase calls inside the component itself
- [ ] Follows `react-clean-code` for naming, function size, and no inline literal unions