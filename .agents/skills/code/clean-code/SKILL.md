---
name: clean-code
description: Enforces Clean Code, SOLID, KISS, DRY, strict TypeScript typing, and readable, maintainable React code. Use for any React + TypeScript project.
---

# React + TypeScript Clean Code

This skill defines the coding standards for every piece of React + TypeScript code generated. These aren't architecture rules — they're practices that keep code readable, testable, and easy to change later. Follow them unless the user explicitly asks for something else.

---

## Core Principles

Every solution should hold up against these:

- **SOLID** — especially Single Responsibility: a function, component, or file should have one reason to change.
- **DRY** — don't repeat the same logic in two places; extract and reuse instead.
- **KISS** — the simplest solution that correctly solves the problem beats a clever one.
- **Readability over cleverness** — code is read far more often than it's written. Optimize for the next person (or yourself in 6 months).
- **Explicit over implicit** — types, names, and control flow should make intent obvious without needing to trace through the whole file.

When there are multiple valid ways to solve something, prefer whichever is easier to understand, test, and extend, in that order. Don't optimize prematurely — clarity first, performance only when it's actually needed.

---

## Naming

Names should say what a thing *is* or *does*. If you have to guess or open the definition to know what a variable holds, the name has failed.

Bad: `data`, `temp`, `obj`, `value`, `helper`, `utils`
Good: `authenticatedUser`, `shoppingCart`, `formattedPrice`, `isLoadingProducts`, `calculateDiscount`

Booleans read as a question or state (`isLoading`, `hasError`, `canSubmit`). Functions read as verbs (`fetchUser`, `formatDate`, `validateEmail`).

---

## Functions

A function does one thing. If its name needs "and" to describe it, split it:

```
Bad:  fetchDataAndTransformAndValidateAndSave()
Good: fetchUser() → validateUser() → mapUser() → saveUser()
```

- Keep functions short — if you're scrolling to see the whole thing, it probably wants to be broken up.
- Prefer early returns over nested `if` statements; deep nesting hides the actual logic.
- A function's parameters and return type should make its contract obvious without reading the body.

---

## Components

Treat components as the "view" of your logic, not the place logic lives.

A component is for:
- rendering TSX
- receiving props
- calling hooks
- wiring up callbacks

A component is **not** the place for:
- data transformation, formatting, or validation logic
- building API request payloads
- non-trivial calculations

This isn't about enforcing a folder structure — it's about testability. A component full of inline logic can only be tested by rendering it and simulating interactions; a component that just calls `useCart()` and `formatPrice()` can be tested trivially, and those functions can be tested on their own without React at all.

```tsx
// Avoid: logic buried inside the component
function Cart({ items }: CartProps) {
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const formatted = `$${total.toFixed(2)}`;
  return <p>Total: {formatted}</p>;
}

// Prefer: component stays declarative, logic is reusable and testable on its own
function Cart({ items }: CartProps) {
  const total = calculateCartTotal(items);
  return <p>Total: {formatCurrency(total)}</p>;
}
```

If a component is pushing past ~200 lines, that's usually a sign a chunk of JSX or logic wants to become its own component or hook — not because of a rule, but because past that size it stops being skimmable.

---

## State (hooks / stores)

Same idea as components: state containers hold *state*, not logic.

```ts
// Avoid: store/hook doing formatting work
const formatted = user.name.trim().toUpperCase();
store.setUser({ ...user, name: formatted });

// Prefer: formatting lives in its own function, store just stores
const formatted = formatUserName(user.name);
store.setUser({ ...user, name: formatted });
```

This keeps state predictable — if a bug shows up in how something's formatted, there's exactly one function to check, not five places across components and stores that each format it slightly differently.

---

## Types

Never use inline literal unions for anything reused more than once — name it.

```ts
// Avoid
color: 'primary' | 'secondary'

// Prefer
type ButtonColor = 'primary' | 'secondary';
color: ButtonColor;
```

Prefer union types over `enum` unless you specifically need enum interop.

Avoid `any`. Reach for `unknown`, generics, or a discriminated union instead — `any` silently disables the type checker exactly where it'd catch a bug. Type props, parameters, return values, and state explicitly; don't rely on inference for anything public-facing (exported functions, component props).

---

## Constants & Magic Values

If a number, string, or literal shows up more than once — or represents something meaningful (a role, a route, a threshold) — give it a name instead of repeating the raw value.

```ts
// Avoid
if (retries > 3) { ... }
margin: 17

// Prefer
if (retries > MAX_RETRIES) { ... }
margin: DEFAULT_MARGIN
```

Same goes for user-facing strings — pulling them into one place makes copy changes and future localization far less painful than hunting through JSX.

---

## Comments

Comments should explain **why**, not **what** — the code should already say what it does.

```ts
// Avoid: restates the code
i++; // increment i

// Prefer: explains a non-obvious reason
i++; // backend indexes rows starting at 1, not 0
```

If you find yourself writing a comment to explain *what* a block does, that's usually a sign the block should be a well-named function instead.

---

## Error Handling

Never swallow an error silently (empty `catch`, ignored rejected promise). At minimum:
- log it with enough context to debug later
- surface a meaningful result to the caller (don't just return `undefined` and hope)
- prefer typed errors over generic `throw new Error(string)` when the caller needs to branch on the failure

---

## File Organization

One responsibility per file — this is about keeping things findable, not about mandating a specific folder taxonomy. A reusable piece of logic (a formatter, a validator, a calculation) gets its own small file with a name that matches what it does:

```
formatDate.ts
validateEmail.ts
calculateDiscount.ts
```

Avoid dumping unrelated functions into a single `utils.ts` or `helpers.ts` — it becomes a junk drawer that's hard to search and invites merge conflicts. Beyond that, organize files however makes sense for the project; this skill isn't prescribing a specific architecture.

---

## Before returning code, check

- [ ] SOLID / DRY / KISS held up
- [ ] No formatting, validation, or calculation logic buried inside a component
- [ ] No formatting/business logic buried inside a store or hook
- [ ] No inline literal unions for reused values — named types instead
- [ ] No repeated magic numbers or strings — extracted to named constants
- [ ] No `any` without a real reason
- [ ] Errors are handled, not swallowed
- [ ] Names are clear enough that a reader doesn't need to guess

If something here is off, fix it before returning the code rather than shipping it with a caveat.