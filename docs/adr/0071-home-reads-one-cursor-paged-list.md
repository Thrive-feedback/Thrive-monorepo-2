# 0071 — Home reads one list, paged by one cursor

Status:   accepted
Date:     2026-10-31
Deciders: kritpavin

## Context

The Home menu at `/brand-new-home` shows Feedback set to Everyone and Feedback that selects or
mentions the reader, under a filter, in one list that scrolls without end. Those two are separate
routes today, `feed` and `shared-feedback`, both on the offset paging ADR 0059 is retiring, and
`/home` still reads both.

Merging them on the web would need a cursor for each. A page of one holds nothing about where the
other stands, so a card could arrive above cards already on screen, and the two lists would finish
at different times.

## Decision

**`GET /v1/workspaces/{workspaceId}/feed-items` is one read over both, paged by ADR 0059's cursor.**

- `show` is `ALL`, `EVERYONE` or `SHARED_WITH_ME`, and defaults to `ALL`.
- The Visibility is applied in the read's `WHERE`, as ADR 0044 requires of a list. The reader comes
  from the session.
- **Only Everyone and Selected people reach Home.** The Giver or a Receiver of Offered Feedback cannot
  be selected, so a Selected piece of their own stays out of it with no rule of its own: it belongs
  to their history. A Giver asked can be selected too, and then reads every answer of that request
  here, their own among them. A mentioned person is selected already (brain `ADR-0047`), so a Mention
  needs no rule either.
- **Each item carries its Visibility**, so a card can say who can read it.
- **An answer carries its question, who asked, and everyone asked**, each with where their Ask stands
  and their answer (brain `ADR-0050`). The other answers need no Visibility check of their own: every
  answer copies the request's Visibility, and a Mention in an answer adds no reader. They are nested
  in the one read, so a page costs a fixed number of queries.
- **The response names its reader**, `readerAccountId`. No other route tells the web whose account
  it is reading for, and a card has to say "You".
- `feed` and `shared-feedback` stay as they are, for `/home`. They go when it does.

## Alternatives

- **Extend `feed`.** Rejected: one route would answer two paging shapes, and it would stop meaning
  Everyone, which its guard and its documentation rely on.
- **Merge on the web.** Rejected for the two cursors above.
- **Offset paging on one route.** Rejected: ADR 0059 exists because Feedback written during a scroll
  repeats a row.

## Consequences

- Kudos joins this list later from another table, so a cursor will then have to name a place across
  both. The cursor is opaque, so that changes nothing on the web.
- `/home` and Home read the same Feedback through different routes until `/home` is replaced.
- The route has no `total`, as ADR 0059 says of every collection.

Supersedes: —
Referenced by: `list-feed-items.use-case.ts`, `feed-items.controller.ts`, `features/feed-items.feature`
