# 0052 — Workspace Goal is its own module, and asks Workspace who is an Admin

Status:   accepted
Date:     2026-10-20
Deciders: kritpavin

## Context

The brain's `ADR-0036` adds the **Workspace Goal**: a hashtag an Admin creates for the whole
Workspace. It is never renamed or deleted, only hidden and shown again. Admins see every one;
other Members see the active ones. Card #225 has it saved. The card asks for one thing to be
settled before any code: whether it lives in its own module or inside Workspace (`ADR-0021`
leaves technical choices to the Task).

Three facts shaped the answer:

1. **Workspace has no aggregate of its own.** Workspace and Member are stored by Better Auth's
   organization plugin (ADR 0032). The module's domain is value objects plus one published
   port. A Workspace Goal is the first Workspace-wide thing with its own rules and its own
   lifecycle.
2. **The glossary gives it its own section,** *Workspace Goals (supporting)*, beside the other
   contexts, not inside Workspace's. Later Feedback cards (#226–#228) bind Feedback to it, so
   Feedback will depend on whoever owns it.
3. **Only Admins may change one.** Workspace publishes `WorkspaceMembershipPort`, which until
   now answered membership facts only (ADR 0037). Roles stayed inside Workspace.

`BE_16` (inter-module communication) is still `todo`, so its index entry is the binding text.
This ADR reads it as a direct call through a published port, with no event, which is ADR
0037's reading too.

## Decision

**Workspace Goal is a module of its own, `apps/api/src/modules/workspace-goal/`, owning the
`workspace_goal` table. It asks Workspace one new published question: is this Account an
Admin here?**

- `WorkspaceMembershipPort.isAdminOf({ workspaceId, accountId })` is added beside `isMemberOf`.
  It answers `true` for an active Admin only. A Member, a Deactivated Admin and anybody outside
  the Workspace all get `false`.
- Workspace Goal declares its own `WorkspaceMemberGuard` over `isMemberOf`, as ADR 0037 has
  every module do. Its use cases call `isAdminOf` to refuse a non-Admin's add, hide or show
  (`NOT_ALLOWED_TO_MANAGE_WORKSPACE_GOALS`). The list answers hidden ones only to an Admin.
- `workspace_goal.workspaceId` is a plain column with no foreign key (`BE_03` R7).
- **Names are unique ignoring letter case through a stored key,** `nameKey`, which is the name
  lower-cased. `@@unique([workspaceId, nameKey])` covers hidden rows too. It refuses the second
  of two racing adds, and that refusal surfaces as the same `WORKSPACE_GOAL_NAME_TAKEN` the use
  case's own check raises (ADR 0041's pattern). Later cards match hashtags on this same key.
- The barrel exports only the Nest module. Nothing is published until Feedback needs it.

## Alternatives

- **Inside the Workspace module.** The Admin check would read the Role directly, and no new
  port would be needed. Rejected:
  - Workspace would gain its first real aggregate beside a plugin it otherwise only adapts.
  - `BE_01` R7 would then require splitting it into submodules.
  - Feedback, which is about to bind to Workspace Goals, would be coupled to everything else
    Workspace owns.
- **Publish the Role itself** (`roleIn(...)`) instead of `isAdminOf`. Rejected: every consumer
  would then compare Role strings, which `BE_04` R6 forbids. The fact a consumer needs is
  "Admin or not", and that is all the port should say.
- **A unique expression index on `lower(name)`.** It needs no extra column. Rejected: Prisma
  cannot declare it, so the schema and the migration would disagree. The domain would also
  lose the one place where "the same name" is defined, which #226 needs for matching.

## Consequences

- `WorkspaceMembershipPort` grows a method, so every fake and implementation of it grows one
  too (`FakeWorkspaceMembershipPort.withAdmins`).
- `isAdminOf` costs one membership read per Workspace Goal request, after the guard's own read.
  This is negligible at 20–50 Members.
- Whether someone is an Admin is no longer private to Workspace. The next module that needs a
  per-Role rule should reuse this method rather than add another.
- The list of names only grows, since a hidden name stays taken (`ADR-0036`'s untested
  assumption). Nothing here prevents a long list.

## Links

- Brain `ADR-0036` (the product rules), brain `glossary.md` (**Workspace Goal**)
- ADR 0037 (plain ids, a guard per module, a published membership port)
- ADR 0041 (a unique index as the race-proof half of a rule)
- #223 (Epic), #224, #225
