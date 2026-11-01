# 0077 — Kudos joins Home's list

**Status:** accepted, 2026-11-01

## Context

Home reads one list from one route, paged by one cursor (ADR 0071), and that route reads Feedback
alone. The product owner wants Kudos on it, between the Feedback, each drawn on its card.

ADR 0071 saw this coming: "Kudos joins this list later from another table, so a cursor will then have
to name a place across both." ADR 0060 merged the two on the web for `/home`, which is exact for one
page only, so it cannot serve a list that scrolls without end.

## Decision

**`GET /v1/workspaces/{workspaceId}/feed-items` reads both tables, merged newest first, under one
cursor.**

- **The cursor does not change.** It is still the id of the last row sent (ADR 0059). Both tables sort
  by `createdAt` then `id`, so a row's position means the same in either. The use case looks the id up
  in both to find that position, then reads each table from it.
- **Each table is read past a position with a `where` on `(createdAt, id)`**, not Prisma's `cursor`,
  which only knows a row of its own table. This also means a row leaving a list cannot make the next
  page skip one, the case ADR 0075 had to work around.
- **A cursor naming neither table's row reads as the end of the list.** ADR 0059 already says a client
  starts again from the top when a page comes back empty.
- **`items` becomes a union on `kind`, `FEEDBACK` or `KUDOS`.** A Kudos item has the shape it has on
  `GET …/kudos`, card included, so one mapper serves both routes.
- **Under `show`, a Kudos follows what it is.** Every Member reads every Kudos, so All Feedback and
  Everyone in the Workspace hold them all. Shared with me holds a Kudos that names the reader as a
  recipient. One for the whole Workspace names nobody, so it is not there (ADR 0074).
- **One people lookup covers both kinds**, so a page costs the same however its rows divide.

`feed` and `shared-feedback` stay as they are for `/home`, and the merge of ADR 0060 stays with them.

## Consequences

- **This changes the shape of a published response**, which `GEN_08` R7 calls breaking: an old web
  reading a Kudos item would find no `origin`. The web is the route's only client and there are no
  users yet, so the API and the web go out in one deploy, API first, with no second route to retire.
- Every page after the first costs up to two more reads, to find the cursor's row. Each is a primary
  key lookup.
- A Kudos given while someone scrolls cannot repeat a row, for the same reason ADR 0059 gives.
- The brain's glossary says Kudos is on the feed "only until Kudos has a page of its own". It now has
  both, and that line needs changing there.

## Alternatives rejected

- **Keep merging on the web.** Two cursors, and the reason ADR 0071 was written.
- **A cursor that encodes `(createdAt, id)`.** It would avoid the lookups, but it is the second encoding
  ADR 0059 rejected, and every other list would keep the first.
- **A `kudos` array beside `items`.** Additive on the wire, but the client would have to merge by date
  again, and the page size would mean nothing.
- **A second route for the mixed list.** Two routes for one screen until the first is retired, with no
  client that needs the first to stay as it is.

## Links

- ADR 0059, ADR 0060, ADR 0071, ADR 0074, ADR 0075, `GEN_08` R7
