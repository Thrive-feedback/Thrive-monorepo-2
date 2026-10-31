# 0073 — A Kudos keeps how its card looks as one JSON value

**Status:** accepted, 2026-10-31

## Context

A Kudos is now written on a card of its own: portrait, one side, no stamp. The Giver chooses one of
six templates, sets the words as they do on a postcard, and puts stickers on it. Until now a Kudos
held only its message, so all of that would be lost on send.

ADR 0067 settled this for Feedback and Feedback Requests: a look is read whole, written once and
never queried. A Kudos card is the same kind of value, but not the same shape. It has no front, so a
sticker has no side; it has no paper tone and no stamp; and one of its templates is dark, so it needs
an ink a postcard does not have.

## Decision

**A Kudos card is one nullable `card` JSONB column on `kudos`, and one value object, `KudosCard`, in
the Feedback module, is what holds its rules.**

- **The column is null for a Kudos not written on a card**: every row from before this, and what the
  `/home` form sends. `card` is optional on `POST /v1/workspaces/{workspaceId}/kudos`.
- **`KudosCard.of` holds what the request schema cannot**: the template key's shape, how many
  stickers, and their ranges. These are the postcard's own limits, shared rather than repeated. A
  failure is `KUDOS_CARD_INVALID`.
- **A template key is checked for its shape and never against a list.** The templates belong to the
  web app, as ADR 0067 says of pictures, and a retired template stays valid on the cards that used
  it. Unlike a postcard's, these keys name no file: a template is drawn in CSS, so the key is a slug
  such as `cobalt-dash`, not `system/...`.
- **The inks are the postcard's five and `paper`**, the colour of the card itself, for the template
  dark enough to need it. Which template offers which ink is the web app's to decide.
- **A stored card is read without those checks**, as ADR 0067 says, so a limit tightened later cannot
  stop a Kudos being read. A value that no longer has the card's shape at all, which only a hand edit
  or a changed shape can leave, reads as no card and logs `feedback.kudos_card_unreadable`, so one bad
  row costs one card rather than the whole board.
- **`GET /v1/workspaces/{workspaceId}/kudos` carries `card`.** A Kudos is read by every Member, so its
  card is too, with no rule of its own.
- **How long the message is decides how large it is drawn, and that is not stored.** `sizeStep` is
  the largest the Giver chose. The web app steps it down from the message's length alone, so a card
  never scrolls, and every reader gets the same size from the same two values.

## Consequences

- A later field needs no migration; the mapper and the value object change together.
- Postgres does not enforce the shape. What holds it is the value object on the way in and the
  mapper's parse on the way out.
- Two look shapes now exist, `Postcard` and `KudosCard`, sharing only the checks on the words and the
  stickers. A change to a sticker's limits changes both, on purpose.
- Nothing on `/brand-new-home` shows a Kudos yet, since `feed-items` reads Feedback alone (ADR 0071).
  The card is stored and carried by the route that lists Kudos, and only `/home` lists them so far,
  without drawing it.

## Alternatives rejected

- **Reuse `Postcard` with an unused front.** It would need a tone and a stamp that mean nothing here,
  and a sticker's `side` that can only ever have one value. A shape that allows what can never be
  true is what `GEN_07` R5 rules out.
- **Columns on `kudos`, with a `kudos_sticker` table.** Rejected by ADR 0067's reasoning: a table and
  a migration per field, for values nothing queries.
- **Reuse `POSTCARD_INVALID`.** The refusal would name something the caller did not send.

Referenced by: `kudos-card.vo.ts`, `kudos.mapper.ts`, `give-kudos.dto.ts`
