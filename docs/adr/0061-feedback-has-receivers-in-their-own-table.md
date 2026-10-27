# 0061 — A piece of Feedback has its Receivers in a table of their own

Status:   accepted
Date:     2026-10-27
Deciders: kritpavin

## Context

The brain's `ADR-0044` (accepted, 2026-10-27) decides that Offered Feedback can be given to several
Members at once, as **one** piece of Feedback they all receive: one card, one set of Reactions, each
Receiver seeing the others, "Only them" meaning the Giver and every Receiver. Requested Feedback
keeps exactly one Receiver, the Requester.

Until now one Receiver was a column, `feedback.receiverAccountId`, read by every list, by the rule
deciding who may open a piece (`Visibility.letsRead`), and by the Notifications sent when Feedback
is written. The contract carried it as `receiverAccountId` on the way in and `receiver` on the way
out.

## Decision

**Every piece of Feedback has its Receivers in `feedback_receiver`** — `(feedbackId, accountId,
position)`, keyed by the pair, indexed by `accountId`, cascading with the Feedback (migration
`add_feedback_receiver`). `position` keeps the Giver's order, so every read names them the same
way. The domain holds `receiverAccountIds` on `Feedback`: `Feedback.offer` refuses none
(`NO_RECEIVERS`), one named twice (`RECEIVER_ALREADY_NAMED`), the Giver among them, and anybody
selected who is one of them; `Feedback.answering` still takes the one Requester.

Both ways Feedback is written go through one mapper, `toFeedbackCreateData`, so neither can store a
piece without its Receivers. Building this proved the risk was real: the answer path missed them
first, and an integration test caught it.

**This is the expand-and-migrate half of `BE_15` R5.** The migration copies every existing Receiver
into the table, at position 0, in the same transaction. `feedback.receiverAccountId` stays and is
still written with the first Receiver, so an API running the old code during a deploy reads what
it always did. Nothing new reads it.

**The contract only adds** (`GEN_08` R7):

- `POST /feedback` takes `receiverAccountIds` (1–50, the order kept). The old `receiverAccountId` is
  still accepted, so a page loaded before a deploy still sends; a body must use exactly one of the
  two.
- The feed, *Shared with me* and the route that opens one piece add `receivers`; `receiver` stays,
  as the first of them.
- *Feedback for me* adds `otherReceivers`: everyone it was for but the reader.

`FeedbackWritten` carries `receiverAccountIds`; every Receiver is told it was written to them.

## Consequences

- One send for three people is one row and one card, and the reads that start from the Giver or the
  Workspace are unchanged. "The Feedback I received" now starts from `feedback_receiver(accountId)`
  rather than the old `(workspaceId, receiverAccountId, createdAt)` index; at the size of the
  Workspaces Thrive serves today that join is cheap, and it is the read to watch if one grows.
- **Owed, in its own change** (`BE_15` R10, `GEN_08` R7): drop `feedback.receiverAccountId` and its
  index, and remove `receiverAccountId` from the request and `receiver` from the responses — once
  no web page in use still sends or reads them.
- Rollback: `DROP TABLE "feedback_receiver"`. The column still holds every Receiver of one-Receiver
  Feedback; Feedback given to several since would keep only its first.

## Alternatives rejected

- **One row per Receiver, made in one send.** Every read stays as it was, but the feed shows the same
  words several times, Reactions split across copies, and no Receiver learns who else it was for —
  the option the brain's `ADR-0044` rejected.
- **An array column of Receivers on `feedback`.** One fewer table, but "the Feedback written to me"
  could not be indexed the way it is read, and Kudos already set the shape (`kudos_recipient`,
  ADR 0060).
- **Replacing `receiverAccountId` and `receiver` in one change.** Simpler to read, but a breaking
  change to a contract the deployed web reads, and a column drop no running reader could survive.

## Links

- Brain `ADR-0044`, `ADR-0022`; ADR 0060; `BE_15` R5, R8, R10; `GEN_08` R7, R8
