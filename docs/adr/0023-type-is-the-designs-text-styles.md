# 0023 — Type is the design's text styles

Status:   accepted
Date:     2026-09-30
Deciders: kritpavin

## Context

The type layer was Tailwind v4's default scale (`text-xs` … `text-4xl`) copied into
`packages/tokens`, because the retired build recorded no type values. It was provisional.

The Figma file now defines the type: 24 text styles — Display 1–6 in **Cooper SemiBold**; H1–H6,
subtitle1–4, body1–3, caption and overline in **Google Sans**; and three Button styles — each a
size, line height, letter spacing and weight. Which faces those are, and how they are shipped, is
ADR 0024.

A size scale and a set of text styles do not line up: `text-lg` (18px) exists in no style, and
every style fixes line height and tracking that a size utility leaves to chance.

## Decision

**Type utilities are the design's text styles, one for one, and nothing else.** `text-display1`
… `text-caption` and `text-button-large|medium|small`, each carrying size, line height, letter
spacing and weight through Tailwind's `--text-*--…` sub-properties. The old scale is removed and
every call site moved to the nearest style in the same change (`FE_03` R10). The three layers
hold: px-named primitives (`--size-48`, `--leading-56`, `--tracking-n3`), a `--type-<role>-*`
quartet per role in the semantic layer, and the theme's `--text-<role>` built from those.

`font-display` selects the display face for the Display styles, because a Tailwind type utility
cannot carry a family.

A **`Text`** atom sets any style on any element — `variant` is the look, `as` the element — so a
heading's level follows the page outline rather than its size. Atoms keep using the utilities,
since an atom composes no other atom (`FE_02` R2).

## Alternatives

- **Keep the scale and add the roles beside it.** Rejected: two type vocabularies, and nothing
  stops a screen mixing `text-sm` with `text-body2`.

## Consequences

- Every screen's text changed on purpose — in places size and weight (buttons are Medium, as
  the design draws them, not SemiBold).
- `tailwind-merge` reads an unknown `text-*` as a colour, so `cn('text-body2
  text-foreground-muted')` dropped the size. `apps/web/lib/cn.util.ts` now lists the roles as
  font sizes, with a test; **a new role is added there too.**
- Styles are fixed sizes; the design gives no mobile variants, so Display 1 is 72px on a phone.
  A responsive step is a design decision still to be made.
- The styles are hand-copied from Figma, like the rest of the tokens, until Spike #43 generates
  them.

Supersedes: —
Referenced by: ADR 0024, `PROJECT.md` §4, `packages/tokens/README.md`, `apps/web/lib/cn.util.ts`,
`/ui-showcase/tokens`
