# 0027 — Better Auth's tables take the glossary's names

Status:   accepted
Date:     2026-10-04
Deciders: kritpavin

## Context

ADR 0025 kept Better Auth's table names — `user`, `session`, `account`, `verification` — because
renaming `user` to `account` had been tried and failed. The brain's `glossary.md` says table names
come from its `In code` column and bans `User`, so `user` held a Thrive Account under a forbidden
name, and `account` held something the glossary calls by another name.

The failure 0025 recorded is in Better Auth's model lookup: it resolves a model by its built-in
key (`user`, `account`, …) before it checks a `modelName`, so naming its `user` model `account`
collides with its own `account` model. A table name is not part of that lookup. Through the
Prisma adapter Better Auth sees only Prisma model names; the table behind a model is Prisma's
`@@map`, which Better Auth never reads.

## Decision

**Better Auth's tables take the glossary's names; its Prisma models keep its own.**

| Prisma model (Better Auth's name) | Table            | Glossary term  |
| --------------------------------- | ---------------- | -------------- |
| `User`                            | `account`        | Account        |
| `Account`                         | `sign_in_method` | Sign-in method |
| `Session`                         | `session`        | —              |
| `Verification`                    | `verification`   | —              |

`session` already matches the glossary's wording, and `verification` is Better Auth's own store
for sign-in state, not a domain noun. A migration renames the tables in place; rows are kept.

## Alternatives

- **Keep the library's names (ADR 0025).** Leaves `user` in the database against the glossary's
  rule, and `account` meaning a sign-in method beside a domain Account. Rejected.
- **Rename the models through Better Auth's `modelName`.** Collides with the built-in keys, as
  0025 found. Names that avoid every key would work, but would put a second set of names into the
  provider's wiring for no gain over `@@map`. Rejected.
- **Rename the columns too** (`userId` → `accountId`). Better Auth's sign-in method table already
  has an `accountId` (the provider's id for the person), so it collides there too. Not adopted.

## Consequences

- Only the provider's wiring says `User` or `Account` for a sign-in method: the Prisma models
  `User` and `Account`, and Better Auth's options. Domain code still never names them.
- Columns keep Better Auth's names, so `session."userId"` and `sign_in_method."userId"` point at
  `account`.
- `bun run auth:generate` adds `@@map` only where a model has none, so the hand-set table names
  survive a regeneration.
- A table rename has no expand/contract here because nothing is deployed (`PROJECT.md` §1). Once
  something is, a rename like this needs one (`BE_15` R5).

Supersedes: ADR 0025's consequence that the tables keep Better Auth's names
Referenced by: `PROJECT.md` §4, `apps/api/src/infrastructure/auth/auth.ts`
