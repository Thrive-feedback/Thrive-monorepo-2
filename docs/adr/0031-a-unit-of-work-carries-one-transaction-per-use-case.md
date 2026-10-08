# 0031 — A unit of work carries one transaction per use case

Status:   accepted
Date:     2026-10-08
Deciders: kritpavin

## Context

Creating a Workspace (#72) is the first use case that has to check something and then write, with
nothing else able to interleave. It checks "is this Account a Member of any Workspace?" and then
saves the Workspace with its Owner. Two tabs, or a double click, can both pass the check, and the
person ends up with two Workspaces. That breaks ADR-0020 in the brain.

A unique index on `member.accountId` would stop it. kritpavin chose to keep one Workspace per person
loose instead: a rule in the application, so that letting a person belong to several Workspaces later
means deleting one check, not running a migration. The guarantee therefore has to come from the
transaction.

`BE_05` R8 says a use case opens at most one transaction, covering the whole write. `BE_14`, which
would say how that transaction is passed without leaking the driver, is still `todo`. This ADR is its
interim answer, and `BE_14` is interpreted from its index entry.

## Decision

**A use case opens one transaction through the `UnitOfWork` port, and may serialize it on a key.**

- `shared/application/unit-of-work.port.ts`: `run(work, { serializeOn? })`. It lives in the
  application layer and shows no driver types.
- `infrastructure/database/prisma-unit-of-work.adapter.ts` opens one Prisma interactive transaction.
  With `serializeOn`, it first takes `pg_advisory_xact_lock(hashtext(key))`, which Postgres releases at
  commit or rollback.
- `infrastructure/database/prisma-transaction.context.ts` keeps the open transaction in an
  `AsyncLocalStorage`. Repositories and queries read `prismaTransactionContext.client`: the open
  transaction inside a unit of work, the plain client outside it. This is a separate class rather
  than a getter on `PrismaService`, because Prisma's client is a proxy that calls a subclass getter
  with the bare target as `this`, and the target has no models.
- Opening a unit of work inside another one throws. Only the outermost call knows what "the whole
  operation" means.
- `CreateWorkspaceUseCase` serializes on `workspace-founder:<accountId>`.

## Alternatives

- **A unique index on `member.accountId`.** This is the strongest guarantee and needs no new
  mechanism. Rejected by kritpavin: lifting the one-Workspace rule would then need a migration.
- **Disable the button, and accept the two-tab race.** This builds no mechanism at all. It was chosen
  first, then reversed the same day in favour of a real guarantee.
- **Pass a transaction client explicitly through every repository method.** This leaks the driver's
  type into every port signature (`BE_02` R7). Rejected.

## Consequences

- Every repository and query written from now on reads `prismaTransactionContext.client`, never
  `prismaService` directly, or it silently runs outside the caller's transaction. Identity's existing
  ones still read `prismaService`. That is harmless until one of them is called inside a unit of work.
- Two keys whose hashes collide wait on each other. This costs time, never correctness.
- A Prisma interactive transaction times out after 5 seconds by default. A use case that does slow
  work must do it before `run`, not inside it.
- `prisma-unit-of-work.adapter.integration.spec.ts` proves commit, rollback, serialization, and the
  nested-unit refusal. `create-workspace.use-case.integration.spec.ts` proves that two concurrent
  creates make one Workspace. Without the lock, that test fails.
- When `BE_14` is written, it starts from this ADR or supersedes it.

Supersedes: —
Referenced by: `PROJECT.md` §4, `apps/api/src/shared/application/unit-of-work.port.ts`
