---
name: Interstellar Logic
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363940'
  surface-container-lowest: '#0b0e14'
  surface-container-low: '#181c22'
  surface-container: '#1c2026'
  surface-container-high: '#272a31'
  surface-container-highest: '#31353c'
  on-surface: '#e0e2eb'
  on-surface-variant: '#c1c6d5'
  inverse-surface: '#e0e2eb'
  inverse-on-surface: '#2d3037'
  outline: '#8b919f'
  outline-variant: '#414753'
  surface-tint: '#aac7ff'
  primary: '#aac7ff'
  on-primary: '#002f64'
  primary-container: '#4090fe'
  on-primary-container: '#002958'
  inverse-primary: '#005db8'
  secondary: '#aec7f7'
  on-secondary: '#143057'
  secondary-container: '#2d476f'
  on-secondary-container: '#9db6e4'
  tertiary: '#ffb68c'
  on-tertiary: '#532200'
  tertiary-container: '#e3711f'
  on-tertiary-container: '#481d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#aac7ff'
  on-primary-fixed: '#001b3e'
  on-primary-fixed-variant: '#00458d'
  secondary-fixed: '#d6e3ff'
  secondary-fixed-dim: '#aec7f7'
  on-secondary-fixed: '#001b3d'
  on-secondary-fixed-variant: '#2d476f'
  tertiary-fixed: '#ffdbc9'
  tertiary-fixed-dim: '#ffb68c'
  on-tertiary-fixed: '#321200'
  on-tertiary-fixed-variant: '#763400'
  background: '#10131a'
  on-background: '#e0e2eb'
  surface-variant: '#31353c'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.5px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 24px
---

# Interstellar Logic Design System

## Brand & Style
Interstellar Logic is a design system built for precision, clarity, and technical excellence. The brand personality is professional, reliable, and forward-thinking, moving away from high-energy saturation toward a more focused, "pro-tool" aesthetic. 

The style is **Corporate / Modern** with a lean toward **Minimalism**. It prioritizes high-density information environments while maintaining a sleek, sophisticated feel. The shift to a dark mode default emphasizes a focus on reduced eye strain for power users and a high-tech atmosphere.

## Colors
The color palette has transitioned to a deep, dark-mode foundation. 

- **Primary (#1275e2):** A technical, vibrant blue that serves as the primary action color, signaling interaction and focus.
- **Secondary (#5f78a3):** A muted, cool-toned blue-grey used for supporting elements and less prominent UI components.
- **Tertiary (#c55b00):** A burnt orange used sparingly for accentuation, highlights, or signaling specific status changes that require attention without the urgency of an error.
- **Neutral (#74777f):** A balanced grey used for surfaces, borders, and secondary text to maintain a cohesive, low-fatigue environment.

## Typography
The system utilizes **Inter** across all layers. Inter is chosen for its exceptional legibility in digital interfaces and its neutral, modern tone.

- **Headlines:** Set in semi-bold weights with tighter tracking to create a strong visual hierarchy.
- **Body:** Optimized for readability with a generous line height (1.5x) to handle dense documentation or data.
- **Labels:** Used for small metadata or functional text, utilizing medium weights and slight letter spacing for clarity at small scales.

## Layout & Spacing
The layout follows a **Fluid Grid** philosophy based on an 8px square-grid rhythm. This ensures alignment across all components.

- **Desktop:** 12-column grid with 24px margins.
- **Tablet:** 8-column grid with 16px margins.
- **Mobile:** 4-column grid with 16px margins.

Horizontal and vertical spacing should always be multiples of the 8px base unit (e.g., 16px for gutters, 32px for section separation).

## Elevation & Depth
In this dark-mode environment, depth is conveyed through **Tonal Layers** rather than heavy shadows. 

Surfaces move closer to the user by becoming lighter in value. Backgrounds use the darkest neutral shade, while cards and floating menus use progressively lighter tints of the neutral/secondary palette. Subtle, low-opacity ambient shadows (0, 4px, 12px, rgba(0,0,0,0.4)) may be used for high-elevation elements like modals to ensure separation from the background.

## Shapes
The shape language is **Rounded**, moving away from sharp, industrial corners to a more approachable and modern feel. 

- **Standard Elements:** 0.5rem (8px) corner radius for buttons and input fields.
- **Containers:** 1rem (16px) corner radius for cards and larger containers.
- **Large Surfaces:** 1.5rem (24px) for modals or prominent feature blocks.

## Components
- **Buttons:** Primary buttons use the `#1275e2` blue with white or high-contrast text. Secondary buttons use an outline style with the secondary color.
- **Inputs:** Fields are dark-themed with a subtle border using the neutral color, shifting to the primary blue on focus.
- **Cards:** Use a slightly elevated surface color (lighter than the background) with 16px padding and 16px rounded corners.
- **Chips/Badges:** Small, rounded elements using the tertiary color for highlights or status indicators to provide a pop of color against the dark backdrop.
