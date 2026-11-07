# 0083 — The old Home's read endpoints are retired with it

Status:   proposed
Date:     2026-11-07
Deciders: kritpavin

## Context

Home is now the page that was built beside it: one list under a filter (`GET …/feed-items`, ADR
0071), Received (`GET …/received-items`, ADRs 0080 and 0082), Given (`GET …/given-items`, ADR 0081),
Waiting for me (`GET …/waiting-asks`) and the Kudos board (`GET …/kudos`). The old `/home`, with its
tabs and dialogs, and the `/home-2` prototype are deleted from the web app.

Five read routes had the old Home as their only client, and nothing calls them now:

| Route | What it read | What reads it now |
| --- | --- | --- |
| `GET …/feed` | Feedback shared with everyone, offset-paged | `GET …/feed-items?show=EVERYONE` |
| `GET …/shared-feedback` | Feedback someone selected the reader for, offset-paged | `GET …/feed-items?show=SHARED_WITH_ME` |
| `GET …/feedback` | Feedback written to the reader, offset-paged | `GET …/received-items` |
| `GET …/feedback-requests` | The requests the reader sent, offset-paged | `GET …/received-items?show=REQUESTS` |
| `GET …/feedback-requests/{requestId}` | One request and its Asks, for the Requester or someone asked | nothing: a request has no page of its own |

ADR 0082 left `GET …/feedback-requests` "untouched, to go when `/home` does". This record is that.

## Decision

**The five routes are removed**, together with their use cases, their query methods
(`publicIn`, `sharedWith`, `receivedBy`, `sentInWorkspace`, `requestInWorkspace` and
`answersInRequest` on the Feedback Request query), their DTOs, and the specs that tested only them.
`POST …/feedback`, `GET …/feedback/{feedbackId}`, `POST …/feedback-requests` and the Ask routes
stay, because the new pages write and read through them.

**`GET …/feedback-asks` stays.** The sidebar's count of what is waiting reads it, so it is not the
old Home's alone.

**The `@api` scenarios keep their rules and change where they read.**
- Whatever was read from the Workspace feed is read from Home showing Everyone in the Workspace.
- What was read from Feedback shared with me is read from Home showing Shared with me.
- What a Member read of the Feedback written to them, or of the requests they sent, is read from
  Received.

Only what described a removed list's own shape goes: its offset `page` and `total`.

**Opening one request is no longer possible.** The rule that someone neither asking nor asked
cannot open a request, tested through `GET …/feedback-requests/{requestId}`, has no route left to
apply to. Its scenarios are deleted. A request's Asks and answers still reach only the Requester,
through Received, which reads by the caller's own account (ADR 0080).

## Consequences

- **The contract loses five operations.** `GEN_08` R7 calls that breaking. The web app was their
  only client, it no longer calls them, and there are no users, so the API and the web ship in one
  deploy.
- **The chat link for an answered request names no request.** It opens Received narrowed to My
  requests, because nothing opens one request on its own.
- **A page that opens one request, if one is wanted later, needs a route again.** It would be
  written for that page, rather than kept alive without a caller now.
- **Less to keep in step.** These were the last offset-paged Feedback lists (ADR 0059 moved
  everything else to a cursor). Every change to who may read what had to be repeated in each of
  them.

## Alternatives rejected

- **Keep the routes until something needs them.** No client calls them, and each one restates a
  Visibility rule another route already applies. A route with no caller still has to be kept
  correct whenever that rule changes. `GEN_16` R8 deletes what was replaced in the same change.
- **Keep `GET …/feedback-requests/{requestId}` for a future request page.** No page is planned. A
  route kept for one would be designed before the page that decides what it needs.
- **Delete the scenarios with the routes.** Several rules, such as who sees Feedback shared with
  everyone, a Deactivated person's status, and what a mention lets somebody read, are asserted only
  there. Reading them through the new routes keeps them.
