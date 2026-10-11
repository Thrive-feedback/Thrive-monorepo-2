# 0037 — Feedback identifies people by Account and holds no key into another module

Status:   accepted
Date:     2026-10-11
Deciders: naroebordin

## Context

Feedback is the first module that stores rows about people it does not own. A Feedback Request
(#21) names the Requester and, through its Asks, every Member asked. Both are Members of one
Workspace — and Workspace owns Members, while Identity owns Accounts.

Two things had to be decided before the first row was written:

1. **Which identifier names a person on a Feedback row.** Workspace stores Members in Better
   Auth's organization plugin's `member` table (ADR 0032), whose `id` is the plugin's. That id
   is not published: Workspace's barrel exports its Nest module and its ports, nothing else
   (`BE_03` R2). Its `userId`, on the other hand, is a Thrive Account — Identity's `user.id` —
   and is already on the wire, as `accountId`, in `GET /v1/workspaces/{workspaceId}/members`.
2. **Whether those columns carry a foreign key.** `BE_03` R7 forbids joining, transacting or
   migrating across two modules' tables. Workspace itself departs from this: `member` and
   `invitation` hold foreign keys into `user`, because the plugin writes those tables and
   defines those relations (ADR 0032). Feedback writes its own tables and has no such excuse.

`BE_16`, which would say how modules reference each other's data, is still `todo`, so its index
entry is the binding text and this ADR is its interim reading for Feedback.

## Decision

**A Feedback row names a person by `accountId` and a Workspace by `workspaceId`, as plain
columns with no foreign key, and Feedback asks Workspace whether that pair is a Member.**

- `feedback_request.workspaceId`, `feedback_request.requesterAccountId` and
  `feedback_ask.giverAccountId` are `TEXT` columns. The only foreign key in the migration is
  `feedback_ask.feedbackRequestId` → `feedback_request.id`, inside the aggregate.
- `(workspaceId, accountId)` *is* the Member, as far as Feedback is concerned. It never reads
  `member`, never joins it, and never learns a Role.
- Workspace publishes one fact for this: `WorkspaceMembershipPort.isMemberOf({ workspaceId,
  accountId })`, declared in its `domain/port/`, implemented in its `application/adapter/` over
  the membership query, exported from its barrel (`BE_03` R5, R6). `SendFeedbackRequestUseCase`
  calls it for every Giver before anything is written.
- Feedback declares its own `WorkspaceMemberGuard` in its `presentation/`, over the same port.
  Workspace's guard does the same job but lives in that module's `presentation/`, which
  `BE_02` R2 and `BE_03` R4 both put out of reach. Both answer `WORKSPACE_NOT_FOUND`, so the
  two are indistinguishable to a caller.

## Alternatives

- **A foreign key from `feedback_ask.giverAccountId` into `user.id`.** The database would then
  refuse an Ask for somebody who does not exist, and cascade it away when they are deleted.
  Rejected: it makes every Feedback migration a migration across Identity's tables (`BE_03`
  R7), and it is exactly the coupling `docs/adr/0010` started the schema from scratch to avoid.
- **Store the plugin's `member.id`.** It is the narrower identity — it says *which Workspace*
  as well as who. Rejected: it is a provider's id, not published, and swapping the provider
  (ADR 0026's own exit route) would rewrite every Feedback row.
- **Export Workspace's `WorkspaceMemberGuard` from its barrel and reuse it.** Fewer lines, one
  guard. Rejected because the architecture check refuses it: a barrel re-exporting
  `presentation/` trips `BE_02` R2, and importing it directly trips `BE_03` R4. Weakening a
  guardrail to make a change pass is forbidden outright (`AGENTS.md` §6).

## Consequences

- A deleted Account leaves its id behind on an Ask. The read resolves it to no name — the same
  `giverName: null` the response already carries for a Member who has not introduced
  themselves. Nothing breaks; the Ask simply names nobody.
- Nothing stops a Feedback row naming an Account that never existed, so the check in
  `SendFeedbackRequestUseCase` is the only guard, and `BE_21` R10's refusal test is what proves
  it exists. `send-feedback-request.use-case.spec.ts` asserts that a Giver outside the
  Workspace stores nothing.
- Every later module that acts inside a Workspace — Goals, Insights, Notifications — copies
  this: `workspaceId` plus `accountId`, no foreign key, and `WorkspaceMembershipPort` for the
  membership fact. Each also writes its own guard until the conventions give a tenant guard a
  home.
- **The convention set has no home for a shared tenant guard.** `BE_02` R9 allows a guard in
  `shared/`, but a guard in `shared/` would depend on a module's barrel, which inverts the
  dependency every module has on `shared/`. Raised as a candidate improvement to `BE_16` or
  `BE_21` upstream (`GEN_01` R10); until then each module pays ~30 lines.
- When `BE_16` is written, it starts from this ADR or supersedes it.

Supersedes: —
Referenced by: `docs/design/0015-request-feedback.md`,
`apps/api/src/modules/workspace/domain/port/workspace-membership.port.ts`
