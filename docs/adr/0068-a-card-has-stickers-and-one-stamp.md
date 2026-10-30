# 0068 — A card has up to three stickers and one stamp

Status:   accepted
Date:     2026-10-30
Deciders: kritpavin

## Context

A postcard had one kind of thing stuck on it, called a stamp (ADR 0064): up to three, on either side,
moved, sized and turned freely. Design wants two kinds, because they do different jobs. A real
postcard has one stamp in one place. What people stick on a card for fun goes anywhere.

ADR 0067 stored the card as one JSON value with a `stamps` list. Nothing is deployed, so no stored
card holds that shape outside a local database.

## Decision

**A card carries up to three stickers and at most one stamp. Both live in the card's JSON value, as
`stickers` and `stamp`.**

- **Stickers** take over everything stamps did: up to three, on either side, moved, sized, turned and
  taken off. Each is stored as `{ stickerKey, side, x, y, scale, rotation }`.
- **Sticker pictures follow ADR 0064 in every respect**, from the public Supabase Storage bucket
  `postcard_sticker`, under `system/`, offered from `POSTCARD_STICKERS` in
  `apps/web/components/organisms/postcard-dialog/postcard-sticker.constant.ts`. A file is a square
  cut-out on a transparent ground, at least 1024×1024, and the code draws no frame around it.
- **The stamp** is stored as `stampKey`, or `null`. It has no side, position, size or angle: it is
  always upright in the top-right corner of the back, 96 px and 5 px from the card's edges, so moving
  that corner later moves every card. It can be chosen, swapped and taken off, and nothing else. The
  pictures stay in `postcard_stamp` (ADR 0064).
- **The stamp never covers the writing.** A band at the top of the back is kept clear on every card,
  with or without a stamp, so adding one never moves the text.
- **Giving and asking choose a stamp.** An answer does not: it is written on the Requester's card, and
  a card has one.

## Consequences

- Every card gives up about a line of writing to the band, a little more on a phone.
- The stamp is drawn from code alone, so a change to the corner or the size changes every saved card
  at once. That is the point, and it means a card is not a pixel record of what was written.
- Stickers may cover the writing, as stamps did. The writer put them there and can move them.
- Local rows holding the old `stamps` key were cleared rather than migrated. No code reads that shape.

## Alternatives rejected

- **One kind with a flag.** The two share almost nothing: count, place, what can be changed and how
  each is drawn all differ.
- **Storing the stamp's side and position.** They could only ever hold one value, and would pin every
  saved card to today's corner.
- **Letting the stamp turn.** It was built and taken out. A stamp that turns needs the band as deep as
  its widest angle, so the stamp had to be smaller, and tilting it added little.
