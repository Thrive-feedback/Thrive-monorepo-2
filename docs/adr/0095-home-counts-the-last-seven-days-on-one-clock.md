# 0095 — Home counts the last seven days, on one clock

Status:   accepted
Date:     2026-11-22
Deciders: kritpavin

## Context

Home is redesigned around the week: a ribbon of the last seven days, each with a mark for what it
held, a sentence over it ("In the last 7 days: …"), and the list below grouped by day with a quiet
line for a day that held nothing. All of it needs how much of each kind every day held.

`feed-items` cannot say: it pages by cursor with no total (ADR 0059, ADR 0071), and a page of 20 may
not reach Wednesday. ADR 0059 allows a count as "a separate read, not a field on every page", which
is what ADR 0076 did for the Kudos board's months. A day also needs a clock, and ADR 0076 already
chose one for the board: a fixed UTC+7, because neither a Workspace nor a Member has a time zone.

## Decision

**`GET /v1/workspaces/{workspaceId}/feed-items/days?show=` answers how much Offered Feedback,
Requested Feedback and Kudos the caller's Home held on each of the last seven days, and every item
of `feed-items` carries the `day` it falls on. Both read the one clock.**

- **The days.** Today and the six before it, oldest first, every one of them present, a day that
  held nothing as zeros, plus their `totals`. It is one summary of a reader's Home, so it is not
  paged (`BE_07` R5).
- **Today is the server's.** The use case reads `Clock`; no parameter names a day, so no browser
  decides where a day turns.
- **A count is the list's rows.** The reads reuse the list's own filters — `feedItemsWhere` for
  Feedback, `kudosOnHomeWhere` for Kudos — with a range on the stored instant. So the Visibility is
  applied in the read (ADR 0044), Shared with me counts no Kudos (ADR 0090), and a count can never
  name something the reader cannot open. An integration spec pages the whole list under each `show`
  and checks it counts the same.
- **Two small reads, in parallel, counted in the domain.** `RecentDays` buckets the instants on the
  clock. No SQL works out a day, so the Visibility rule is written once.
- **One clock.** `CALENDAR_UTC_OFFSET_HOURS` in `calendar-clock.vo.ts` replaces ADR 0076's constant
  in `KudosMonth`; the board's month, this route's days and each item's `day` all read it.
- **`day` on every `feed-items` item** (`YYYY-MM-DD`), so the web groups by it and holds no copy of
  the clock. Adding a field is safe (`GEN_08` R7).
- **No index and no migration.** Measured on Postgres 17.11 (the local compose image), in a throwaway
  database migrated with `prisma migrate deploy`, then dropped: 200 Workspaces of 10,000 Feedback
  spread uniformly over two years (2M rows; 60% Everyone, 30% Selected people with three people
  selected each, 10% Only me, all Offered, since a Requested row needs its request), and 5,000 Kudos
  each (1M rows), then `VACUUM ANALYZE` and default settings. The SQL is the shape Prisma 7 writes
  for these reads, over a 7-day range, run with `EXPLAIN (ANALYZE, BUFFERS)`:

  | Read | Plan | Time |
  |---|---|---|
  | Everyone | Bitmap scan on `(workspaceId, visibility, createdAt)` | 1.7 ms, 65 buffers |
  | Shared with me | the same index, then the selected-person primary key per row | 2.7 ms, 148 buffers |
  | All | BitmapOr of both ranges, the reader's selections hashed once | 3.8–6.3 ms, ~300 buffers |
  | Kudos | Index-only scan on `(workspaceId, createdAt, id)` | 0.1 ms, 4 buffers |

  All's buffers come from the hashed subplan, which reads every selection of the reader's,
  `feedback_selected_person(accountId)`, in every Workspace, since that table holds no Workspace:
  it grows with the reader's whole history, not with the week. When the hash grows dear the planner
  falls back to checking each row of the week against the primary key `(feedbackId, accountId)`,
  so there is no cliff. Should All grow hot, the adapter can read Everyone and Shared with me
  apart and add them up, which keeps the Visibility rule in one place and needs no migration; a
  covering `(accountId, feedbackId)` index would only speed the hashed path. Kudos' index-only
  scan depends on the visibility map, and this week's rows are the least likely to be marked, so
  production does a few heap fetches; still trivial.
- **No cache.** The answer is per reader and per `show`, and is read beside a list that is not cached.

## Consequences

- The ribbon, the sentence and the quiet days agree with the list by construction.
- The counts and the list are two reads, so something given between them can be one off until the
  next load, as ADR 0076 accepts for the board. **A quiet day on the web is a day whose three counts
  are 0, never a day with no card loaded yet.**
- A team far from Thailand sees a day turn at 17:00 UTC. A Workspace time zone would replace the
  constant; nothing stored has to change.
- A Deactivated Member's Feedback is counted, as it is listed.

## Alternatives rejected

- **The browser passes today, or its time zone.** Two Members of one Workspace would see different
  days for the same card, and a wrong clock shifts the ribbon.
- **A `GROUP BY` in raw SQL.** One query, but the Visibility rule would be written a second time in
  another language, with only a test to keep the two together. The rows read are a week's, a few
  dozen bytes each, so counting them in the use case costs less than that second rule.
- **A rollup table or counters.** Work on every write and a second source of truth, for reads that
  take milliseconds.
- **A `total` on `feed-items`.** The field ADR 0059 removed, and it still could not say which day.
- **Counting the loaded cards on the web.** Wrong as soon as a week holds more than one page.

## Links

- ADR 0044, ADR 0059, ADR 0071, ADR 0076 (amended: its clock is now `calendar-clock.vo.ts`),
  ADR 0077, ADR 0090, `BE_07` R5, `GEN_08` R7
