# 0024 — Google Sans and Cooper are the typefaces

Status:   superseded by 0025
Date:     2026-09-30
Deciders: kritpavin

## Context

The web app was set in Inter. The design's text styles (ADR 0023) use two other faces: **Google
Sans** for every style but Display, and **Cooper** SemiBold for Display 1–6. Cooper had been left
out because the retired build's copy was believed to be licensed for embedding only, and this
repository is public.

The Cooper files now provided are the Cooper* project's, licensed **SIL OFL 1.1**. The OFL permits
bundling and redistributing the fonts, including in a public repository, as long as the licence
travels with them and the fonts are not sold on their own. Google Sans is on Google Fonts.

## Decision

Replace Inter with **Google Sans**, loaded through `next/font/google`, as the body face.

Commit **Cooper SemiBold** — the one weight any style uses — as a `.woff2` in
`apps/web/app/_lib/fonts/cooper/`, with the OFL `LICENSE.md` beside it, and load it through
`next/font/local` as the display face. The token layer names the families (`--family-sans`,
`--family-display`); the root layout supplies them.

## Alternatives

- **Keep Inter.** Rejected: it is not the design's face, and every screen would be checked
  against a Figma file it cannot match.
- **Ship every Cooper weight and italic.** Rejected: twelve files for one used weight
  (`PROJECT.md` §2).
- **Load Cooper from a font host.** Rejected: none serves it, and self-hosting is what
  `next/font` does for Google Sans too, so both behave the same.

## Consequences

- Every screen's text looks different — the face changed everywhere.
- The OFL travels with the font file; deleting `LICENSE.md` would break the licence.
- A new Cooper weight is a new file and a new `localFont` source, when a style first needs it.

Supersedes: —
Referenced by: ADR 0023, `PROJECT.md` §4, `packages/tokens/README.md`, `apps/web/app/layout.tsx`
