# 0028 — The blueprint workspace is the design source for tokens

Status:   proposed
Date:     2026-10-07
Deciders: kritpavin

## Context

`packages/tokens` was hand-written. `FE_03` R6 made it the source of record only until a design
source existed, and Spike #43 was to decide how design and code exchange tokens. Design has now
delivered a **Blueprint workspace export**, `thrive.blueprint.json` (format version 8). It covers:

- seven colour tracks, each a seed colour and one shared 20-step lightness list;
- 72 semantic colour roles, each with a light and a dark value;
- a modular type system of 45 roles, with a ratio per device (phone, tablet, desktop);
- spacing, radius, elevation, and per-device layout roles.

Its role names (`action.primary`, `surface.base`, `fg.secondary`, `status.error`) are not the ones
code used (`--action`, `--surface`, `--foreground-muted`, `--danger`). The export stores each ramp
as a seed and a lightness list, never as finished colours.

## Decision

**The committed export is the design source, and the token files are generated from it.**

- The export lives at `packages/tokens/source/thrive.blueprint.json`. `bun run tokens:generate`
  (`scripts/generate-tokens.ts`, no dependency beyond Bun) writes `src/primitives.css`,
  `src/semantic.css` and `src/theme.css`, each headed as generated. They are committed and never
  edited (`FE_03` R5, the same call `GEN_08` R4 makes for the contract). **Code pulls**: a new
  export replaces the file, then the generator runs, and the diff shows what design changed.
- **Names come from the blueprint unchanged**, apart from the dot becoming a dash
  (`action.primary-hover` → `--action-primary-hover` → `bg-action-primary-hover`). There is no
  translation table (`FE_03` R9). Every consumer moved in this change, and roles code used that
  the blueprint lacks moved to the nearest blueprint role (`FE_03` R10). Examples:
  - backdrop → `surface-base`/`surface-subtle`
  - brand and link → `fg-accent`
  - floating → `surface-overlay` + `shadow-med`
  - accent → `action-secondary`
- **Ramps are derived in OKLCH.** For each step:
  - L is the blueprint's lightness value;
  - the hue is the seed's hue;
  - the chroma is the seed's chroma, reduced by bisection until the colour fits sRGB.

  Steps are 25, 50, 100 … 950, one per lightness value.
- **Devices map to the theme's breakpoints:** phone is the default, tablet from `md` (48rem),
  desktop from `lg` (64rem). The semantic layer overrides only the values that change.
- **Type sizes** are `baseFontSizePx × deviceRatio ^ stepOffset` unless the blueprint pins a
  size. Line heights are size × the group's line-height ratio. Both are rounded to whole pixels
  and written in rem.
- **Dark mode is generated** as `:root[data-theme='dark']` over the same role names (`FE_03` R7).
  A navbar toggle sets the attribute and keeps the choice in `localStorage` (`thrive.theme`). A
  small inline script in the root layout's `<head>` applies it before the first paint, so the
  server keeps rendering a static light page and a saved dark page does not flash.
- **The blueprint has no section for some values**, so these stay hand-written in
  `src/supplement.css`, each a request to design (`FE_03` R6):
  - motion durations;
  - focus ring width and offset;
  - two content widths;
  - the mono family;
  - Google Sans's measured backup face (ADR 0025's face, moved out of `primitives.css`).

## Alternatives

- **Transcribe the export by hand into the existing files.** Rejected: it keeps code as a second
  source of record that drifts from the design file. It is exactly what `FE_03` R5 and R6 exist
  to prevent.
- **Keep the old role names and map the blueprint onto them.** Rejected: that is the translation
  table `FE_03` R9 calls a failure. Two vocabularies would describe one design.
- **Ask design for finished colours instead of deriving them.** Not available from this export.
  If Blueprint gains an export with resolved values, the generator should read those and drop
  its own ramp maths.
- **Figma variables as the source (#43's original plan).** Not what design delivered for tokens.
  #43 remains the route for the icon set (`FE_03` R8), which the blueprint does not hold.
- **Store the theme in a cookie and read it in the root layout.** Rejected: reading a cookie
  there makes every route dynamic. The head script gets the same result on a static page.

## Consequences

- The derived ramps can differ slightly from what the Blueprint tool shows for the same seed.
  `/ui-showcase/tokens` is where the two are compared, and a mismatch is fixed by changing the
  algorithm here or the seed in the blueprint, never by editing a generated file.
- The brand changes: the primary seed is charcoal (`#2f3437`), not the retired build's purple.
- Type role names change from ADR 0023's `display1`, `body2`, `button-medium` to the blueprint's
  `display-1`, `body-2`, `button-sm`. That ADR's decision, that type utilities are the design's
  text styles one for one, still holds.
- A design change now needs a regenerate and a commit. Nothing yet checks in CI that the committed
  outputs match the export; until that check exists (`INFRA_09`), a hand edit is caught only in
  review.
- Two roles fail WCAG's 3:1 non-text contrast in both modes. They are reported to design rather
  than patched (`FE_06` R9):
  - `focus.ring`: 1.98 light / 1.74 dark;
  - `border.strong`, used for input outlines: 1.98 / 1.44.
- The display roles ask for weight 700, but the only Cooper file is SemiBold. `font-synthesis-weight:
  none` stops the browser faking a bold until design confirms 600 or supplies a Bold.
