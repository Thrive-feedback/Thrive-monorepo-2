# 0091 — The navigation's counts come from the items, not from the bell

Status:   accepted
Date:     2026-11-15
Deciders: kritpavin

## Context

Design 0022 D19 counted every number in the navigation from the bell's unread lines: Waiting for me
counted unread `ASK_RECEIVED` lines, and Received and its chips counted unread `ASK_ANSWERED`,
`FEEDBACK_RECEIVED` and `KUDOS_RECEIVED` lines. D19 took this on purpose ("no API of its own") and
wrote down the cost: Mark all as read cleared Waiting for me while an Ask still waited.

The product owner no longer accepts that cost. Reading the bell made every number disappear even
though the Asks were still unanswered and the Feedback and Kudos were still unopened. A number in the
navigation should describe what is behind it.

Feedback shared with a reader as one of the Selected people had no count anywhere. Only the bell
told them about it. The owner chose to count it on Home's Shared with me rather than move Shared
with me into Received, because Received holds what is written *to* the reader and Shared with me
holds Feedback written to somebody else.

## Decision

**The counts are read from Feedback's own data by `GET /v1/workspaces/{workspaceId}/me/counts`,
which returns `{ waitingAsks, newAnswers, newOffered, newKudos, newShared }`. The bell does not affect
them.**

- **Waiting for me** is every Ask still `PENDING` for the caller in this Workspace, which is what the
  Waiting for me list holds. It goes down only when an Ask is answered.
- **Every other count** covers what arrived after the caller last opened that list:
  - `newAnswers` counts answers to the caller's requests, one per answer, so two answers to one
    request count 2.
  - `newOffered` counts Feedback given to the caller unasked.
  - `newKudos` counts Kudos that name the caller.
  - `newShared` counts Feedback in which the caller is one of the Selected people, which is what
    Home's Shared with me shows.
  
  A list the caller has never opened counts everything in it. Received's own number is the sum of
  its three kinds, and does not include `newShared`.
- **"Opened" is a new table, `list_seen`**, holding one row per (Workspace, Account, list) with
  `seenAt`. The `list` column is one of `RECEIVED_REQUESTS`, `RECEIVED_OFFERED`, `RECEIVED_KUDOS` or
  `SHARED_WITH_ME`. `POST /v1/workspaces/{workspaceId}/me/seen` with `{ list }` upserts that row to
  the API's clock and answers `204`.
  - This route departs from `BE_07` on purpose. `me/seen` is not a plural noun (R1), and the list
    it marks is named in the body rather than the path (R9). R2's detail does prescribe a `POST` to
    a resource of its own for a "last seen" timestamp. The route reads as one action, "I have seen
    this list", over a fixed set of lists, which pairs it with `GET me/counts`. It is recorded here
    so the shape is not copied as the pattern for a resource that has an id.
- **When the web marks a list opened.** It sends the mark from the browser when that list is showing:
  a Received chip, or Shared with me chosen in Home's filter. It never sends it while the server
  renders the page, because a prefetched link renders that page too and would clear counts nobody
  saw. Choosing All, on Received or on Home, marks nothing, even though it shows the same items.
- **Where `newShared` is drawn.** It appears beside Shared with me in Home's filter, and on the filter
  itself while it shows something else, so the number is visible without opening the dropdown. It
  also appears beside Home in the sidebar and the tab bar, so it can be seen from every page. A
  screen reader hears it as "unread in Shared with me", so the count is not taken for all of Home.
  Opening Home on All leaves it, like the filter's count; only choosing Shared with me clears it.
- **The bell's `FEEDBACK_SHARED` line opens Home on Shared with me** with the Feedback open over it,
  rather than on All. Following it therefore clears the count, as a Kudos line does for Kudos.
- **Each count uses the same `where` as the list beside it**, from one shared builder
  (`personal-items-where.mapper.ts`). A number can therefore never include a row its list would not
  show. My requests is the exception: its list is read in SQL, one row per request with its answers
  inside. Its count counts those answers through the builder, and an integration test holds the two
  to the same rows.
- **The web reads the counts in the bell's existing poll, in one server action** with the bell's own
  two reads. The Workspace is read once, then the three reads run together. Server actions are
  sent one at a time, so three actions would mean three round trips in a row, holding up every other
  action behind them. Reading one line in the bell, or marking everything read, leaves the counts as
  they are.

This replaces design 0022 D19 for the navigation's counts. The bell's own number and its lines stay
as D19 describes.

## Consequences

- **A poll still costs four API calls**: one membership read, then the unread count, the newest page
  of lines and the counts. It is one browser round trip instead of two. For 50 Members polling once
  a minute, that is under 4 requests a second.
- **One clock, but a window.** `seenAt` and `createdAt` are both stamped by the API: Prisma fills
  `@default(now())` in the client, as the query log shows. The gap is between the page reading its
  list while it renders and the browser sending the mark once it is on screen. Something committed
  in that window was never shown, yet is older than `seenAt`, so it is never counted as new. The
  window is a page load long. The bell usually still tells the person, because the outbox writes
  that line after the mark. Closing it would take the mark carrying the newest `createdAt` the page
  showed; that is not built.
- **A count can be up to a minute old**, the same as the bell. Opening a list and answering an Ask
  both change the number on screen at once, before the next poll confirms it.
- **Home opens on All**, so the Shared with me count stays until the reader chooses Shared with me
  or follows the bell's line to it.
- The bell no longer tells the navigation anything, so `countedIn` and `UnreadPlace` are removed
  from the web.
- Feedback now owns a small piece of per-reader state. It is personal data: an Account id and a
  time.

## Alternatives rejected

- **Count unread Notifications on the server.** The count would be exact, but reading the bell would
  still clear it, which is the very thing the owner asked to stop.
- **A read state on every Feedback and Kudos.** That needs a row per item per reader. A request's
  answers and a Kudos have no page of their own to mark as read, and the owner asked for "new since I
  last opened this list", not for each item.
- **Opening All clears every kind.** The owner chose to clear only the list that was opened.
- **Move Shared with me into Received.** Received is what was written to the reader; Shared with me
  is written to somebody else. Putting them together blurs whose Feedback is whose, and Shared with me
  only became a choice on Home on 2026-11-07.
- **A table per area (`received_seen` and a second one for Home).** Both would hold the same shape
  for the same purpose, so one table with a list column replaces them.
- **A separate provider with its own timer.** It would duplicate the visibility, focus and
  stale-answer handling the bell's provider already has.

## Links

- Design 0022 D9, D19, §4.3 and §4.4 (amended)
- ADR 0080, ADR 0082 (what Received holds), ADR 0090 (Shared with me holds no Kudos)
- Brain `ADR-0055` (the product decision this builds)
