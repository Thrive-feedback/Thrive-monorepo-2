# 0093 — An answer shared with selected people tells them

Status:   accepted
Date:     2026-11-15
Deciders: kritpavin

## Context

A Requester can share what a request collects with Selected people. Each answer then appears under
Shared with me for those people, and ADR 0091 counts it there. Until now, answering a request only
told the Requester (`ASK_ANSWERED`). The selected people were never told, so their Shared with me
count read higher than the bell's lines about the same thing. Offered Feedback shared with Selected
people already told them, as `FEEDBACK_SHARED`.

## Decision

**When an answer is written to a request shared with Selected people, those people are told, the
same way they would be about Offered Feedback shared with them.**

Answering enqueues `notifications.feedback_written` alongside `notifications.ask_answered`. The
event carries no Receivers, and its `sharedWithAccountIds` are the answer's selected people. Its
idempotency key is the answer's id.

- **The Requester is told once.** They get "answered your request", and they cannot be a selected
  person anyway.
- **The Giver is never told about their own answer.** The existing recipient rules already drop the
  actor.
- **Every channel follows.** Because this reuses the existing event, the bell line reads "shared
  feedback with you", a chat message goes to anyone who has linked a chat tool, and opening Shared
  with me reads the line (ADR 0092).
- **Only new answers.** Answers written before this change are not told about after the fact.

## Consequences

- For the selected people, the bell and the Shared with me count now agree, with one exception. A
  Requester may select somebody they also asked: only the Requester themselves is refused as a
  selected person. Such a Giver counts their own answer under Shared with me, because the list
  holds it, but is never told of it, because nobody is told of their own action. This is left as
  it is; the list and the count agree, and only the bell is silent.
- A request shared with several people produces one line per person per answer. For the selected
  people this is the same volume as Offered Feedback shared with them.

## Alternatives rejected

- **Add the selected people to `ask_answered`.** That event is worded as "answered *your* request",
  which is not true for them, and every consumer of it would need a second wording.

## Links

- ADR 0091, ADR 0092
- Brain `ADR-0055` (the product decision this builds)
