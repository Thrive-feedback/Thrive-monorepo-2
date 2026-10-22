# 0054 — A piece of Feedback stores only its own message

Status:   accepted
Date:     2026-10-22
Deciders: kritpavin

## Context

Brain `ADR-0039` retires the Topic. A Feedback Request now has a **Request message**, and every
piece of Feedback, Requested or Offered, has a **Feedback message**. Nothing else is written.

The code held a Topic in two places:

- `feedback_request.topic`, which the Requester wrote.
- `feedback.topic`, which held the Giver's own Topic on Offered Feedback and a copy of the request's
  Topic on an answer. The copy existed so that a card could lead with the Topic without reading the
  request.

Every Feedback read returned `topicTags` next to `tags` (ADR 0053). For an answer, `topicTags` came
from the request through a join.

Thrive is pre-launch, with no deployment and no users (`PROJECT.md`), so no stored row and no
running client has to be kept.

## Decision

**A piece of Feedback stores and returns only its own Feedback message. The Request message
stays on the request.**

- `feedback_request.topic` is renamed `message`, and `feedback.body` is renamed `message`. The
  rename is its own migration, and rows keep their text.
- `feedback.topic` is dropped in a separate migration (`BE_15` R10).
- Feedback reads (received, shared with me, the Workspace feed, one piece) return `message` and
  `tags`, with no `topic` and no `topicTags`. The join from a piece of Feedback to its request's
  tags is gone.
- Request reads (sent requests, one request, Asks) return `message` and `tags`, which replace
  `topic` and `topicTags`. An answer inside a request returns `message`, which replaces `body`.
- Write bodies follow the same names. Offering Feedback takes `message` only, sending a request
  takes `message`, and answering takes `message`. The codes `TOPIC_EMPTY` and `TOPIC_TOO_LONG`
  become `REQUEST_MESSAGE_EMPTY` and `REQUEST_MESSAGE_TOO_LONG`. `FEEDBACK_BODY_EMPTY` and
  `FEEDBACK_BODY_TOO_LONG` become `FEEDBACK_MESSAGE_EMPTY` and `FEEDBACK_MESSAGE_TOO_LONG`.

This supersedes the read shape in ADR 0053's second Decision bullet. Its binding rows and tag rules
stand: Offered Feedback now binds what its Feedback message names, a request binds its Request
message, and an answer binds only its own.

## Alternatives

- **Keep `feedback.topic` nullable, null for Offered.** Smallest read change, since an answer could
  still show the request's text without a join. The product decided cards show the Feedback message
  alone (brain `ADR-0039`). Nothing would read the column, and keeping it would mean holding a
  copy whose only reader is gone.
- **Return the Request message on Requested Feedback through the ask→request join.** Possible
  without storing a copy, but no screen shows it. It can be added back as an additive field if the
  brain's reversal condition is ever met.
- **Expand, migrate, contract over three deploys (`BE_15` R5, `GEN_08` R7–R8).** That is the right
  path once something is deployed. With no deployment and no running reader there is nothing to
  keep compatible, so the contract and its only consumer change in one pull request. The
  destructive drop is still a migration of its own.

## Consequences

- The `feedback` row is narrower, and a Feedback read no longer joins to the request.
- The contract break is deliberate. Every renamed field and error code changes in the same pull
  request as the web app that reads it. After launch, a rename like this one has to go through
  `GEN_08` R7–R8.
- Offered Feedback written before this loses its Topic. Requested Feedback loses only its copy,
  because the original stays on the request as its message.
- A card for Requested Feedback no longer says what was asked. A Receiver who wants that context
  opens the request.

## Links

- Brain `ADR-0039` (no Topic: a Request message and a Feedback message)
- ADR 0053 (binding rows, whose read shape this supersedes)
- `BE_15` R5, R10, `GEN_08` R7–R8
