# 0051 — An action from a page drawn for another Workspace changes nothing

Status:   accepted
Date:     2026-10-18
Deciders: kritpavin

## Context

Every web action that writes in a Workspace read "the current Workspace" from the session at the
moment it was sent (ADR 0049). With switching, one tab can still show Workspace A after another tab
switched to B. Deactivating "Ann" from the stale tab would then Deactivate Ann in B, if she is in
both. The API cannot tell: the caller is a Member of both Workspaces, and its guard checks only that.

The brain's `ADR-0035` decision 6 says such an action must change nothing.

## Decision

**Every Workspace-scoped server action receives the id of the Workspace its page was drawn for.
`requireMemberOf(workspaceId)` compares it with the Workspace the person is in now. When they differ,
the action sends the person to Home, which says nothing was changed, before anything reaches the
API.**

- Home's actions get the id bound on the server where the form is drawn. Settings' buttons and the
  invite forms take it as a prop.
- The same refusal covers a person Deactivated in the Workspace the page shows, so Home's message
  names neither cause: "that page was for another Workspace".

## Consequences

- Whatever was typed into the stale tab is lost; Home says why.
- The guard lives in the web only. A client calling the API directly names its Workspace in the
  path, as it always has.

## Alternatives rejected

- **Acting in the Workspace the stale page shows.** Each action would then name its own Workspace,
  while every other page follows the current one. A person in two Workspaces could Deactivate or give
  Feedback where they did not mean to.
- **Accepting the risk.** `ADR-0034` lists Feedback sent to the wrong Workspace as a reason to reverse
  it.
