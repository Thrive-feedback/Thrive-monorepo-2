# 0094 — Each answer is a line of its own

Status:   accepted
Date:     2026-11-15
Deciders: kritpavin

## Context

Design 0022 D4 gave every kind of bell line one kind of subject. For `ASK_ANSWERED`, "answered your
request", that subject was the Feedback Request. Each line is unique on `(recipient, type, subject)`,
and a repeated write is dropped. Together those meant the Requester could have one line per request
and no more:

- The second answer to a request added no line. ADR 0091 counts My requests per answer, so the count
  showed 2 while the bell showed 1.
- Once the first line was read, the bell never mentioned later answers at all.
- Chat messages are keyed by the answer, so Discord told the Requester of every answer while the bell
  told them of the first.

## Decision

**The subject of an `ASK_ANSWERED` line is the answer (the Feedback), not the request.** Each answer
is a line of its own. Its sentence is unchanged ("Ben answered your request"), and it still opens
Received showing My requests, because a request has no address of its own.

- **The event carries the answer.** `notifications.ask_answered` now includes `feedbackId`, and the
  line is written with that id as its subject.
- **Older messages are still delivered.** A message an earlier release enqueued has no `feedbackId`.
  It is read with the request's id instead, so it is told exactly as it would have been then, rather
  than refused and lost.
- **No data is migrated.** Lines written before this change keep the request's id as their subject.
  The web does not read the subject for this kind, so those lines draw and open as before. A new
  answer to such a request gets a line of its own.

This changes the `ASK_ANSWERED` row of design 0022 D4 and nothing else in it.

## Consequences

- For the Requester, the bell, the My requests count and chat now agree on how many answers arrived.
- A request asking ten people can add up to ten lines. That is the same as ten pieces of Feedback
  written to the person, and opening My requests reads all of them (ADR 0092).
- An `ASK_ANSWERED` row's subject is an answer for new rows and a request for old ones. Nothing reads
  it today; anything that starts to has to allow for both.
- **The fallback for older messages comes out** once no `notifications.ask_answered` message
  enqueued before this change is left in the outbox, delivered or dead. The relay drains in seconds,
  so one release after this one is enough. That release still sends `feedbackRequestId`, which this
  release's parser requires: rolling back to this one would otherwise lose every line enqueued in
  between. The field is dropped from the event one release later still.

## Alternatives rejected

- **One line per request that comes back unread on each answer**, renamed for the latest answerer.
  That needs an update-or-insert in place of a write that is safe to repeat. It also hides who else
  answered, and the line still disagrees with a count that counts answers.

## Links

- Design 0022 D4, D7 and D8 (amended for this kind); ADR 0091, ADR 0092
- Brain `ADR-0055` (the product decision this builds)
