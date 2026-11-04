# 0082 — Received holds the Member's own requests, filtered on the server, under a position cursor

Status:   proposed
Date:     2026-11-04
Deciders: kritpavin

## Context

Brain `ADR-0053` moves a Member's Feedback Requests into Received and removes *My requests* from the
new Home's sidebar. Received shows one card per request: the Request message, every Ask and where it
stands, each answer with the postcard its Giver sent back. Received gets four filters: All, My
requests, Given to me (Offered Feedback) and Kudos. An answer appears only inside its request. A
request card sits at its latest activity, its newest answer or else when it was sent, so a new answer
brings it to the top.

ADR 0080 made `GET /v1/workspaces/{workspaceId}/received-items` one read over Feedback and Kudos,
under ADR 0077's cursor, which is the id of the last row sent, looked up again to find its place.
That works only because a row's place never changes. A request's place changes whenever it is
answered. If the last row of a page is a request answered since, looking it up gives its new place
at the top, and the next page then repeats everything already read.

## Decision

**This amends ADR 0080.** Received reads three kinds of item, can be narrowed to one of them, and
pages by a cursor that carries a place rather than an id.

- **A third item kind, `REQUEST`.** It carries the request (id, Request message, tags, Visibility,
  its Requester, the selected people, its postcard, when it was sent, and `latestActivityAt`) and
  every Ask: the person, the status, and for an Answered Ask its Feedback id, message, tags, the
  answer's postcard and when it was answered. The Requester reads every answer to what they asked,
  so no answer is withheld. An Ask is only Pending or Answered (brain `ADR-0049`).
- **`FEEDBACK` items in Received are Offered Feedback only.** Requested Feedback has one Receiver,
  the Requester, so every Requested item in Received was an answer to one of their requests. It is
  now inside that request, and is never listed twice.
- **The requests are read by `requesterAccountId` equal to the caller.** As in ADR 0080, whose list
  it is comes from the session and is an argument to every read, never a filter applied afterwards.
- **A request's place is computed when it is read**, as the newest of its answers' `createdAt`, or
  its own `createdAt` while it has none, with `id` breaking ties. One SQL read finds a page of places
  and a second reads those requests, so a page costs the same however many answers it holds. No
  column is stored, so nothing has to be kept in step when an answer is written.
- **`show` narrows the list on the server**: `ALL` (the default), `REQUESTS`, `OFFERED` or `KUDOS`.
  Each choice reads only its own tables, so every filter pages as a list of its own. Filtering pages
  in the browser would give empty and half-empty pages.
- **Received's cursor is a place, not an id.** It stays opaque to the client: the base64url of the
  last item's time and id, as they were when that page was read (`positionCursorQueryShape`). Each
  table is read past that place with the `(createdAt, id)` `where` ADR 0077 introduced; for requests
  it is the computed place. A cursor that is not a place, an id cursor among them, is refused as
  `REQUEST_INVALID`. With the place carried, the two lookups ADR 0077 needed to find it are gone.
- **The web list keeps one copy of each id** when it adds a page, as a second guard.

Given (ADR 0081) shares the merge and keeps ADR 0077's id cursor and its response exactly as they
were. The service that both lists use now takes a place; Given looks its cursor's id up to find one,
as before.

## Consequences

- **A request answered while someone scrolls is not repeated, and nothing older is skipped**, but
  if it moves above what was already read it is not shown until the list is read from the top again.
  Brain `ADR-0053` accepts exactly this.
- **Received now has a second cursor encoding**, which ADR 0059 rejected for every list. It is
  confined to the one list whose rows move. Any other list whose rows can move should use it too,
  rather than add a third.
- **The response shape changes, which `GEN_08` R7 calls breaking.** A web reading `items` finds a
  kind it did not know, and Requested Feedback stops arriving as `FEEDBACK`. The web is the route's
  only client and there are no users, so the API and the web ship in one deploy, API first, as in
  ADR 0077. A browser tab holding an old cursor gets `REQUEST_INVALID` once and starts the list again.
- **The read of places is raw SQL**, which Prisma does not type. Its integration spec covers the
  order, the place after an answer, and reading past a place that has since moved.
- A request with many Asks makes a long card. That is the card brain `ADR-0053` chose.
- Old `/home`'s *My requests* tab and `GET …/feedback-requests` are untouched, and go when `/home`
  does.

## Alternatives rejected

- **Keep the id cursor and look the row up.** It repeats rows whenever the last row of a page is a
  request answered since, the case this record exists for.
- **Store `lastActivityAt` on `feedback_request`.** It would save the aggregate, but the answer's
  write path would have to keep it in step, and the place still moves, so the cursor would still
  have to carry it.
- **Place a request at when it was sent.** It would never move, but a request answered today would
  sit where it was sent weeks ago, which brain `ADR-0053` decided against.
- **Filter in the browser.** One read would serve every filter, but a page of twenty could hold no
  Kudos, and the list would look ended while more remained.
- **A separate `requests` route merged on the web.** Two cursors for one screen, the problem
  ADR 0071 was written to remove.

## Links

- Brain `ADR-0053`, `ADR-0050` decision 2, `ADR-0049`; design `FB-4-S4`
- ADR 0059, ADR 0071, ADR 0077, ADR 0080 (amended), ADR 0081; `GEN_08` R7, `BE_07` R5–R6

Supersedes: — (amends 0080)
Referenced by: `list-received-items.use-case.ts`, `personal-items.service.ts`,
`prisma-feedback-request.query.ts` (`sentRequestItemsBy`), `page.dto.ts`
(`positionCursorQueryShape`), `features/received-items.feature`
