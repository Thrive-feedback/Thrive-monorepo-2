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
the API startup path. The first migration belongs to the first domain model, so there
is no migration file while the schema has no models.

To stop the local database from the repository root, run `docker compose down`. The
named volume retains local data; `docker compose down --volumes` deletes it.
