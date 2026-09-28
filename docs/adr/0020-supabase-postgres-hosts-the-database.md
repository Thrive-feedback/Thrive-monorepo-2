# 0020 — Supabase Postgres hosts the database in Singapore

Status:   accepted
Date:     2026-09-28
Deciders: naroebordin.w

## Context

Thrive has no database or customer data yet. The API needs managed Postgres near its first
Thai customers, while the API host and auth provider remain open decisions. The legacy
build used Supabase, but ADR 0010 starts the new schema from scratch.

Supabase offers a specific Singapore region (`ap-southeast-1`). Its Free plan pauses an
inactive project after a week and has no automatic backups. As checked on 2026-09-28,
Pro starts at US$25 per month and retains seven days of daily backups. [Regions],
[pricing], [backups].

## Decision

Use **Supabase-hosted Postgres in the specific Singapore region** for Thrive's shared
database. Select Postgres 17 when provisioning to match the pinned local compose image;
local development does not use a shared cloud project. Do not provision a paid project
until a deployed environment needs it. Use Pro
before real customer data or a test site that must remain available without manual
unpausing. Verify price and backup terms when provisioning.

This chooses the database host only. Supabase Auth, Storage, Data API and RLS are not
chosen by it. NestJS remains the data-access boundary; disable the Data API when the
project is created if the API does not use it.

## Alternatives

- **Neon Postgres.** Also offers Singapore and a permanent Free plan with scale-to-zero,
  then usage-based paid compute. It is cheaper to start and its branches are useful for
  tests. Rejected here because a separate Supabase Auth choice would require a second
  provider and database project; Supabase keeps all three auth options open while using
  the host the team already knows. [Neon regions], [Neon pricing].
- **Railway Postgres.** Offers Singapore and can place app and database together.
  Rejected while the API host is undecided: its Postgres runs as a deployed service with
  platform backup configuration, so choosing it now couples this choice to deployment
  operations. [Railway Postgres], [Railway regions].
- **Self-hosted Postgres.** Rejected because backups, patching and availability would be
  Thrive's job before it has users or an operations team.

## Consequences

- The stable shared database has a recurring cost; Free is for disposable development
  data only. A backup restore drill is required before real customer data.
- The app and migration runner need separate, least-privilege credentials and secret
  delivery. The exact connection mode depends on the eventual API host.
- Keep the schema portable Postgres, with no dependency on Supabase Auth or RLS. Moving
  hosts still requires a planned dump, restore and cutover.
- The auth provider and API host decisions remain open.

Supersedes: —
Referenced by: `PROJECT.md` §4, ADR 0021, ADR 0022

[Regions]: https://supabase.com/docs/guides/platform/regions
[pricing]: https://supabase.com/pricing
[backups]: https://supabase.com/docs/guides/platform/backups
[Neon regions]: https://neon.com/docs/introduction/regions
[Neon pricing]: https://neon.com/pricing
[Railway Postgres]: https://docs.railway.com/databases/postgresql
[Railway regions]: https://docs.railway.com/deployments/regions
