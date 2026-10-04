# 0025 — Google Sans has a measured backup face

Status:   accepted
Date:     2026-10-04
Deciders: kritpavin

## Context

ADR 0024 made Google Sans the body face, loaded through `next/font/google`, and Cooper the display
face, loaded through `next/font/local`. It rejected loading Cooper from a font host because
"self-hosting is what `next/font` does for Google Sans too, so both behave the same."

They do not behave the same. Both loaders also build a **backup face**: a system font resized to
take the space the real face will, so text laid out before the font arrives does not move when it
swaps in (`display: 'swap'`). `next/font/local` measures the font file it is given, so Cooper gets
one. `next/font/google` does not measure; it looks the family up in a table shipped with Next.js,
and Next.js 16.3's table has no Google Sans — it was added to Google Fonts after the table was
made. So the build logged `Failed to find font override values for font 'Google Sans'`, built no
backup face, and every screen's text jumped when Google Sans arrived (issue #111). With Arial as
the stand-in, lines were 1.5px shorter at 16px — 18.5px against 20px — and letters about 1%
narrower.

## Decision

The faces are as ADR 0024 chose them: **Google Sans** is the body face, loaded through
`next/font/google`; **Cooper** SemiBold is the display face, committed as a `.woff2` with its SIL
OFL 1.1 `LICENSE.md` in `apps/web/app/_lib/fonts/cooper/` and loaded through `next/font/local`,
which builds its backup face. The token layer names the families (`--family-sans`,
`--family-display`); the root layout supplies them.

What changes is that Google Sans's backup face is supplied by us:

- The token layer declares `@font-face { font-family: 'Google Sans Fallback' }` beside
  `--family-sans` in `packages/tokens/src/primitives.css`: `local('Arial')` with `size-adjust`,
  `ascent-override`, `descent-override` and `line-gap-override` **measured from the Google Sans
  file Next.js downloads**, using the formula `next/font/local` applies to any local file.
- The root layout names that face as Google Sans's `fallback` and sets
  `adjustFontFallback: false`, so neither Turbopack nor webpack goes looking for metrics it does
  not have.

Cooper is unchanged.

## Alternatives

- **Switch the warning off and accept the jump.** Rejected: the jump is the defect; the warning is
  only how it surfaced.
- **Load Google Sans through `next/font/local` from a committed file**, so Next.js measures it
  like Cooper. Rejected for now: it trades a four-value face for committing and updating the font
  files ourselves, and gives up the per-subset files and `unicode-range` splitting Google Fonts
  serves.
- **Wait for Next.js to add Google Sans to its table.** Rejected: no date, and the jump is on
  every screen until then.

## Consequences

- The four values are a copy of measurements, not derived at build time. If Google Fonts ships a
  Google Sans with different metrics, they go stale silently and the jump returns, smaller.
  Re-measure on a new version.
- `'Google Sans Fallback'` is a name two files must agree on — the layout's `fallback` and the
  token layer's `@font-face`. `apps/web/app/layout.test.ts` checks both.
- When a Next.js upgrade adds Google Sans to its table, the same test fails on purpose: delete our
  face and the layout's two options, and let Next.js build it.
- `local('Arial')` exists on macOS and Windows. Where it does not, the backup face does not load
  and the stack falls through to the system font, as it did before — no worse than today.

Supersedes: 0024
Referenced by: `PROJECT.md` §4, `packages/tokens/README.md`, `packages/tokens/src/primitives.css`,
`apps/web/app/layout.tsx`, `apps/web/app/layout.test.ts`
