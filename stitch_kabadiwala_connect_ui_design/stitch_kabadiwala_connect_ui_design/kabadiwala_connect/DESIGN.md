---
name: Kabadiwala Connect
colors:
  surface: '#f9faf5'
  surface-dim: '#d9dad6'
  surface-bright: '#f9faf5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4ef'
  surface-container: '#edeee9'
  surface-container-high: '#e7e9e4'
  surface-container-highest: '#e2e3de'
  on-surface: '#1a1c19'
  on-surface-variant: '#404941'
  inverse-surface: '#2e312e'
  inverse-on-surface: '#f0f1ec'
  outline: '#717970'
  outline-variant: '#c0c9be'
  surface-tint: '#2e6a41'
  primary: '#003b1b'
  on-primary: '#ffffff'
  primary-container: '#14532d'
  on-primary-container: '#87c695'
  inverse-primary: '#96d5a3'
  secondary: '#006e2d'
  on-secondary: '#ffffff'
  secondary-container: '#7cf994'
  on-secondary-container: '#007230'
  tertiary: '#203800'
  on-tertiary: '#ffffff'
  tertiary-container: '#315100'
  on-tertiary-container: '#83cb14'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b1f2be'
  primary-fixed-dim: '#96d5a3'
  on-primary-fixed: '#00210d'
  on-primary-fixed-variant: '#12512c'
  secondary-fixed: '#7ffc97'
  secondary-fixed-dim: '#62df7d'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005320'
  tertiary-fixed: '#acf847'
  tertiary-fixed-dim: '#91db2a'
  on-tertiary-fixed: '#102000'
  on-tertiary-fixed-variant: '#304f00'
  background: '#f9faf5'
  on-background: '#1a1c19'
  surface-variant: '#e2e3de'
typography:
  headline-xl:
    fontFamily: Inter, Noto Sans Devanagari, sans-serif
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-lg:
    fontFamily: Inter, Noto Sans Devanagari, sans-serif
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Inter, Noto Sans Devanagari, sans-serif
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter, Noto Sans Devanagari, sans-serif
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter, Noto Sans Devanagari, sans-serif
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter, Noto Sans Devanagari, sans-serif
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter, Noto Sans Devanagari, sans-serif
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter, Noto Sans Devanagari, sans-serif
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  label-md:
    fontFamily: Inter, Noto Sans Devanagari, sans-serif
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter, Noto Sans Devanagari, sans-serif
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  numeric-xl:
    fontFamily: Inter, sans-serif
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
  numeric-lg:
    fontFamily: Inter, sans-serif
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.375rem
  space-sm: 0.75rem
  space-md: 1.25rem
  space-lg: 1.75rem
  space-xl: 2.5rem
---

## Brand & Style

This design system is built for a clean and green technology platform that bridges the gap between informal scrap collectors and authorized e-waste recyclers. The brand personality is rooted in trust, environmental stewardship, and radical accessibility. It must inspire confidence in marginalized workers while maintaining the professional rigor expected by recycling enterprises and municipal partners.

We adopt a **Corporate / Modern** style heavily optimized for accessibility and low-literacy users. Visual hierarchy relies on high contrast, explicit iconography paired with text labels, and generous touch targets. The emotional response is one of safety, dignity, environmental clarity, and economic reliability.

## Colors

The color palette draws directly from ecological themes while maintaining strict WCAG AAA compliance for readability. 

- **Primary (Deep Forest Green - `#14532D`):** Used for heavy structural elements, primary headers, and deep anchoring.
- **Secondary (Emerald - `#16A34A`):** The core interactive color for primary actions, success states, and verified recycling badges.
- **Accent (Fresh Lime - `#84CC16`):** Used sparingly for high-attention callouts, active states, and fresh sustainability highlights.
- **Background & Surfaces:** Built on a Warm Off-White (`#F7F8F3`) canvas with pristine white (`#FFFFFF`) cards to create clear separation without harsh lines.
- **Text & Borders:** Dark text (`#17211B`) and secondary text (`#66736B`) ensure maximum legibility against light backgrounds. Borders (`#E2E8E3`) provide subtle structural containment.
- **Semantic Feedback:** Warning (`#F59E0B`), Danger (`#DC2626`), and Info (`#2563EB`) maintain universal recognition while adhering to contrast minimums.

## Typography

Typography is treated as a critical accessibility vector. Multi-lingual support (English, Hindi, and Marathi) is enforced through fallback stacks combining `Inter` and `Noto Sans Devanagari`. 

- **Scale & Weight:** Base body sizes are set larger than standard web norms (16px–18px) to accommodate diverse viewing conditions in outdoor, field environments.
- **Numerical Hierarchy:** Dedicated numeric styles (`numeric-xl`, `numeric-lg`) use heavy weights and tabular figures for instant comprehension of weights, earnings, and material counts.
- **Low-Literacy Accommodations:** Avoid dense paragraphs. Pair text labels with explicit functional icons across all navigation and action items.

## Layout & Spacing

The layout employs a **fluid grid system** adapted for field-use on mobile devices, tablets, and desktop recycling dashboards. 

- **Grid & Margins:** Built on a responsive 12-column fluid grid with 16px (`1rem`) gutters and 20px (`1.25rem`) outer margins on mobile, scaling up to 32px on desktop.
- **Spacing Rhythm:** A generous spacing scale ensures that interactive elements never crowd one another, preventing accidental taps in high-movement field scenarios. 
- **Form Factor Adaptation:** On mobile devices, single-column stacked layouts are prioritized. Actions float in bottom sticky containers with full-width footprints.

## Elevation & Depth

Visual hierarchy relies on **tonal layers and low-contrast outlines** rather than heavy drop shadows, reinforcing a clean, sustainable digital aesthetic.

- **Surface Tiers:** The background uses Warm Off-White (`#F7F8F3`), elevated cards use pristine White (`#FFFFFF`), and interactive floating containers introduce subtle ambient green-tinted shadows.
- **Boundaries:** Use soft borders (`#E2E8E3`) to define interactive zones clearly without relying on aggressive visual noise.

## Shapes

The shape language uses friendly, approachable rounded geometry to foster trust and physical accessibility.

- **Corner Radius:** Standard UI elements and cards employ a 16px to 20px border radius (`rounded-lg` to `rounded-xl`). Buttons and interactive chips use pill or heavily rounded pill variants to signal touchability immediately.

## Components

Components are engineered for extreme clarity, high contrast, and effortless touch interaction.

- **Buttons:** Minimum height of 48px to guarantee accessible touch targets. Primary actions must always combine a clear, culturally universal icon with bold text. Use Deep Forest Green (`#14532D`) or Emerald (`#16A34A`) for primary actions.
- **Cards:** White surfaces on warm off-white backgrounds, featuring 16px–20px corner radii, subtle borders, and generous internal padding (16px+). Used to group scrap categories, pickup schedules, and earnings summaries.
- **Input Fields:** Large text inputs (minimum 56px height) with high-contrast borders and persistent floating or inline labels. Error states must trigger immediate, high-visibility warning colors with explicit corrective text.
- **Checkboxes & Radio Buttons:** Oversized tap areas (minimum 32x32px visual elements within 48x48px hit boxes) with unmistakable check or fill indicators.
- **Chips & Tags:** Pill-shaped categorical tags for material types (e.g., "Plastic", "Copper", "E-Waste") featuring soft background tints and strong text contrast.
- **Additional Components:** 
  - *Earnings Counter:* Massive numerical display cards highlighting daily/monthly payouts.
  - *Status Stepper:* High-visibility progress trackers for pickup verification and recycling processing stages.