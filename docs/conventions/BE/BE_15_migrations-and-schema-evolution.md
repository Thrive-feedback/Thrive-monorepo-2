---
title: "BE_15 · Database migrations & schema evolution"
id: "BE_15"
area: "BE"
tier: "P2"
status: "draft"
updated: "2026-09-27"
requires: [BE_06]
see_also: [BE_12, GEN_15]
---

[Conventions](../index.html) / Backend / BE_15

# [BE] Database migrations & schema evolution

`P2` · `BE_15` · `draft` · `updated 2026-09-27`

**Open when:** the schema has to change.

Migration naming and review, the forward-only policy, expand/contract for zero-downtime deploys, seed vs fixture data, and per-module schema ownership.

## The rules

If you read nothing else:

1. <a id="R1"></a>One tool owns the schema. Every structural change is a migration that tool applied, and nothing else writes DDL.
2. <a id="R2"></a>A migration touches one module's tables. Never one migration across two.
3. <a id="R3"></a>Derive every table from the domain model, never the domain model from a table.
4. <a id="R4"></a>Never edit a migration that has run anywhere but your own machine. Correct it with a new one.
5. <a id="R5"></a>Split any change a running reader cannot tolerate into expand, migrate, contract — three deploys, not one.
6. <a id="R6"></a>Write the rollback in the migration's description, not as code you have never run.
7. <a id="R7"></a>Name a migration for the change it makes, and let the tool own the ordering prefix.
8. <a id="R8"></a>Review a migration for what happens to existing rows, not only for whether it parses.
9. <a id="R9"></a>Seed data ships with the schema; fixture data belongs to one test and never leaves it.
10. <a id="R10"></a>A destructive step is its own migration, in its own pull request, after the code that needed the thing is gone.

## Why

A migration is the only change here that reverting a commit cannot undo. Bad code rolls back and the wrong version never existed; a migration that drops a column has destroyed the column. Almost every rule below trades convenience for that asymmetry.

