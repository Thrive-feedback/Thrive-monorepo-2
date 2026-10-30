# 0064 — System postcard stamps live in a public Supabase bucket

Status:   accepted
Date:     2026-10-30
Deciders: kritpavin

## Context

The postcard's Stamps tool was a placeholder. A writer can now stick up to three stamps on a card,
then move, resize and turn them, as the letter showcase first did with drawn icons. Design has
drawn the stamps as pictures and put the first five in Supabase Storage, in the bucket
`postcard_stamp`, folder `system/`. They are Thrive's own, the same for every Workspace.

ADR 0063 decided where the postcard's templates live and how they reach the browser. Stamps are
the same kind of thing: a handful of pictures Thrive owns, offered from a catalog, that saved
cards will name.

## Decision

**System postcard stamps follow ADR 0063 in every respect, from the public Supabase Storage
bucket `postcard_stamp`, under `system/`.**

- The bucket is **public** and is read with no credential, only through `next/image` on the
  web origin. `images.remotePatterns` in `apps/web/next.config.ts` allows that path beside the
  templates'. Both paths and the host come from `apps/web/lib/postcard-storage.util.ts`. The
  host is the same Supabase project's, so `NEXT_PUBLIC_POSTCARD_STORAGE_HOST` serves both and
  no new variable is added. It was named for templates until this change.
- The catalog, `POSTCARD_STAMPS` in
  `apps/web/components/organisms/postcard-dialog/postcard-stamp.constant.ts`, lists each stamp's
  key, file and name, in the order they are offered. The name is the alt text and the label
  ("Add the Ocean stamp"). A file the catalog does not list is not offered.
- A stamp's **key** is `system/` and its file's name without the extension
  (`system/stamp-02-ocean`). Saved cards will name it, so a key is never reused for another
  picture. **A stamp is retired by taking it out of the catalog, never by deleting its file.**
- **The code draws the stamp**: the paper border and the perforated edge. A file is the picture
  inside it and nothing else. It is square, at least 600×600 (a stamp is at most 180 CSS px across,
  about 540 device px on a 3× screen), PNG or WebP (JPG if fully opaque), sRGB, at most 150 KB,
  filling the square, with what matters in the centre ~85%, since the border insets it and the
  perforations bite its edge. The first five are 1024×1024 opaque PNGs of 16–52 KB.

## Consequences

- Object storage now holds two kinds of system picture. `PROJECT.md` records both.
- Every consequence in ADR 0063 holds for stamps too: the host is in the build; locally the stamps
  need the internet; resizing runs on `thrive-web`; pictures do not follow the theme.
- A stamp that fails to load shows its name on plain paper. It can still be moved, resized,
  turned and removed, and the card can still be sent.
- A change to the border or the perforations changes every stamp at once, without new files.
  Design cannot give a single stamp a frame of its own.

## Alternatives rejected

- **Draw stamps as icons in code, as the letter showcase does.** No storage needed, but Design
  wants illustrated stamps, and an icon set limits them to one colour.
- **Files that carry their own frame and perforations.** Every stamp would need the exact same
  frame redrawn, with transparency around it, and changing the frame would mean new files for all.
- **A bucket of their own in a separate folder of `postcard_template`.** One bucket per kind keeps
  each one's files and rules apart, and the paths say what they hold.

## Links

- ADR 0063 (templates), ADR 0027 (one origin for the browser)
- `FE_06` R7 (every image has an intentional alternative)
