# 0067 — A postcard's look is one JSON value on the row it belongs to

Status:   accepted
Date:     2026-10-30
Deciders: kritpavin

## Context

`PostcardDialog` writes Feedback and Feedback Requests on a card: a template, up to three stamps
placed anywhere on either side, a paper tone and a text style. Until now nothing of the card was
kept, and sending it reached no API. People are to see the card as it was written, so all four have
to be stored with the words they dress.

A card is read whole and written once. Nothing filters, sorts or counts on any part of it. Every
list in the schema so far is its own child table, and no column is JSON, so this needs deciding
rather than following.

## Decision

**A card is one nullable `postcard` JSONB column on `feedback` and on `feedback_request`, and one
value object, `Postcard`, is what holds its rules.**

- **The column is null for what was not written on a card**: every row from before this, what the
  `/home` form sends, and an answer to an Ask, which has no card of its own yet.
- **`Postcard.of` checks what the request schema cannot**: each key's shape, how many stamps, and
  the ranges of position, size, turn and text size. A failure is `POSTCARD_INVALID`, the same code
  on both routes.
- **A key is checked for its shape and never against the catalog.** The catalogs belong to the web
  app (ADRs 0063, 0064), and a retired picture stays valid on the cards that used it.
- **A stored card is read without those checks** (`Postcard.restore`), as `FeedbackRequest.restore`
  already reads what it stored, so a limit tightened later cannot stop Feedback being read. Only its
  shape is parsed at the store's edge, because JSON has no type of its own there.
- **A card is read wherever its words can be**, under the same Visibility, with no rule of its own.
- A stamp's position is a share of its side, not a pixel, so it stays put on every screen. The
  `id` a stamp has while it is written is local to the editor and is not stored; stamps keep their
  order, which is how they stack.

The reads that carry it now are one piece of Feedback and the Feedback Requests a person opens or
lists. The other lists add it when something draws it.

## Consequences

- A later field, such as cover text, needs no migration, and the mapper and the value object change
  together.
- Postgres does not enforce the shape. What holds it is the value object on the way in and
  the mapper's parse on the way out.
- A card cannot be queried or joined cheaply. Reporting on which stamps are used would mean reading
  JSON, or a change of storage then.
- Reads pay for the card even where nothing draws it. A card is small, and its bound is fixed.

## Alternatives rejected

- **Columns on both tables, with `feedback_stamp` and `feedback_request_stamp` tables.** The
  database would hold the shape, at the cost of two tables, six columns twice, and a migration for
  every new field, all for values nothing queries.
- **One shared `postcard` table.** It keeps the rows narrower, but adds a join to every read and an
  aggregate for something that has no life apart from the words it dresses.
- **Checking keys against the catalog in the API.** It would need the catalog in two apps, and it
  would refuse a card that a retired picture still legitimately appears on.
