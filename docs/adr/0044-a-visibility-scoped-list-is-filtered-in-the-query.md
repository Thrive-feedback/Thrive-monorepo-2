# 0044 — A Visibility-scoped list is filtered in the query; the value object stays the authority for one piece

Status:   accepted
Date:     2026-10-17
Deciders: naroebordin

## Context

ADR 0042 put one rule in one place: `Visibility.letsRead` decides who may read a piece of Feedback,
applied in `GetFeedbackUseCase` where **one piece** is opened. That works because the row is already
loaded and the answer is yes or no.

#88 (*Shared with me*) and #90 (the Workspace feed) ask the same question of a **list**. A list is
paginated and carries `total`, and both break if the rule is applied after the rows are fetched:

- `take 20` followed by a filter returns fewer than twenty rows and looks like the end of the list;
- `total` would count rows the caller may not read, so the paging would promise pages that are empty.

Applying the rule in the application layer would therefore mean reading a Workspace's whole Feedback
history on every request and paging it in memory.

## Decision

**A list of Feedback is scoped by its audience in the query, as a named read. `Visibility.letsRead`
remains the only authority where one piece is opened.**

- The query port declares one method per audience — `sharedWith(workspaceId, readerAccountId, page)`
  and `publicIn(workspaceId, page)` — and each applies its own predicate in the `WHERE`:
  `visibility = 'SELECTED_PEOPLE'` with a join on the reader for the first,
  `visibility = 'EVERYONE'` for the second.
- A use case listing Feedback **does not construct a `Visibility`**. It cannot widen or narrow what
  the query returned, because it is never handed the Visibility to re-check.
- The reader is an argument to the read, never a filter the caller may omit, so a list of what
  somebody else was shown cannot be written by accident (`BE_21` R4).
- The rule is expressed twice — once in SQL, once in the value object — and a unit test holds the
  two readings to the same answers: `visibility-agrees-with-the-shared-read.spec.ts` asserts a table
  of (visibility, selected people, reader, Giver, Receiver) against both.

## Consequences

- Each new audience is a new named method and a new scenario, not a parameter on an existing read.
  `BE_07` R6 is satisfied: no undeclared filter reaches the query.
- Both reads need an index for their access path, because the predicate is now in the database:
  `feedback_request_selected_person(accountId)` for #88, `feedback(workspaceId, visibility, createdAt)`
  for #90.
- The duplication is real and is the cost paid here. The agreement spec fails on the day the value
  object and a query disagree, which is the earliest a test can catch it.
- A future audience that cannot be expressed as a `WHERE` — one that depends on a Role, say — would
  have to revisit this decision rather than extend it.

## Alternatives rejected

- **Read the Workspace's Feedback and filter with `Visibility.letsRead` in the use case.** Rejected:
  short pages, a wrong `total`, and a read whose cost grows with the Workspace's whole history
  regardless of how little the caller may see.
- **Hand the list read a `Visibility` and let the use case page it.** Rejected: it keeps the
  duplication *and* the in-memory paging, and it gives the use case a field it must be trusted not
  to act on.
- **One `feedback` route with an `audience` parameter.** Rejected in `docs/design/0018` D1: the
  response shape differs per audience, and `…/feedback` already means "written to the caller".
