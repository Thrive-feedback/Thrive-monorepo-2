# 0059 — Every collection pages by cursor

Status:   accepted
Date:     2026-10-24
Deciders: kritpavin

## Context

`BE_07` R5 asks for one paging shape across the API. It names offset paging
(`page`, `pageSize` → `{ items, total, page, pageSize }`) as the default, and allows a cursor
variant "as one alternative shape used consistently, decided by ADR". It leaves the cursor's
parameter names undecided, which it lists as an open question.

All thirteen collection routes page by offset today. The web asks every one of them for page 1 at
the largest size, 100, and never asks for page 2. Anything past the hundredth item cannot be seen,
and each Home render loads up to six full pages, each with a `count(*)`.

The product owner wants every list to scroll without end (2026-10-24). The busiest lists put the
newest first: the Workspace feed, Feedback for me, Shared with me, My requests, Waiting for me.
With offset paging, Feedback written while someone scrolls pushes rows down a page, so the next
page repeats one they have already seen. If something is ever removed, the next page skips one
instead.

## Decision

**Every collection route pages by cursor, with one shape:**

```
GET /v1/…?cursor=<opaque>&limit=20
{ "items": [ … ], "nextCursor": "<opaque>" | null }
```

- `limit` is between 1 and 100, and defaults to 20. Larger values are refused (`REQUEST_INVALID`),
  as `pageSize` is refused today.
- `cursor` is opaque to the client: the base64url encoding of the primary key of the last row it
  was sent. Omitted, it means the first page. A value that does not decode to an id is refused
  with `REQUEST_INVALID`.
- `nextCursor` is `null` on the last page. A client stops when it reads `null`, and never computes a
  cursor itself.
- The order is each list's existing `orderBy`. Every one ends in `id`, so it is total, and a cursor
  names exactly one position in it.
- There is no `total`. The one reader of it only asks whether a person has any active Workspace,
  which `limit=1` and `items.length` answer. Dropping it removes a `count(*)` from every page.
- Inside the API a query reads `limit + 1` rows. The extra row only tells whether a next page
  exists, and is never returned.

The change reaches the wire in three steps (`GEN_08` R8). First the API accepts and answers both
shapes. Then the web moves to cursors and scrolls. Then the offset shape is removed.

## Consequences

- A list that grows at its head no longer repeats or skips a row while someone scrolls.
- A client cannot jump to page 7, or show "128 results". No screen does either today. A count, if one
  is ever wanted, is a separate read, not a field on every page.
- A cursor outlives the row it names only as far as the store allows. If that row has been removed,
  the next page may come back empty, and the client starts again from the top.
- A list ordered by a column that changes, such as `members/mine` by `lastUsedAt`, can still move
  under a scroll when someone switches Workspace mid-scroll. That list is a person's own
  Workspaces, and is short.
- This answers `BE_07`'s open question on cursor parameter names for this project. It changes no
  rule in `BE_07`, so the convention document is unchanged (`GEN_13` R9). The names are worth
  proposing upstream as their own pull request (`GEN_03` R10).

## Alternatives rejected

- **Keep offset paging and have the web request page 2.** This is the default in `BE_07` R5, but
  newest-first lists repeat and skip rows as they grow, and every page still pays for a `count(*)`.
- **Offset and cursor side by side.** This gives two shapes for one concern, which `BE_07` R5 exists
  to prevent. Every client would have to learn both.
- **A cursor that encodes the sort values instead of the id.** It is more robust when the row named
  is removed, but it is a second encoding to version for every list. Prisma's native cursor,
  positioned on the primary key, already orders by the list's own fields.

## Links

- `BE_07` R5, R6, `GEN_08` R7–R8, `GEN_13` R9
