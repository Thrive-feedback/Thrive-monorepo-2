# 0076 — The Kudos board reads by month, on one clock

**Status:** accepted, 2026-11-01

## Context

The Kudos board shows a Workspace's Kudos a page at a time and can be narrowed to one month. It needs
three things the list route does not give: Kudos for one month, the months that have any, and how
many pages there are, for its `Page 2 of 9`.

ADR 0059 pages every list by cursor and has no `total`, and says a count, if one is ever wanted, "is
a separate read, not a field on every page". The product owner chose Previous and Next over numbered
pages to keep that, so nothing here jumps to a page.

A month also needs a clock. `kudos.createdAt` is a UTC timestamp with no zone, and neither a Workspace
nor a Member has a time zone. Thirty-first of October at 23:00 UTC is the morning of 1 November in
Thailand, where every team using Thrive is today.

## Decision

**A month is a calendar month on one fixed clock, UTC+7, for everyone; and how many Kudos each month
holds is one read of its own.**

- `GET /v1/workspaces/{workspaceId}/kudos` takes an optional `month`, `YYYY-MM`, and otherwise pages
  as ADR 0059 says. `KudosMonth` turns it into a half-open range of instants, so the existing index on
  `(workspaceId, createdAt, id)` serves it, and no migration is needed.
- `GET /v1/workspaces/{workspaceId}/kudos/months` answers `{ total, months: [{ month, count }] }`,
  newest first, with only the months that hold a Kudos. It is the separate read ADR 0059 allows.
- **That read is one summary of a Workspace, not a collection, so it is not paged** (`BE_07` R5). It
  grows by twelve rows a year at most.
- **The clock is one constant**, in `KudosMonth`, and the grouping in SQL reads the same constant, so
  the filter and the counts cannot disagree. Thailand keeps no daylight saving, so a fixed offset is
  the whole of it.

## Consequences

- A Kudos sits in the same month for every Member, wherever they are.
- A team far from Thailand sees the edges of a month up to a day out. A Workspace time zone would
  replace the constant; nothing stored has to change, because only the reads know the clock.
- The grouping is the first `$queryRaw` in a query: Prisma cannot group by a computed month.
- A total read beside a page can be out of step if someone gives Kudos in between. `Page 2 of 9` may
  be one page short until the next read, and the bar still stops at the real end, because `nextCursor`
  decides that and not the count.
- This fulfils the note in ADR 0073 that only `/home` lists Kudos: the board now draws the card.

## Alternatives rejected

- **Numbered pages, with `page` and `total` on a board route.** It would allow jumping to a page, but
  it brings back the offset paging ADR 0059 removed, and a card can repeat when someone gives Kudos
  while another reads. The product owner preferred to keep the cursor.
- **Each viewer's own time zone.** The same Kudos would sit in different months for two Members of one
  Workspace, on a board they share, and the server would need the browser's zone through a cookie.
- **UTC.** The least code, but a Kudos given before 07:00 on the 1st lands in the previous month for
  everyone using Thrive today.
- **Reading every `createdAt` and grouping in the use case.** No raw SQL, but it loads a Workspace's
  whole history on every visit to the board.
- **A `total` on the list route.** It is the field ADR 0059 removed, paid for on every page, and it
  still could not say which months exist.

## Links

- ADR 0059, ADR 0073, ADR 0075, `BE_07` R5, `GEN_08` R7
