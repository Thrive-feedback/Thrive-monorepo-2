# 0022 — Prisma Migrate owns schema changes

Status:   accepted
Date:     2026-09-28
Deciders: naroebordin.w

## Context

ADR 0010 starts with an empty schema; ADR 0020 chooses Supabase-hosted Postgres; ADR
0021 chooses Prisma ORM 7. `BE_15` R1 requires one tool to own every structural change.
Prisma Migrate generates checked-in SQL and applies migration history in development and
deployment. [Prisma Migrate].

## Decision

**Prisma Migrate is the only DDL writer for Thrive-owned tables.** Supabase manages its
own platform schemas. Generate migrations locally with `prisma migrate dev`, review and
commit their SQL, and apply them once per environment with
`prisma migrate deploy` as a deployment step. Never migrate on API startup. Do not use
Supabase CLI migrations, dashboard DDL or `prisma db push` on a shared database.

Each migration changes one bounded context's tables and adds no cross-context foreign
key (`BE_15` R2). Schema models follow the domain (`BE_15` R3). Destructive changes use
the staged, separate migration path in `BE_15` R5 and R10.

## Alternatives

- **Supabase CLI migrations.** They work with the chosen host, but using them beside
  Prisma's schema and migration history creates two possible DDL writers. Rejected.
- **Prisma `db push`.** Fast for a throwaway prototype, but it does not produce the
  reviewed, immutable migration history `BE_15` requires. Rejected for shared data.
- **A separate SQL migration runner.** Can enforce module ownership, but adds another
  tool without a need Prisma Migrate cannot meet today.

## Consequences

- A deployment needs a single migration gate before new code serves traffic. Failure
  stops the deploy; it must not trigger an automatic destructive rollback.
- Prisma can generate a migration from changes in more than one schema file. Review must
  reject cross-context SQL and split it before applying.
- Migrations need a direct Postgres connection. The eventual CI/deployment runner must
  support that connection, including its IP version, while the API may use a pooler.
  [Supabase connections].
- The setup task must prove migrate → fresh database → second idempotent deploy, and
  later prove restore from backup before storing real feedback.

Supersedes: —
Referenced by: `PROJECT.md` §4, `BE_15`, `INFRA_11`

[Prisma Migrate]: https://docs.prisma.io/docs/orm/v7/prisma-migrate
[Supabase connections]: https://supabase.com/docs/guides/database/connecting-to-postgres
