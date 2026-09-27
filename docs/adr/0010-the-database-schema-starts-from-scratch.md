# 0010 — The database schema starts from scratch

Status:   accepted
Date:     2026-09-27
Deciders: naroebordin.w

## Context

`ADR 0009` rebuilds the legacy Go API rather than porting it. That leaves a separate
question the rebuild does not answer on its own: the legacy system has nine Supabase
migrations and a populated schema. Does the new implementation inherit them?

The legacy schema is a single Postgres schema with foreign keys crossing every context
line — `feedback_requests` references `users` directly, and the join tables
(`request_responders`, `request_tags`, `direct_feedback_receivers`,
`feedback_request_viewers`) all span what `domain-map.md` treats as separate bounded
contexts.

It also encodes decisions the product has since reversed: `kudos` and `kudos_tags` tables,
a `visibility` column with viewer join tables, a `departments` table that no endpoint or
screen ever used, and `organization_members` modelling one organization per person where
`glossary.md` says an Account may be a Member of several Workspaces.

There is no production data. Zero users.

## Decision

**The schema starts from scratch**, derived from `domain-map.md` and `glossary.md` rather
than from the legacy tables — `BE_06` R10, *derive the schema from the domain; never let
the store's shape dictate the model*.

No schema is migrated and no data is carried over. The legacy migrations are reference
material: read them to see what a feature needed, never to derive the new shape.

## Alternatives

- **Migrate the schema and rename as we go.** Rejected: renaming `users` to `members`
  leaves the foreign keys where they are, so `BE_03` R7 — never join, transact or migrate
  across two modules' tables — would be unfollowable from the first table. The naming is
  the cheap part; the topology is the problem.

- **Keep the schema for the contexts that barely changed** (Identity, Workspace) and start
  fresh elsewhere. Rejected: those are exactly the tables the rest of the legacy schema
  points at, so keeping them keeps the cross-context foreign keys.

- **Start fresh but keep the migration tooling.** Partly adopted. The Supabase CLI
  migration system is not inherited by default — see Consequences — but nothing here rules
  it out if the database decision lands on Supabase.

## Consequences

- Each bounded context can own its own tables from the first migration, which is what makes
  `BE_03` R7 enforceable rather than aspirational, and what makes the Insights privacy
  guarantee in `domain-map.md` structural rather than a permission check.
- Two design choices become free that inheriting would have fixed: the identifier strategy
  (the legacy schema used `bigserial`; module-owned tables argue for UUIDv7, which `GEN_11`
  already selects) and whether contexts get separate Postgres schemas.
- Nothing is inherited by accident — no `departments`, no `kudos_tags`, no viewer tables.
- **One migration owner must be chosen deliberately.** The legacy repository used Supabase
  CLI migrations; the new one will have an ORM with its own. Running both is how schemas
  drift. This is settled in `BE_15`, which is `todo`, and has to be written before the
  first table exists.
- The seeded test data that Feedback's Tasks depend on has to be written fresh.
- Re-reading the legacy migrations stays worthwhile — they record which columns a working
  feature actually needed, which prose does not.

Supersedes: —
Referenced by: `PROJECT.md` §5 decision 3, `BE_15` (when written), the brain's `STATE.md`
