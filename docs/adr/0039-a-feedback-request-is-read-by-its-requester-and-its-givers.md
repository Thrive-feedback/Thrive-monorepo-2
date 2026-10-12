# 0039 — A Feedback Request is read by its Requester and its Givers, and nobody else

Status:   accepted
Date:     2026-10-12
Deciders: naroebordin

## Context

`GET /v1/workspaces/{workspaceId}/feedback-requests/{requestId}` shipped with #21 (PR #151). It
ran behind Feedback's `WorkspaceMemberGuard`, which proves the caller is a Member of the Workspace
in the path (ADR 0037, `BE_21` R3), and then read the request by id. It checked nothing else.

That is one check short. Being a Member of a Workspace is not being a party to a request inside it.
Every Feedback Request stored today carries `visibility = ONLY_ME` — the narrowest audience, taken
deliberately while #83 has not yet let the Requester choose (`docs/design/0015-request-feedback.md`
D6, `ADR-0022`). So the route answered a question `ONLY_ME` says it must not: *what did this
colleague ask, and whom did they ask?* The reply names the Topic and every Member asked.

The id is a UUIDv7 and is not enumerable, and one is handed to the browser on every send. "Hard to
guess" is not the control `ONLY_ME` promises, and a Workspace of 20–50 people stops being a room of
colleagues the moment it holds a contractor, a departing employee or a founder's investor.

Reading was also about to get wider, not narrower: #16 lists a Requester's own requests, #18 lists
a Giver's Asks, and #24 lets a Giver answer — which they cannot do without first reading the Topic
they were asked about.

## Decision

**A Feedback Request may be read by the Requester who sent it and by any Member it holds an Ask
for. Every other caller is answered `404 FEEDBACK_REQUEST_NOT_FOUND`, the same answer as for a
request that does not exist.**

- `GetFeedbackRequestUseCase` takes `callerAccountId` from the session — never from the path, the
  query or the body — and refuses before it names anybody.
- The refusal reuses the existing not-found code rather than `403`: a caller who is not a party
  learns nothing, not even that the id is real. The same reasoning already governs
  `WORKSPACE_NOT_FOUND` for a non-Member (ADR 0037).
- A Giver is a party because `#24` requires it: an Ask cannot be answered by somebody who may not
  read what it is about. A Giver sees the Topic and who else was asked, which is what the answer
  screen shows them; what each Giver *wrote* is a separate question, decided in #24's design.
- The collection reads added beside it are scoped inside the query, not filtered after it:
  `sentInWorkspace(workspaceId, requesterAccountId, …)` and `asksFor(workspaceId, giverAccountId,
  …)` take the person as an argument, so a version that lists somebody else's rows cannot be
  written by accident. Authorization stays in the application layer; Postgres RLS is not used
  (`BE_21`, `PROJECT.md` §5).

## Consequences

- One Member can no longer read another's request by id. Nothing in the product relied on it; the
  web app only ever reads a request the caller just sent or was asked for.
- `FeedbackRequestRow` carries `requesterAccountId`. The read already selected the row; naming the
  Requester costs nothing.
- When #83 and #84 give the Requester a real choice of audience, this rule becomes its floor: the
  parties always read it, and `visibility` widens the set from there. It is not replaced.
- The check is the use case's, not the guard's. A guard would have to load the request to know who
  the parties are, which is the read itself.

## Alternatives rejected

- **Leave it to #84**, when Visibility is honoured properly. Rejected: #16 puts request ids in
  front of people in quantity, and the gap contradicts a default the product already chose.
- **Answer `403`** to a Member who is not a party. Rejected: it confirms the id exists. `BE_09`
  wants a stable code, not a truthful taxonomy of refusals.
- **Check in the guard, over a new published port.** Rejected: the guard would read the request to
  decide, then the use case would read it again. One read, one decision.
