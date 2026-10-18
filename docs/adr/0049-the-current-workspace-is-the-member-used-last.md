# 0049 — The current Workspace is the active membership used last, stamped on `member`

Status:   accepted
Date:     2026-10-18
Deciders: kritpavin

## Context

The brain's `ADR-0034` lets one Account be a Member of many Workspaces. Sign-in opens the Workspace
the person used last, on every device. If they have since been Deactivated there, it opens the active
one they used most recently. `ADR-0035` puts switching in Settings → Workspace.

No URL names a Workspace. Every signed-in page lives under `/home` and `/settings`, so on each request
the web must work out which Workspace a person is in. Until now it took their first membership,
because there was only one (ADR-0020). Three places enforced that rule:

- the plugin's `organizationLimit: 1`;
- `AlreadyInAWorkspaceError` when accepting an Invitation;
- `toCurrentMembership` on the web.

Better Auth's organization plugin has `session.activeOrganizationId` (ADR 0032), but it belongs to one
session. A second device would land somewhere else.

## Decision

**Each `member` row carries `lastUsedAt`. The caller's current Workspace is their active membership
with the latest `lastUsedAt`.**

- `lastUsedAt` is a plugin `additionalField` on `member` (`input: false`), nullable. Like
  `deactivatedAt`, the Workspace module writes it through `PrismaTransactionContext.client`, in the
  use case's unit of work.
- `WorkspaceSwitching.switchTo` stamps it. Three things switch:
  - `POST /v1/workspaces/{workspaceId}/switch` (`SwitchWorkspaceUseCase`), behind
    `WorkspaceMemberGuard`. The guard already answers `404` to anyone not active there.
  - creating a Workspace.
  - accepting an Invitation.
  Reads never stamp it, so reading stays free of writes, as it does for sessions (ADR 0027).
- `GET /v1/members/mine` lists the caller's memberships ordered by `lastUsedAt` descending, nulls last,
  then by when they joined, newest first. Its first item is the current Workspace. If that one has
  been Deactivated it drops out of the active list, so the fallback `ADR-0034` asks for needs no
  extra code. The route takes `status`, `ACTIVE` by default or `DEACTIVATED`, the same way
  `GET /v1/workspaces/{workspaceId}/members` does (ADR 0047). The switcher lists both.
- `organizationLimit` is removed, and with it `ALREADY_IN_A_WORKSPACE`. Accepting no longer refuses
  someone already in a Workspace, the last Admin included.
- Accepting serializes on `workspace-roles:<workspaceId>`, the key Deactivating, Reactivating and
  changing a Role take (ADR 0046). Accepting writes `member` there too, and two tabs accepting the
  same Invitation still meet on one key.

## Consequences

- One write per switch, create and accept, and none per page view. Opening a Workspace through a link
  does not make it the last used, because no address names one.
- Rows from before this change have no `lastUsedAt`. Ordering nulls last, then newest joined first,
  covers them. No backfill is needed, because everyone had at most one Workspace.
- `session.activeOrganizationId` is still written by the plugin on create and accept, but nothing
  reads it.
- **Creating is not idempotent.** Two tabs, or a retried request, each make a Workspace. Before,
  the limit stopped that. #206 asks only that one click make one Workspace, which the disabled
  submit button covers. A client idempotency key (`BE_07` R8) is the remedy if retries prove real.
- The ordering of `GET /v1/members/mine` changed from oldest first to used last first, and two error
  codes left the catalogue. The API ships before the web that reads it (`GEN_08` R8).

## Alternatives rejected

- **`session.activeOrganizationId`.** It belongs to one session, so a second device would land
  elsewhere, which breaks `ADR-0034` decision 2.
- **`user.lastWorkspaceId` in Identity.** Identity would hold a Workspace id, but Workspace depends on
  Identity and never the reverse (ADR 0030). The fallback would still need an ordering of
  memberships.
- **A cookie per device.** The same flaw as the session, and the web would have to keep it in step
  with Deactivate.
