# 0046 — A Role changes through the plugin, under a per-Workspace lock

Status:   accepted
Date:     2026-10-16
Deciders: kritpavin

## Context

#67 and #77 let an Admin make anyone an Admin or a Member, other Admins and themselves included.
The brain's `ADR-0033` requires that a Workspace always keeps at least one Admin, and #77 requires
the API to refuse the last one, not only the screen.

Members are stored by Better Auth's organization plugin (ADR 0032). Its `updateMemberRole` checks
that the creator Role (`admin`, ADR 0045) keeps one holder, but outside any transaction Thrive
controls. Two Admins making each other Members at the same moment would both pass a plain "is
there another Admin?" check, and the Workspace would be left with none.

## Decision

**`PATCH /v1/workspaces/{workspaceId}/members/{accountId}` changes a Role through the plugin, on
the changer's own session, inside a unit of work serialized on `workspace-roles:<workspaceId>`.**

- `ChangeMemberRoleUseCase` opens the unit of work (ADR 0031). Inside it, the use case reads the
  changer's Role again, then the target's Role, then the number of Admins.
  `MemberRole.ensureMayBecome` refuses the last Admin with `LAST_ADMIN` (`409`). Only after that
  does `BetterAuthMemberRoleChangingAdapter` call `updateMemberRole`. The route answers `204`.
- The advisory lock is held until the plugin's write has committed. A second change in the same
  Workspace waits for it, then reads afresh. The changer's own Role is read again under the lock,
  because the route's guard read it before the wait.
- A new Role holds from the Member's next request. `WorkspaceMemberGuard` reads the membership on
  every request, and nothing caches it.

## Consequences

- The plugin's own check still runs after ours. It never disagrees, so the caller always sees
  Thrive's code.
- Role changes in one Workspace run one at a time, which costs nothing noticeable at 20–50 people.
- When Deactivating lands (#192), `adminCountOf` must count only active Admins.
- `change-member-role.use-case.integration.spec.ts` proves the race: of two Admins demoting each
  other, exactly one succeeds.

## Alternatives rejected

- **Write `member.role` with Prisma inside the transaction.** This would be one connection and one
  transaction, but it bypasses the plugin, which ADR 0032 makes the writer of Member rows, along
  with any hook added to it later.
- **Check without a lock.** This is simpler, but the concurrent case leaves a Workspace with no
  Admin, which brain `ADR-0033` forbids.
