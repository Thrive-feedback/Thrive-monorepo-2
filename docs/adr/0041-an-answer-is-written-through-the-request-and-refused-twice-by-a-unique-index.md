# 0041 — An answer is written through the Feedback Request, and a second one is refused by a unique index

Status:   accepted
Date:     2026-10-12
Deciders: naroebordin

## Context

#24 is the first write Feedback has that changes something already stored: the Giver answers an
Ask, which stores their Feedback and leaves the Ask Answered. Two things had to be decided.

**Where the answer lives.** The glossary has **Feedback** as a thing with a Giver, a Receiver and
an origin — not a column on an Ask — and #25–#29 list Feedback with no request in sight. But today
every piece of Feedback answers exactly one Ask, and "this Ask is answered once" is a rule about
the request that holds it, not about one Ask on its own.

**What stops a second answer.** The obvious shape is a check: load the Ask, see that it is
Pending, write. That is a check-then-act on shared state, and a Giver pressing Send twice races it.
Nothing in the application layer can see the other request.

`BE_14` is still `todo`, so ADR 0031 is the interim: one `UnitOfWork.run()` per use case,
optionally serialized on a key by a Postgres advisory lock.

## Decision

**`FeedbackRequest` stays the consistency boundary: it answers its own Ask and hands back the
Feedback, and one repository writes both in one transaction. A second answer is refused by a unique
index on `feedback.feedbackAskId`, not by the check that precedes it.**

- `FeedbackRequest.answerAsk({ askId, giverAccountId, feedbackId, body })` flips the Ask to
  `ANSWERED` and returns a `Feedback` whose `receiverAccountId` is the request's own Requester —
  so nothing a client sends can address Feedback to somebody who did not ask for it.
- It returns **`null`** when the request holds no such Ask for that Giver. Deciding what a caller
  is told about an Ask that is not theirs is the use case's job, not the aggregate's; the use case
  answers `FEEDBACK_ASK_NOT_FOUND`, as every scoped read in this module does.
- `Feedback` is stored in its own table and loaded as its own entity, but has **no repository**:
  it is written through `FeedbackRequestRepository.saveAnswer(request, feedback)`. The aggregate
  load stays cheap — it reads Asks, never answer bodies.
- The repository raises `AskAlreadyAnsweredError` from **either** defence: `updateMany` guarded on
  `status: 'PENDING'` returning zero rows, or the unique index refusing the second insert. Both are
  the same rule, so both carry the same code and the same `409`.
- `AskAlreadyAnsweredError` is a **domain** error, not an application one. "An Ask collects one
  answer" is a business rule, and the aggregate raises it when it can see the Ask is not Pending;
  the repository raises the same class when only the store could see it.
- **No `serializeOn` key.** An advisory lock would serialize every answer in the Workspace to
  protect against one Giver pressing Send twice. The unique index is exact, costs nothing when
  nobody is racing, and is the only defence that holds if the application is ever wrong.

## Consequences

- Two writes, one transaction: an Ask marked Answered with no Feedback beside it cannot exist.
- The loser of a race is told `409 ASK_ALREADY_ANSWERED` and nothing is written. Proved in
  `prisma-feedback-request.repository.integration.spec.ts`, which answers the same Ask from two
  independently loaded aggregates and asserts one success, one refusal, and exactly one stored row.
- **This is temporary in one direction.** #29 brings Feedback given without being asked — no Ask,
  no request — and `Feedback` becomes an aggregate root with its own repository then. The migration
  that does it makes `feedbackAskId` nullable and adds the `FeedbackOrigin` the glossary already
  names. Planned, not a surprise.
- `visibility` is not copied onto the answer. The glossary gives Visibility to the Requester, per
  request, "never changed afterwards"; #84 reads it from the request.

## Alternatives rejected

- **`FeedbackAsk.answerBody` as a column on the Ask.** Cheapest today and wrong by #26: a list of
  the Feedback somebody received would have to read every request ever sent to find it.
- **`Feedback` as its own aggregate root now**, with its own repository and two units of work.
  Rejected: the status flip and the answer must be atomic, and two roots in one transaction is a
  shape `BE_04` R8 exists to prevent. It becomes the right shape at #29, not before.
- **An advisory lock on the Ask id** (`UnitOfWork`'s `serializeOn`). Rejected above: a lock to
  catch a double-click, where an index already states the rule exactly.
- **Idempotency key on the POST** (`BE_07` R8). Rejected: a repeat is not a retry. "I already
  answered this" is the honest answer, and a `409` says it.
