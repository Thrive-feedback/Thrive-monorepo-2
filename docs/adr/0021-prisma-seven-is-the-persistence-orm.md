# 0021 — Prisma ORM 7 is the persistence ORM

Status:   accepted
Date:     2026-09-28
Deciders: naroebordin.w

## Context

The NestJS API runs on Bun. `BE_06` requires repository ports and an explicit mapper;
stored records and ORM types must stay in infrastructure. `BE_03` forbids one module from
reading another module's tables. ADR 0020 chooses ordinary hosted Postgres, not a
Supabase-specific application client.

Prisma documents a Bun runtime path and a PostgreSQL driver adapter. Multi-file schema
support is generally available, so model files can be grouped by bounded context.
[Bun guide], [PostgreSQL connector], [multi-file schema].

## Decision

Use **Prisma ORM 7** with its PostgreSQL driver adapter in the API. Pin the supported
major when installed; do not take Prisma 8 while it is a release candidate. Keep each
context's schema models together, and expose Prisma only inside that context's
infrastructure adapters. A mapper converts between Prisma records and domain entities.
No Prisma model or client type appears in a port, use case, controller or API contract.

## Alternatives

- **Drizzle ORM.** Its TypeScript schema and SQL-oriented queries fit module-owned
  persistence, and Drizzle Kit can generate migrations. The current PostgreSQL getting
  started guide recommends release-candidate packages; choosing those now adds tool API
  churn, while pinning an older line means building against different docs. [Drizzle
  PostgreSQL], [Drizzle migrations].
- **Kysely plus a migration tool.** Gives fine control over SQL, but adds migration
  wiring and leaves more record mapping to write before the first aggregate exists.
  No current query needs that control.

## Consequences

- Prisma adds a generated client and build step. The database setup change must wire
  generation into local and CI builds and verify it on Bun.
- Its global client can see every table; module boundaries still need review and an
  import guard. Separate schema files are organization, not access control.
- Persistence adapters may use Prisma's query API, but the domain and application layers
  remain independent of it (`BE_06` R4–R5).
- This does not choose an auth provider or define any product table.

Supersedes: —
Referenced by: `PROJECT.md` §4, ADR 0022, `BE_06`

[Bun guide]: https://www.prisma.io/docs/guides/v7/runtimes/bun
[PostgreSQL connector]: https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql
[multi-file schema]: https://www.prisma.io/docs/orm/v6/prisma-schema/overview/location
[Drizzle PostgreSQL]: https://orm.drizzle.team/docs/get-started-postgresql
[Drizzle migrations]: https://orm.drizzle.team/docs/migrations
