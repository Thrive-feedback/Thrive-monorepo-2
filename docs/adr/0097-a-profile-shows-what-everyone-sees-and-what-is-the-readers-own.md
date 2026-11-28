# 0097 — A Profile shows what everyone sees, and what is the reader's own

Status:   proposed — supersedes 0091 once accepted
Date:     2026-11-28
Deciders: kritpavin

## Context

ADR 0091 lets anyone in a Workspace open anyone's Profile. A Profile holds what was written to the
person that the reader may read from outside it: Feedback that Everyone reads, Feedback that
somebody selected the reader to read, and the Kudos that name the person.

Once the product owner had used it with real data, a gap showed. On a teammate's Profile the reader
cannot find what passed between the two of them. This covers Feedback the reader wrote to the
teammate kept to Only them, the teammate's answer to the reader's own request, and an Ask either of
them is still waiting on. All of it is the reader's own, so they already read it in Given, Received
and Waiting for me. It just never shows on the person it is about.

The 1:1 also needs this. Before a meeting, each of the two should see what passed between them
since the last one. On 28 November the product owner decided that the 1:1's "Before you meet" panel
and the Profile show the **same items in the same lists**. They differ in only three ways: the 1:1
reads from its last meeting on, it fetches in pages rather than scrolling, and its cards are
compact.

ADR 0091 rejected "everything the reader may read, their own included". Private Feedback would sit
among public Feedback on a page that reads as public, and it could only be told apart card by card.
That reason still holds for the lists everyone sees. It does not rule out lists of the reader's own,
kept apart and named as such.

## Decision

**Everything ADR 0091 decides stands.** That covers the two routes, who may read a Profile, the
`FEEDBACK`, `SHARED_WITH_ME` and `KUDOS` lists, Kudos only by name, Deactivated people, and
`404 PROFILE_NOT_FOUND`. This record adds two lists, a lower bound in time, and a count. It also
splits the lists into two parts.

**A Profile's lists come in two parts.**

- **What everyone sees** is the same for every reader. `FEEDBACK` is Feedback to the person that
  Everyone reads. `KUDOS` is Kudos that name the person. The person's own Profile shows only this
  part, as a mirror of what others see.
- **What is the reader's own** differs for every reader. It is never offered on one's own Profile,
  and the API answers it empty there.
  - `BETWEEN_US` holds what passed between the reader and the person, at every Visibility. That
    means Feedback either wrote the other, Feedback somebody else wrote to both, Kudos either gave
    the other, and Kudos somebody else gave naming both. These are read through
    `FeedbackRequestQuery.feedbackBetween` and `KudosQuery.kudosBetween`. When the reader wrote an
    answer, the other answers on that request's card keep only what the reader may read, by the
    rule Given applies (`withAnswersReadableBy`, ADR 0072).
  - `SHARED_WITH_ME` is unchanged.
  - `OPEN_ASKS` holds the Asks still pending between the two, whichever of them asked. It is a new
    item kind, `ASK`, placed at when it was asked, which never moves. Once an Ask is answered it
    leaves this list and its answer is Feedback in `BETWEEN_US`. It is read through
    `FeedbackRequestQuery.pendingAsksBetween`. A cursor naming one is found again through
    `askPositionOf`, since an answered Ask is kept.

The same item can sit in two lists. For example, Feedback the reader wrote to the person at
Everyone is in `FEEDBACK` and in `BETWEEN_US`. No list holds everything.

**`since` narrows a list to what was written at or after an instant.** It is optional, it only
narrows, and it keeps the same cursor. It applies to `FEEDBACK`, `KUDOS`, `BETWEEN_US` and
`SHARED_WITH_ME`. `OPEN_ASKS` holds every Ask still open however long ago it was asked, so a `since`
with it answers `REQUEST_INVALID` rather than being ignored.

**`GET …/members/{accountId}/profile-item-counts?since=` counts each list for the caller.** It
returns `feedback`, `kudos`, `betweenUs`, `sharedWithMe` and `openAsks`, with `openAsks` counting
every open Ask. Each count reads with its list's own filter, so a number and its list cannot
disagree (ADR 0095). A Profile shows no counts; the 1:1 does.

The reader comes from the session (ADR 0091). Every item in the reader's own lists has the reader as
its Giver, a Receiver, its Requester or the Member it asked. So these lists hold nothing the reader
cannot already read, and they need no rule beyond Workspace membership.

## Consequences

- One Profile reads differently to different people, but only in the part named as the reader's
  own. The part everyone sees stays the same for everyone.
- A teammate's Profile now shows Feedback kept to Only them, but only to the two people it is
  between, and only in a list whose name says so.
- Profile items gain the `ASK` kind. The contract grows by two show values, `since`, and one route,
  so this is not breaking under `GEN_08` R7.
- The 1:1 can read the same lists from its last meeting on, and their counts, through these routes.
  Whether a reader may add one item to an agenda is the 1:1's own check, built on these reads.
- The reads join only Feedback's own tables and need no migration.
- **Feedback between the two is read in two steps, so a page costs what the two people wrote and
  received, not what the Workspace holds.** The first step reads which Feedback has both of them
  among its Receivers. The second reads the page with that list as an id filter. Feedback written
  to both of them by somebody else has no Giver to look up by. Asked in one step, it made Postgres
  read every Feedback in the Workspace and filter it. Measured on 100 Workspaces of 50 people over
  two years (3.4M Feedback, 34k per Workspace), one page cost 14 ms in one step. In two steps it
  cost 3 ms + 6 ms, and the plan became index scans on the Giver index and the primary key.
- **Kudos between the two are read in one step, the other way round.** Kudos have no index on their
  Giver, and a Workspace holds far fewer of them (10k over two years in the same measurement, 1M in
  all). Walking them newest first on `[workspaceId, createdAt, id]` and stopping once a page is full
  cost 5.5 ms in SQL, and 13.5 ms for a page with its cards. First fetching every Kudos either
  person was given cost 38 ms. That holds while a Workspace's Kudos stay in the tens of thousands.
  Past that, an index on the Recipients covering `(accountId, kudosId)` would make the two-step read
  the cheaper one.
- An open Ask between the two cost 0.7 ms. Counting every list from a month ago cost 12 ms, run side
  by side. Counting all of time cost about 60 ms, because a count cannot stop at a page. The 1:1
  always passes `since`, so it pays the first.

## Alternatives rejected

- **Mix the reader's own items into `FEEDBACK` or `SHARED_WITH_ME`.** ADR 0091's reason still
  applies: private Feedback would read as public.
- **Only what the two wrote to each other.** The product owner wanted what somebody else wrote to
  both of them here too, since the reader is its Receiver. Its card names everyone it was for, so it
  never reads as something the two wrote to each other.
- **Keep the open Asks inside `BETWEEN_US`.** A 1:1 counts and pages them on their own, and they
  are not written yet, so they are a list of their own.
- **Show a pending request as the whole request card, as Received does.** That card sits at its
  latest answer, so it moves, and ADR 0082 had to make Received's cursor carry a position because of
  it. One Ask between the two never moves and says only what concerns them.
- **Ignore `since` on `OPEN_ASKS`.** A caller who passed one would believe the list was narrowed.

## Links

- ADR 0059, ADR 0072, ADR 0081, ADR 0082, ADR 0091, ADR 0095
