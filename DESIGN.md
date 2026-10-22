---
name: PDFHub
description: Private, in-browser PDF utilities and document transformation engine
colors:
  primary: "#e11d48"
  primary-hover: "#be123c"
  primary-subtle: "#ffe4e6"
  neutral-bg-light: "#f8fafc"
  neutral-bg-dark: "#020617"
  surface-card-light: "#ffffff"
  surface-card-dark: "#1e293b"
  border-subtle-light: "#e2e8f0"
  border-subtle-dark: "#334155"
  text-main-light: "#0f172a"
  text-main-dark: "#f8fafc"
  text-muted-light: "#64748b"
  text-muted-dark: "#94a3b8"
  accent-amber: "#f59e0b"
  accent-emerald: "#10b981"
  accent-sky: "#0ea5e9"
  accent-pink: "#ec4899"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, Prompt, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Plus Jakarta Sans, Prompt, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Plus Jakarta Sans, Prompt, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Plus Jakarta Sans, Prompt, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Plus Jakarta Sans, Prompt, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.025em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  card-tool:
    backgroundColor: "{colors.surface-card-light}"
    rounded: "{rounded.lg}"
    padding: "24px"
  dropzone:
    backgroundColor: "{colors.surface-card-light}"
    rounded: "{rounded.xl}"
    padding: "40px"
---

# Design System: PDFHub

## Overview

**Creative North Star: "The Sovereign Document Foundry"**

PDFHub treats client-side document processing not as a novelty, but as an uncompromising standard of craft and privacy. The design balances precision utility with reassuring physical solidity: crisp functional surfaces, confident contrast, and tactile feedback give users certainty that their sensitive legal, academic, and business records are handled securely on their own machine.

Surfaces favor disciplined structural hierarchy over decorative clutter. Information density is intentionally calibrated for swift task execution—clear category badges, identifiable utility icons, and transparent file metrics (page counts, compression percentages, and file sizes) keep cognitive load minimal while preserving rapid scannability across desktop and mobile screens.

**Key Characteristics:**
- Disciplined utility aesthetic with high contrast text and solid, legible headings.
- Reassuring security posture reinforced through subtle trust badges and privacy indicators.
- Tactile, state-reactive controls that provide instant feedback during file handling and conversion.
- Harmonious bilingual typography accommodating English (`Plus Jakarta Sans`) and Thai (`Prompt`) without baseline shift or uneven line heights.

## Colors

The palette establishes an authoritative crimson-rose core paired with functional chromatic category cues and deep neutral grounding.

### Primary
- **Crimson Rose** (`#e11d48`): The signature brand color, used for primary actions, navigation brand marks, active selection highlights, and conversion triggers.
- **Deep Crimson** (`#be123c`): The hover/active state for primary interactive elements.
- **Rose Subtle** (`#ffe4e6` light / `rgba(225, 29, 72, 0.15)` dark): Background tint for badges, active dropzones, and subtle callouts.

### Secondary
- **Amber Gold** (`#f59e0b`): Used for splitting and extraction workflows.
- **Emerald Green** (`#10b981`): Used for compression, optimization, and privacy security checkmarks.
- **Sky Blue** (`#0ea5e9`): Used for document image conversions and preview controls.
- **Pink Blossom** (`#ec4899`): Used for page orientation and rotation utilities.

### Neutral
- **Deep Void** (`#020617` / `#0f172a`): Body background and elevated card surfaces in dark mode; high-emphasis text in light mode.
- **Slate Canvas** (`#f8fafc`): Body background in light mode.
- **Surface Crisp** (`#ffffff` light / `#1e293b` dark): Primary card, panel, and modal containers.
- **Border Subtle** (`#e2e8f0` light / `#334155` dark): Structural dividers and card boundaries.
- **Slate Muted** (`#64748b` light / `#94a3b8` dark): Secondary helper copy, metadata, and inactive state icons.

### Named Rules
**The Solid Heading Rule.** Headings and critical numeric indicators must never use decorative gradient clips or hollow strokes. Legibility and contrast take precedence over ornamentation.
**The Single Accent Rule.** Only one primary chromatic accent may dominate an action path at any given time. Secondary tool category accents serve exclusively as navigational landmarks, never competing with primary CTAs.

## Typography

**Display Font:** `Plus Jakarta Sans` (Latin) paired with `Prompt` (Thai)
**Body Font:** `Plus Jakarta Sans` with `Prompt` fallback
**Mono/Numeric Font:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

**Character:** Modern geometric proportions with open apertures and clean Thai loop terminals, creating a crisp, highly readable rhythm for dense interface controls.

### Hierarchy
- **Display** (800 font-extrabold, `clamp(2rem, 5vw, 3rem)`, line-height 1.15, letter-spacing -0.025em): Main page titles and hero statement.
- **Headline** (700 font-bold, `1.5rem` / 24px, line-height 1.25): Tool workspace titles and modal headlines.
- **Title** (700 font-bold, `1rem` / 16px, line-height 1.4): Tool cards and panel headers.
- **Body** (400 font-normal, `0.875rem` / 14px, line-height 1.5): Instructions, descriptions, and file details.
- **Label** (600 font-semibold, `0.75rem` / 12px, letter-spacing 0.025em): Category tags, metadata badges, and button labels.

