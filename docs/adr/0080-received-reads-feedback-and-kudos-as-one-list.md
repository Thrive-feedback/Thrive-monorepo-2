# 0080 — Received reads Feedback and Kudos as one list

Status:   accepted
Date:     2026-11-01
Deciders: kritpavin

## Context

The Received page at `/brand-new-received` shows what was written to one Member, Feedback they are a
Receiver of and Kudos that name them, newest first, scrolling without end, as a grid of the real
cards or as a list of Home's cards.

ADR 0077 made `feed-items` one list over both tables, under one cursor. Received needs the same
list and two things that route will not give it: Only me, which ADR 0071 keeps off Home, and the
card each piece was written on. `GET /feedback` lists a Member's Feedback, but by offset, with
neither Kudos, a card nor a Visibility.

ADR 0074 also left a question for this read: a Kudos that names nobody has no recipient rows, so
does it count as received?

## Decision

**`GET /v1/workspaces/{workspaceId}/received-items` is one read over both tables, in ADR 0077's
shape and under its cursor.** Everything ADR 0077 settles about the cursor, the order and paging
past a position holds here unchanged, and the reads it added are reused.

- **An item is a `feed-items` item with more on it.** A Kudos has the shape it has there. A piece of
  Feedback adds `postcard`, and on its `request` adds `postcard` and `answerPostcard`, so a page can
  draw its real cards without reading them one at a time, and the same item can be drawn as a card
  on Home. `readerAccountId` comes with it, for the same reason it does there.
- **Every Visibility is included, Only me too.** A Receiver owns what was written to them. Whose list
  it is comes from the session and is an argument to the read, so a version that lists somebody
  else's cannot be written by accident.
- **Feedback is received by its Receivers alone.** Feedback that only mentions a Member stays in what
  they read on Home.
- **A Kudos is received by the people it names.** One for the whole Workspace is not in anyone's list.
  It is on the board for all of them, and a list that holds the same card for every Member is not a
  list of what was written to you. This answers ADR 0074's open point, the same way Shared with me
  does in ADR 0077.

## Alternatives

- **A `show=RECEIVED` choice on `feed-items`.** One route, but `feed-items` promises Only me never
  reaches Home, and its guard and contract rely on that. It would also carry cards no Home list uses.
- **Merge on the web**, a page of each. Rejected for the reason ADR 0071 gives. Feedback would also
  still need a cursor, a card and a Visibility added.
- **Count a whole-Workspace Kudos as received.** Rejected above: every team-wide thanks would land in
  every Member's collection and crowd out what was written to them.

## Consequences

- A page after the first costs the two position lookups ADR 0077 describes, on top of two reads.
- The two lists of a merged page are mapped in two use cases. What they share is the order,
  `newestFirst`, and the reads; each builds its own view, because the two views differ.
- `GET /feedback` stays as it is for `/home`, and goes when `/home` does.
- The brain's `ADR-0045` and glossary still say a Kudos names its recipients; that gap is ADR 0074's.

Supersedes: —
Referenced by: `list-received-items.use-case.ts`, `received-items.controller.ts`,
`features/received-items.feature`
