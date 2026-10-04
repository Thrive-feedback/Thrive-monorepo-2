# `@repo/tokens`

Thrive's design tokens, in the three layers `FE_03` R2 requires, all in one package so that
"outside the semantic layer" is a path as well as a name.

| File | Layer | What belongs in it |
| --- | --- | --- |
| `src/primitives.css` | values | Seven OKLCH ramps, the spacing multiplier, radii, stroke, the two loading-loop durations, font families, the design's type values (size, line height, letter spacing in px-named rem), and the weight and width scales. Names a value, never an intent. |
| `src/semantic.css` | roles | `--surface`, `--action`, `--danger`… Each points at a primitive. **The only layer a component may reference.** |
| `src/theme.css` | Tailwind | `@theme inline`, which resets Tailwind's default theme (`--*: initial`) and then maps roles and scales onto its namespaces, so every utility that exists is token-backed (`FE_04` R1). |

An app imports `@repo/tokens/tokens.css`, which pulls all three in the order they have to load.

## The rules that bite most often

- **A component never references a primitive** (`FE_03` R2). `bg-action`, never `bg-primary-500` —
  and the theme deliberately does not expose the ramps, so the second one does not exist as a
  utility. Nor do Tailwind's defaults: the theme resets them, so `bg-red-500`, `rounded-md` and
  `shadow-md` are not classes either. A utility you need that is missing wants a token first.
- **Colours, shapes and type are roles; sizes are scales.** A type utility is one of the
  design's text styles — `text-h1`, `text-body2`, `text-caption` — carrying size, line height,
  letter spacing and weight together; display styles add `font-display`. Spacing, weight, width
  and breakpoint map straight from their primitives, the way `--spacing` does. Breakpoints are
  literal values in `theme.css`, because a media query cannot read a custom property.
- **Names state roles, not appearances** (`FE_03` R3). `--danger`, never `--red`. The day danger
  stops being red, a role name is still true.
- **A theme is a mode of the semantic layer** (`FE_03` R7), attached as
  `:root[data-theme='dark']` overriding the same role names. No component learns that a theme
  exists. Dark mode is not built yet — it was out of scope for #47 — but this is where it goes.

## Where the values came from, and where they are going

The ramps were read out of the retired `Thrive-feedback/thrive-monorepo` build, which is read as a
specification and never ported (`docs/adr/0009`). They are Thrive's real colours rather than
invented placeholders.

Two things are therefore provisional:

1. **`FE_03` R6 makes this package the source of record only until a design source exists.** Spike
   #43 decides how Figma and code exchange tokens; the change that introduces the pipeline migrates
   these values rather than re-deciding them.
2. **The semantic vocabulary is a proposal.** `FE_03` R9 wants names agreed with design before they
   exist in either place, and there is no designer in the loop yet. These are the roles Thrive's
   current screens need and no more (`PROJECT.md` §2).

**Type** follows the design's text styles one for one (`docs/adr/0023`, faces in `docs/adr/0025`). **Google Sans** carries
every role but display and loads from Google Fonts; it also carries display text in Thai, which
Cooper has no glyphs for (`docs/adr/0026`). **Cooper**, the display face, is SIL OFL 1.1,
so it is committed — SemiBold only, the one weight the design uses — with its licence beside it
in `apps/web/app/_lib/fonts/cooper/`. A new role here needs the same name added to `cn`'s list in
`apps/web/lib/cn.util.ts`, or `tailwind-merge` will read it as a colour.