### Named Rules
**The Bilingual Rhythm Rule.** Thai (`Prompt`) and English (`Plus Jakarta Sans`) glyphs must share identical baseline alignment and generous vertical line spacing (minimum 1.4) to eliminate clipping of Thai tonal marks.

## Layout

- **Container Widths:** Max-w-7xl (`1280px`) for catalog and hub views; Max-w-5xl (`1024px`) for focused tool workspaces.
- **Grid Structure:** Responsive auto-fitting grid for tool cards (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` with 24px gap).
- **Responsive Padding:** 16px on mobile viewports scaling fluidly to 32px on desktop.
- **Rhythm & Density:** 8px base grid. Spacing steps: 4px (`xs`), 8px (`sm`), 16px (`md`), 24px (`lg`), 32px (`xl`), 48px (`2xl`).

## Elevation & Depth

Surfaces rely on subtle tonal contrast and soft ambient shadows, reserving pronounced elevation for modals and active drag targets.

### Shadow Vocabulary
- **Subtle Surface** (`box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05)`): Rest state for cards and panels.
- **Interactive Lift** (`box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)`): Hover elevation for tool cards and actionable modules.
- **Glow Accent** (`box-shadow: 0 10px 15px -3px rgba(225, 29, 72, 0.2)`): Action buttons and primary CTA highlights.
- **Modal Depth** (`box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)`): Processing modals and centered dialogs.

### Named Rules
**The Flat-At-Rest Rule.** Surfaces sit flush with the grid at rest. Shadow elevation and boundary transforms occur strictly in response to user interaction or focus state.

## Shapes

- **Corner Radii:**
  - Small (`8px` / `rounded-lg`): Buttons, input fields, and action chips.
  - Medium (`12px` / `rounded-xl`): Icon containers, navigation buttons, and compact dropzone areas.
  - Large (`16px` / `rounded-2xl`): Tool cards, configuration panels, and result modals.
  - Extra Large (`24px` / `rounded-3xl`): Primary file dropzones.
  - Pill (`9999px` / `rounded-full`): Status pills, badge tags, and language toggle indicators.
- **Borders:** Continuous 1px subtle boundary (`#e2e8f0` light / `#334155` dark) ensuring structural definition against background shifts.

## Components

### Buttons
- **Shape:** Medium radius (`12px` / `rounded-xl`).
- **Primary:** Crimson Rose background (`#e11d48`), white text, bold font, subtle glow shadow (`shadow-rose-500/25`), padding 10px 24px.
- **Secondary / Ghost:** Subtle outline or neutral fill (`bg-slate-100 dark:bg-slate-800`), hover foreground color shift.
- **States:** Hover scale-102 with smooth color transition; active scale-98; disabled opacity-50 with `cursor-not-allowed`.

### Cards / Tool Cards
- **Corner Style:** Large radius (`16px` / `rounded-2xl`).
- **Background:** Pure white (`#ffffff`) light / slate dark (`#1e293b`).
- **Hover Treatment:** Border shifts to rose-400/500, slight lift (`-translate-y-1`), shadow expansion.
- **Padding:** 24px internal padding.

### Dropzone
- **Border:** 2px dashed boundary (`border-slate-300` light / `border-slate-700` dark).
- **Drag-Over State:** Shifts to solid rose-500 border with rose-50 light / rose-950 dark background tint and subtle inner glow.
- **Internal Padding:** 40px to 56px for generous drop target ergonomics.

### Inputs & Selectors
- **Style:** 1px border (`border-slate-300 dark:border-slate-700`), radius 12px, clean background.
- **Focus:** 2px ring in primary rose (`ring-2 ring-rose-500 outline-none`).

### Navigation
- **Header:** Sticky top with backdrop blur (`backdrop-blur-md`), 64px height, hairline bottom border.
- **Brand Element:** Integrated logo icon with crimson mark and bold wordmark.
- **Controls:** Dark mode switch, Thai/English language toggle, and quick back button.

## Do's and Don'ts

### Do:
- **Do** use solid, readable text colors for all headings, subheadings, and status indicators.
- **Do** maintain bilingual typography parity between English and Thai across all components.
- **Do** emphasize 100% client-side privacy with clear security badges and transparent processing states.
- **Do** provide immediate tactile feedback (hover transforms, loading spinners, progress percentages) on all user actions.
- **Do** ensure every interactive element has a visible, high-contrast focus indicator for keyboard navigation.

### Don't:
- **Don't** use decorative gradient text (`bg-clip-text text-transparent`) on headings or numeric values.
- **Don't** use clichéd purple/cyan neon gradients that signal generic AI generation.
- **Don't** hide processing progress; always communicate file count, step status, and percentage during client computations.
- **Don't** compress Thai typography line heights below 1.4, as tone markers and diacritics will clip.
- **Don't** upload, transmit, or proxy user files to external servers or remote endpoints under any circumstances.
