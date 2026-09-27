# 0009 — The legacy Go API is rebuilt in TypeScript, not ported

Status:   accepted
Date:     2026-09-27
Deciders: naroebordin.w

## Context

Thrive already has a working implementation. `Thrive-feedback/thrive-monorepo` holds a
Go 1.24 / Fiber / GORM / Supabase API and a Next.js web app — 6,375 hand-written lines
of Go and roughly 8,700 of web code, ten screens, twenty-six typed API hooks, everything
wired end to end. It has been dormant since 2026-05-31.

This repository is the other half of the problem: a convention set with no product in it.
Having two repositories is not a plan, so one of them has to absorb the other.

Four facts shaped the choice.

**The Go is smaller than it looks.** Of 10,207 lines, 2,590 are generated Swagger and
1,242 are tests. The hand-written total is 6,375, and the business logic inside it is
about 1,130 lines. The rest is handlers, GORM repositories, DTOs and wiring — the parts
a framework supplies.

**It is hexagonal but not modular.** The layering is clean: domain, ports, services,
adapters, constructor injection, and a transaction abstraction that keeps GORM out of the
ports. But `internal/core/domain/` is one flat package and `FeedbackRequest` holds `*User`
pointers directly. There is no event bus anywhere. The brain's `domain-map.md` rests the
Insights privacy guarantee on domain events carrying ids and counts but never content.
Porting would not produce the architecture already specified — most of the rebuild cost is
adopting that architecture, and it would be paid in Go too.

**It predates the product.** The code was written before the direction decided on
2026-09-11 and 2026-09-15. It says `User` and `Organization` where `glossary.md` says
`Account` and `Member` and `Workspace`; it builds Kudos and Visibility, which `ADR-0006`
in the brain excludes from phase 1; and it lacks Goals, Insights, Action, Follow-up, and
an `Ask` with its own state, which phase 1 requires.

**There is nothing running to protect.** Zero users, zero revenue, zero interviews.

## Decision

The Go API is **read as a specification and rebuilt in TypeScript** on NestJS, in this
repository, one module per bounded context. It is not ported, and no Go runs here.

The legacy repository is frozen and archived, not deleted: it is the most detailed
description of Thrive that exists. A feature-by-feature account of what it does — with the
business rules, the eight-outcome invitation state machine, and two defects not to carry
forward — is kept in the brain.

## Alternatives

- **Port the Go, keep the language.** Rejected: it preserves the wrong domain language and
  the wrong phase-1 scope, and it does not deliver the module boundaries or the event bus
  that `BE_03` and `domain-map.md` require. The saving is ~1,130 lines of business logic.

- **Adopt the legacy repository as home and bring the conventions to it.** Rejected: the
  thirteen BE conventions are TypeScript- and Nest-specific, so they would have to be
  rewritten for Go, and the set would stop being portable upstream (`GEN_03` R7, R10). The
  convention set is the asset this repository exists to carry.

- **Strangler: merge the Go in and retire it context by context.** Rejected, though it is
  the strongest alternative. It loses nothing up front, but it means two backend languages,
  two CI lanes and two sets of conventions maintained indefinitely by a team of two, to
  protect a system with no users.

## Consequences

- About 1,130 lines of working business logic are rewritten. The wider rebuild is not a
  cost of this decision — it is the cost of adopting the specified architecture, which any
  option incurred.
- Slack notification and OAuth integration work, the email templates, and the invitation
  state machine have to be re-implemented. Their *shape* is proven and readable in the
  legacy repository.
- The brain's `glossary.md` names are adopted at rewrite time rather than renamed later.
  This is a genuine saving, and it only exists because we are not porting.
- Two defects must not be carried forward: the integration OAuth access token is stored
  unencrypted, and `UndoKudo` deletes by id with no ownership check.
- If the rebuild stalls, there is no partially-migrated system to fall back to. The legacy
  repository either runs as it did or not at all.

Supersedes: —
Referenced by: `PROJECT.md` §1, the brain's `as-built-inventory.md`