A schema is also a shared surface. Two modules reading one table are coupled through it though neither imports the other, and the coupling is invisible in the import graph — the place everyone looks. A boundary that holds in TypeScript and leaks in SQL is not a boundary ([R2](#R2)).

Schema changes also cause most deploys that fail for reasons nobody reproduces locally: locally there is one code version and one schema; in a deploy there are two of each, in every combination ([R5](#R5)).

The cost is real — three deploys where one would do, and mistakes kept in the history rather than erased. Both buy a schema you can change without a maintenance window, far more cheaply before there is data.

## Rule detail

### [R1](#R1) One tool, and DDL only through it

Whichever tool `PROJECT.md` records owns the schema. Every structural change — table, column, constraint, index, enum, trigger — is a migration in its format, checked in and applied. Nothing else writes DDL: not a synchronise-on-boot feature, not a console session, not a hand-run SQL file, not a rival mechanism the platform ships. The second writer is invisible: a column added by hand exists nowhere in the repository, so the next generated migration ignores or drops it.

**Enforcement:** review — nothing detects a change applied outside the tool. See [Open questions](#open-questions).

### [R2](#R2) A migration belongs to one module

[BE_03](../index.html#BE_03) R7 forbids joining, transacting or migrating across two modules' tables. The first two surface in code review; this one hides in a file reviewers skim. A migration creating two modules' tables, or adding a foreign key between them, has merged those modules whatever the import graph says. Where one module needs another's data it stores the identifier and resolves it through a port ([BE_03](../index.html#BE_03) R5).

**Enforcement:** review — checkable once `PROJECT.md` records a namespace or naming scheme, and a strong candidate for the architecture check.

### [R3](#R3) The domain decides the schema

[BE_06](../index.html#BE_06) R10 sets the direction; this document adds *when* the decision is made — at the migration, which is when the temptation arrives. The mapper ([BE_06](../index.html#BE_06) R4) exists so a record and an entity may differ in shape. The test: if the answer to "why is the entity like that?" is "it made the query easier", the database wrote your model.

**Enforcement:** review.

### [R4](#R4) Applied means immutable

Once a migration has run anywhere but the machine that wrote it, it is history. Editing it gives two environments the same identifier with different contents, and every tool believes the version it recorded — so the environment that ran the old one stays silently wrong. Correcting a mistake means a new migration that fixes the state, leaving both in the history — which records what was done, not what you wish had been. While a migration is only local, edit it freely.

**Enforcement:** partly automated — tools refuse a checksum mismatch on an applied migration. They cannot see an edit made before anyone else applied it, which the rule permits anyway.

### [R5](#R5) Expand, migrate, contract

Old and new code both run against one schema during a deploy, and a change the old code cannot tolerate fails for real users in that window. Three steps, three deploys: **expand** — add the new shape, nullable, writing both while reading the old; **migrate** — backfill in batches, then switch reads; **contract** — once nothing reads the old shape, remove it, separately ([R10](#R10)).

Not everything needs this. A nullable column, an index, a table nothing reads yet are safe in one step. The test is not "is this small" but "is there a moment where one deployed version meets a schema it does not expect".

**Enforcement:** review — the judgement is what old code tolerates, and no tool has that context.

### [R6](#R6) Rollback is a plan, not a function

Most tools accept a `down`. Writing one is cheap; trusting one is not — it is rarely run before the day it matters, and a `down` that drops the column it created is the same data loss with a reassuring name. So the description says which earlier migration restores a working schema and whether the step is reversible at all. A change built with [R5](#R5) rarely needs one, because each step is independently safe.

**Enforcement:** unenforced — see [Open questions](#open-questions).

### [R7](#R7) Name the change, not the ticket

A migration's name is read in a directory listing and the tool's applied-record; both want the same thing — what this did to the schema. `add_deleted_at_to_invitations` answers it; `fix_schema` and a bare issue number do not, and the listing is exactly where you look when a deploy half-applied. Never hand-edit the ordering prefix: the order migrations ran is a fact about the past.

**Enforcement:** review — a name pattern is lintable; listed below as a candidate.

### [R8](#R8) Review the rows, not the syntax

A migration diff is short and reads as declarative, which invites approval at a glance. The questions that matter are not in the syntax:

- What happens to rows that already exist? A `NOT NULL` column with no default fails on a non-empty table.
- How long does it lock, and what? A table rewrite or index build can block writes throughout.
- Is the backfill bounded? One statement over every row differs at ten rows and ten million.
- Can the deployed code survive this schema ([R5](#R5))? Is it one module's tables ([R2](#R2))?

**Enforcement:** review — a checklist item in [GEN_06](../index.html#GEN_06), which allows blocking for a broken convention.

### [R9](#R9) Seed and fixture are different things

**Seed data** is rows the application needs to work, or that every environment needs to be usable — reference values a domain enum depends on, and the records someone needs to click through a feature. Versioned with the schema, idempotent, never containing anything that must not exist in production. **Fixture data** is rows one test needs, built by that test and torn down with it ([BE_12](../index.html#BE_12)). The failure this separates: a fixture promoted to a seed, which then cannot change because tests depend on its contents, and which ships to production.

**Enforcement:** review.

### [R10](#R10) Destruction travels alone, and last

Dropping a column, table or constraint goes in its own migration and its own pull request, merged after the code that stopped using it has been deployed and stayed deployed. The pull request is then reviewable, reverts on its own if wrong, and rests on evidence nobody reads the thing rather than a belief. [GEN_15](../index.html#GEN_15) covers the deprecation path leading here.

**Enforcement:** review.

## Worked example

A module stores a display name in one `full_name` column. The domain now distinguishes a given name from a family name.

The wrong version is one migration: rename, add a column, split the values. Three lines, passes review, breaks every running instance of the current code the moment it applies.

Under [R5](#R5):

**Expand.** A migration adds `given_name` and `family_name`, both nullable. Old code neither knows nor cares. The mapper writes all three columns and reads `full_name`. Deploy.

**Migrate.** A second backfills in batches from rows that have a `full_name`; its description names the batch size and says it is idempotent, so an interrupted run is simply run again ([R6](#R6)). Reads switch over, falling back where still null.

**Contract.** A third, in its own pull request, drops `full_name` ([R10](#R10)).

Each touches one module's table ([R2](#R2)) and is named for what it does ([R7](#R7)). If the split turns out wrong after the first step, nothing is lost — two unused nullable columns.

## Checklist

- One tool applied this change, and no DDL reached the database another way ([R1](#R1)).
- The migration touches one module's tables and adds no foreign key across a boundary ([R2](#R2)).
- The schema follows the domain model, and any new noun is already in the ubiquitous language ([R3](#R3)).
- No migration that ran outside the author's machine was edited ([R4](#R4)).
- Anything the deployed code cannot tolerate is split into expand, migrate, contract ([R5](#R5)).
- The description says what to do if this goes wrong, and any `down` present has been run ([R6](#R6)).
- The name says what changed, and the ordering prefix is the tool's ([R7](#R7)).
- The review answered: existing rows, locks, backfill bounds, compatibility with deployed code ([R8](#R8)).
- Seed data is idempotent and production-safe; fixture data stays inside its test ([R9](#R9)).
- Destructive steps are alone, in their own pull request, after the code that needed the thing ([R10](#R10)).

## Open questions

- Nothing detects a schema change applied outside the tool ([R1](#R1)). A CI step diffing the deployed schema against the migrations would, and is the strongest candidate guardrail here — it needs a database in CI, so it waits on the backing-services decision in `PROJECT.md`.
- [R6](#R6) is unenforced. A checklist catches a missing rollback description; nothing catches a `down` that would lose data, and a linter cannot tell the difference.
- [R2](#R2)'s module-to-table mapping is checkable only once a namespace or naming scheme is recorded. Until then a reviewer must already know which module owns which table.
- Whether the history should be squashed once the schema stabilises. It shortens a fresh setup and destroys the record [R4](#R4) protects. Worth an ADR before the history is long.

## Related

Requires [BE_06](../index.html#BE_06). See also [BE_12](../index.html#BE_12), [GEN_15](../index.html#GEN_15), [BE_03](../index.html#BE_03), [GEN_14](../index.html#GEN_14), [INFRA_12](../index.html#INFRA_12).
