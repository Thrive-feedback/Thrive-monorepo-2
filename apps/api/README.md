# API development

The current stack and deployment status live in [`PROJECT.md`](../../PROJECT.md).

From the repository root, `bun run dev` starts local Postgres and both applications.
The first run copies `.env.example` to an ignored `.env`; use separate credentials for
application queries and migrations in a deployed environment.

Schema changes use the checked-in Prisma schema and SQL migration history:

```bash
cd apps/api
bun run db:migrate:dev --name describe_the_change
bun run db:generate
```

Review the generated SQL before committing it. Each migration changes one module's
tables. `db:migrate:dev` is for local development only. Deployment runs
`bun run db:migrate:deploy` once before the new API version starts; it never runs from
the API startup path. The first migration creates Better Auth's tables for Identity
(ADR 0025); regenerate their models with `bun run auth:generate`, never by hand.

To empty the local database, run one of these from `apps/api`:

- `bun run db:reset` drops every table and reapplies every migration. It asks first.
- `bun run db:drop` drops every table and leaves the database empty; run
  `bun run db:migrate:deploy` to rebuild it. It does not ask first.

Both act on `DATABASE_MIGRATION_URL`, so check that it points at the compose Postgres.
Never run either against a deployed database.

To stop the local database from the repository root, run `docker compose down`. The
named volume retains local data; `docker compose down --volumes` deletes it.
