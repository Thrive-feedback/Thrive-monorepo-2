# 0047 — Deactivating is a timestamp on the Member, and every membership read is active-only

Status:   accepted
Date:     2026-10-17
Deciders: kritpavin

## Context

#191 and #192 let an Admin Deactivate anyone else in their Workspace, and let anyone Deactivate
themselves, which is how they leave. The brain's `ADR-0033` sets the rules:

- Nothing is deleted. The person's name is later shown with "Deactivated" beside it (#193).
- The last active Admin can be neither Deactivated nor leave.
- A Deactivated person sees nothing of the Workspace any more.

Members are stored by Better Auth's organization plugin (ADR 0032). The plugin can end a membership
only by deleting the `member` row. That would lose the Role, and the record that the person was ever
there, which #193 and any way back (#194, #209) need.

## Decision

**A Member is Deactivated by setting a date in `member.deactivatedAt`. Every membership read answers
only active Members, unless it asks for the Deactivated ones.**

- `deactivatedAt` is a plugin `additionalField` on `member` (`input: false`), so the plugin's schema
  and ours stay one. `null` means active.
- `PrismaMemberDeactivatingAdapter` writes the date through `PrismaTransactionContext.client`, inside
  the use case's unit of work. This is the one write to `member` that does not go through the plugin,
  because the plugin has no operation for it.
- `MembershipQuery` filters on `deactivatedAt: null` everywhere:
  - the Workspace's own guard;
  - the published `WorkspaceMembershipPort`, which Feedback's guard and its recipient checks use;
  - `GET /v1/members/mine`;
  - `adminCountOf`.

  A Deactivated person therefore cannot open the Workspace or be asked for Feedback in it, with no
  change to Feedback. `membersOfWorkspace` takes a status, and
  `GET /v1/workspaces/{workspaceId}/members?status=DEACTIVATED` lists those who left.
- `POST /v1/workspaces/{workspaceId}/members/{accountId}/deactivate` runs `DeactivateMemberUseCase`.
  It is serialized on `workspace-roles:<workspaceId>`, the same key Role changes take (ADR 0046),
  because both can lower the number of active Admins. `MemberRole.ensureMayBeDeactivated` refuses the
  last one with `LAST_ADMIN` (`409`).
- An Invitation into a Workspace where the person is Deactivated is refused with
  `DEACTIVATED_IN_WORKSPACE` (`409`). Their kept row would otherwise make the plugin's accept fail on
  the unique index. How someone comes back is #194's and #209's to decide, and either replaces this
  refusal.

## Consequences

- No `MemberDeactivated` event is published. There is no outbox yet (`BE_17` is `todo`), and nothing
  listens. When one exists, the use case is the place to raise it.
- The plugin still sees a Deactivated person's row as a member. That person never reaches the plugin,
  because every route checks `MembershipQuery` first.
- The plugin's `organizationLimit: 1` still counts the kept row, so someone who left cannot found a
  Workspace of their own. No card covers that yet; creating another Workspace is #206.

## Alternatives rejected

- **The plugin's `removeMember`.** It deletes the row, losing the Role, the history, and any way back.
- **A separate `deactivated_member` table.** It would be a second source for "who is in this
  Workspace", and every read would have to join it.
