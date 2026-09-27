# `@repo/tokens`

Thrive's design tokens, in the three layers `FE_03` R2 requires, all in one package so that
"outside the semantic layer" is a path as well as a name.

| File | Layer | What belongs in it |
| --- | --- | --- |
| `src/primitives.css` | values | Seven OKLCH ramps, the spacing multiplier, radii, font families. Names a value, never an intent. |
| `src/semantic.css` | roles | `--surface`, `--action`, `--danger`… Each points at a primitive. **The only layer a component may reference.** |
| `src/theme.css` | Tailwind | `@theme inline`, mapping roles onto Tailwind's namespaces so every utility is token-backed (`FE_04` R1). |

An app imports `@repo/tokens/tokens.css`, which pulls all three in the order they have to load.

## The rules that bite most often

- **A component never references a primitive** (`FE_03` R2). `bg-action`, never `bg-primary-500` —
  and the theme deliberately does not expose the ramps, so the second one does not exist as a
  utility.
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

The old build also used **Cooper** for display type. It is a licensed typeface and its `.woff2`
files live in the retired repository, so it is deliberately left out until Thrive's licence is
confirmed to cover embedding it in a public repository. Inter carries everything for now.
