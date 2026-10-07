# `@repo/tokens`

Thrive's design tokens, in the three layers `FE_03` R2 requires. They are generated from the design
source, a Blueprint workspace export, and committed (ADR 0028).

## What it owns

| File | Kind | What is in it |
| --- | --- | --- |
| `source/thrive.blueprint.json` | design source | The blueprint export, exactly as design hands it over, apart from formatting. **The source of record** (`FE_03` R6). |
| `src/primitives.css` | generated | Values only: seven OKLCH ramps (`--primary-25` … `--info-950`), the spacing unit, corners, families, and px-named type values. |
| `src/semantic.css` | generated | The roles, and **the only layer a component may reference**. Colour roles (`--action-primary`, `--fg-secondary`, `--status-error-surface`…), elevation, shapes, layout roles and type roles. Tablet and desktop overrides sit under `md` and `lg` media queries. The dark mode is `:root[data-theme='dark']` over the same names. |
| `src/theme.css` | generated | Tailwind's `@theme inline`. It resets the defaults (`--*: initial`) and maps every role onto a utility, so every utility that exists is token-backed (`FE_04` R1). |
| `src/supplement.css` | hand-written | What the blueprint has no section for yet: motion, focus ring width and offset, two content widths, the mono family, and Google Sans's measured backup face (ADR 0025). Each value is a request to design, not a place to add more. |
| `scripts/generate-tokens.ts` | generator | Reads the export and writes the three generated files. |

## What it exports

`@repo/tokens/tokens.css` loads everything in the order it must load. An app imports this one
file. The individual files are exported too, for tests that read them.

## Tasks

```bash
bun run tokens:generate   # regenerate the three files from the blueprint (turbo: tokens:generate)
bun run lint              # biome check
```

To take a new design: replace `source/thrive.blueprint.json` with the new export, run
`bun run tokens:generate`, and commit the export and the outputs together. The diff of the outputs
is what design changed. If a role was renamed or removed, migrate every consumer in the same change
(`FE_03` R10). An undefined custom property fails silently, so search for the old name.

## The rules that bite most often

- **Never edit a generated file** (`FE_03` R5). The next run overwrites it. A wrong value is wrong in
  the blueprint, and that is where it is fixed (R6).
- **A component never references a primitive** (R2). Write `bg-action-primary`, never
  `bg-primary-700`. The theme deliberately exposes no ramp, and Tailwind's defaults are reset, so
  `bg-red-500` and `rounded-md` are not classes either.
- **Names are the blueprint's**, with dots turned into dashes (R9). A role code needs and the
  blueprint lacks is a request to design, not a local addition.
- **A type utility is one blueprint role** (`text-h1`, `text-body-2`, `text-button-sm`). It carries
  size, line height, letter spacing and weight, but not a family. Display, subtitle-display and
  quote also need `font-display`, subtitle-handwrite needs `font-handwrite`, and code needs
  `font-mono`; the `Text` atom adds them. A new role also needs adding to `cn`'s list in
  `apps/web/lib/cn.util.ts`, or `tailwind-merge` will read it as a colour.
- **A theme is a mode of the semantic layer** (R7). No component branches on it, and no class uses
  `dark:` (`FE_04` R8).

## How the generator reads the blueprint

The full reasoning is in ADR 0028.

- **Ramps:** each of the 20 steps keeps the seed's OKLCH hue and chroma at the step's lightness.
  The chroma is reduced until the colour fits sRGB.
- **Devices:** phone is the default, tablet applies from `md`, desktop from `lg`.
- **Type:** size is `16px × deviceRatio ^ stepOffset`, unless the blueprint pins one. Line height is
  size × the group's ratio. Both are rounded to whole pixels.
