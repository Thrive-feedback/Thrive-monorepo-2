# 0042 — Visibility is enforced where one piece of Feedback is opened, not on the request

Status:   accepted
Date:     2026-10-15
Deciders: kritpavin

## Context

#84 makes the Requester's choice real: a Feedback Request is sent as **Only me**, **Selected
people** or **Everyone in the Workspace**, fixed once sent, and that choice decides who besides the
Giver and the Requester may read the Feedback it collects (`ADR-0022` in the brain). Until now every
request was stored `ONLY_ME`.

ADR 0039 made the request itself readable by its Requester and its Givers only. Its consequences
expected #84 to widen that set: "`visibility` widens the set from there". Two things say otherwise:

- **Visibility governs Feedback, not the request.** The glossary defines it as who may read *a piece
  of Feedback*. The request also says who else was asked and who has not answered yet, which says
  more about the Requester's colleagues than the answers do.
- **The Giver is not told who else reads their answer** (`ADR-0022`, decision 2). The request read is
  the one route a Giver uses, so it cannot be the route that carries the Visibility to everyone.

## Decision

**Visibility is enforced on `GET /v1/workspaces/{workspaceId}/feedback/{feedbackId}`, one piece of
Feedback at a time. The request read keeps ADR 0039's rule unchanged.**

- One rule, in the domain: `Visibility.letsRead`. The Giver and the Receiver always may read;
  *Everyone* means every Member; *Selected people* means only those listed; *Only me* means nobody
  else. The Workspace guard has already proven the caller is a Member, which is what keeps
  *Everyone* inside the Workspace.
- Anybody else gets `404 FEEDBACK_NOT_FOUND`, the same as for an id nothing was written under
  (ADR 0039's reasoning).
- The selected people belong to the `Visibility` value object, stored in
  `feedback_request_selected_person`, so *Selected people* with nobody in it, or *Everyone* with
  somebody picked, cannot be built.
- The request read tells **only the Requester** the Visibility (`visibility: { value, selectedPeople }`).
  A Giver gets `null`.

## Consequences

- *Shared with me* (#88) and the Workspace feed (#90) list Feedback through the same rule. Neither
  has to load or reveal the request.
- Nothing in the web app opens a single piece of Feedback yet. Until #88, the route is reached by
  its address only.
- The request's response shape changed from a bare `visibility` enum to a nullable object. The only
  consumer was this repository's web app, updated in the same change. The product has no users, so
  nothing outside the repository can break.

## Alternatives rejected

- **Widen who may open the request**, as ADR 0039 anticipated. Rejected: it shows a selected
  colleague who else was asked and who has not answered, which the Requester did not choose to
  share. It would also need a second rule for which answers each reader sees.
- **Hide the Visibility from nobody.** Rejected: `ADR-0022` decided the Giver is not told, and named
  the risk it accepted in doing so.
