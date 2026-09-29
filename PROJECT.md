# PROJECT.md

**This is the only file that says what this repository is and what stage it is at.**

Nothing else — not `AGENTS.md`, not `CLAUDE.md`, not any document in
`docs/conventions/` — may assert those facts. They state rules and conditions; this file
supplies the facts those conditions are checked against. That separation is what lets the
convention set be copied into a real project, and lets improvements made there be brought
back, without either side dragging the other's circumstances along.

When this repository is cloned to start a real project, sections 1–5 are **replaced**, not
edited around. `GEN_03` is the checklist.

---

## 1. Identity

|              |                                                                                   |
| ------------ | --------------------------------------------------------------------------------- |
| **Name**     | `thrive`                                                                            |
| **Kind**     | `product` — Thrive, an employee feedback platform                                   |
| **Stage**    | pre-launch; no users, no revenue, no deployment                                      |
| **Upstream** | `soizensun/fullstack-bp` @ `9492d6a1bc278f53a37b98c84dcb4ee223190852`, remote `boilerplate` |

The reference implementation this project was initialized from — the `todo` and `activity-log`
modules and the todo web app — was deleted at initialization (§3, `GEN_03` R5). It stays readable
on the upstream remote and is the fastest way to see a convention in working code:

```
git show boilerplate/main:apps/api/src/modules/todo/domain/entity/todo-list.entity.ts
git ls-tree -r --name-only boilerplate/main apps/api/src/modules/todo
```

**What Thrive is.** A global HRD platform; phase 1 is feedback culture — helping people inside a
company ask for, give and act on feedback. Sold to founders of 20–50 person startups. The durable
record lives in the **brain**, `Thrive-feedback/Thrive-brain`: `vision.md` for why, `glossary.md` for
the ubiquitous language, `domain-map.md` for the bounded contexts, `STATE.md` for what is true now.
Never restate a product fact here; link to the brain.

**A previous implementation exists and is being retired.** `Thrive-feedback/thrive-monorepo` — a Go
API and Next.js web app, dormant since 2026-05-31 — is read as a specification, never ported. The
feature-by-feature account is `as-built-inventory.md` in the brain.

## 2. What this means for your work

The trade-offs below follow from §1. They change when §1 changes — do not copy them
forward without re-deriving them.

- **Solve today's problem.** Do not build for the general case you have not met yet. *(This
  inverts the upstream boilerplate's stance, which preferred the general version because every
  pattern there gets copied into projects that never read it.)*
- **The conventions are inherited, not owned.** A change that works but breaks a convention is
  still a regression. Improvements to `docs/conventions/` go back upstream as their own pull
  request touching nothing else (`GEN_03` R10); project circumstances stay here in `PROJECT.md`
  and never travel.
- **The domain is real now.** Every domain noun must match `glossary.md` in the brain before the
  pull request merges — `Member` not user, `Workspace` not organization. A new noun is added to the
  glossary first.
- **One module per bounded context** (`domain-map.md`), owning its own tables. `BE_03` R7 is
  load-bearing: never join, transact or migrate across two modules' tables.

## 3. Code that ships as example, not as product

None. Removed at initialization on 2026-09-27 — see §1 for where to read it.

## 4. Stack

Writing code against a library that is not installed is the most common failure in this
repository. Check here first. If a task needs something from the _planned_ column, say so
and propose the addition — do not quietly install it.

| Concern                                  | Status      | Notes                                                                                                                                                                  |
| ---------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Turborepo, Bun workspaces                | **present** | turbo 2.10, bun 1.3.14. One dependency catalog in the root `package.json`: a dependency two workspaces share is declared there once and referenced as `catalog:`; build-shaping tools are pinned exactly (ADR 0017). Internal packages are `workspace:*` |
| Bun as runtime                           | **present** | `apps/api` runs on Bun (ADR 0011). **`apps/web` runs on Node** — Next.js does not support Bun in production; declared as the per-workspace override `INFRA_04` R10 describes, with no removal condition. **`experimentalDecorators` and `emitDecoratorMetadata` are declared in `apps/api/tsconfig.json` itself and must stay there** — Bun does not resolve them through a tsconfig `extends` into `@repo/typescript-config`, and Nest's decorators throw `descriptor.value` errors without them. A documented exception to `INFRA_03`'s shared-config pattern; deleting the duplication breaks the app |
| NestJS 11 API                            | **present** | `apps/api`, listens on `:3000`                                                                                                                                         |
| Next.js 16 App Router, React 19          | **present** | `apps/web` on `:3001`                                                                                                                                                  |
| `bun test`                               | **present** | **API only** (ADR 0012) — same runtime the app ships on. Integration tests are named `*.integration.spec.ts` (ADR 0019): the fast suite excludes them with `--path-ignore-patterns` and `test:integration` selects them. The old `*.integration-spec.ts` was collected by nothing — bun needs `.spec` or `_spec_`, not `-spec` — so a test under it would have run in no suite at all. `test:integration` **exits 1 until the first integration test is written** — bun treats a filter that matches nothing as a failure, and prints its generic note about test file names. Nothing runs it automatically |
| Node ≥ 24 for the web workspace          | **present** | `engines.node` is `>=24` and `.nvmrc` pins 26.9.0. `@repo/vitest-config` exports raw `.ts`, so loading `vitest.config.ts` needs Node's native type stripping: on Node 20 or 22 the web suite dies with `ERR_UNKNOWN_FILE_EXTENSION`. Turbo's cache hid this — `turbo run test --force` is how you see it |
| Vitest 3 + Testing Library + MSW         | **present** | shared base in `@repo/vitest-config`; **web only**. Split by workspace on purpose (ADR 0007). `lib/test/setup.ts` registers jest-dom and cleanup; **no MSW server yet**, because nothing the web app renders reads the network — the first suite that does adds it |
| Biome 2.5 (lint, format, import sorting) | **present** | replaced ESLint + Prettier (brain `ADR-0015`, ADR 0013). Shared rules in `packages/biome-config`, extended by the root `biome.json`. Prettier is gone and **Markdown has no formatter** — `GEN_12` governs document shape (ADR 0013). `style/useImportType` is **off repo-wide**: NestJS reads constructor types from `design:paramtypes`, and `import type` erases the binding, so the autofix breaks DI |
| Zod 4 + `nestjs-zod` 5                   | **present** | API only. One schema per operation, type derived (`BE_08` R3)                                                                                                          |
| `@nestjs/swagger` 11 + Scalar            | **present** | API only. OpenAPI generated from the app at `/openapi.json`; Scalar UI at `/reference`. Pinned to 11.x — v12 needs NestJS 12                                           |
| `uuid` 11                                | **present** | UUIDv7 (`GEN_11`)                                                                                                                                                      |
| `openapi-typescript` + `openapi-fetch`   | **present** | the contract pipeline (ADR 0006). `packages/api` holds the generated schema and typed client — **not example code**, kept and regenerated against Thrive's own contract |
| Gherkin e2e (Cucumber 13)                | **present** | wiring kept; `features/` is empty until Thrive has a scenario                                                                                                          |
| Tailwind CSS 4                           | **present** | `apps/web` only, with `class-variance-authority` and `tailwind-merge` (ADR 0008)                                                                                       |
| Authorization                            | **present** | enforced in the application layer (`BE_21`). **Postgres RLS is deliberately not used** — see §5 note                                                                    |
| Design tokens                            | **present** | `packages/tokens` — three layers (`FE_03` R2): seven OKLCH ramps as primitives, role-named semantic tokens, and a Tailwind `@theme inline` built from the roles. Values were read out of the retired build (`docs/adr/0009`), so they are real rather than placeholders, and `FE_03` R6 keeps this package the source of record **only until a design source exists** — Spike #43. The theme resets Tailwind's defaults (`--*: initial`) and exposes no colour primitive, so neither `bg-primary-500` nor `bg-red-500` is a class that exists; type, weight, width and breakpoint scales are Tailwind v4's values copied in as tokens, provisional under #43. **No dark mode yet** (out of scope in #47); it attaches to the semantic layer as `:root[data-theme='dark']`. Inter only — the old build's display face is licensed and waits on that being confirmed |
| Auth provider                            | _planned_   | **open decision 3 — kritpavin.** See `auth-decision-brief.md` in the brain                                                                                              |
| Database, ORM, migrations                | _planned_   | **open decision 2.** Schema starts from scratch, derived from `domain-map.md`; the old repo's migrations are reference only                                            |
| Object storage                           | _planned_   | Epic #10 gives `Profile` a photo. Falls out of decisions 3 and 4                                                                                                        |
| Redis, outbox, background jobs           | _planned_   | `BE_17`–`BE_19` are `todo`; no backing services, no Docker, no compose                                                                                                 |
| CI (GitHub Actions)                      | **present** | `.github/workflows/pr.yml` — five jobs on every pull request to `main`: *Code style*, *Types*, *Architecture*, *Tests*, and *Build* (affected workspaces). The first four are required by branch protection; *Build* becomes required after this workflow lands on `main`. No deploys in CI |
| dependency-cruiser 18                    | **present** | the import-graph guardrails (ADR 0014): cycles, app and package direction, reaching past an entry point, and `FE_01`'s ladder. Config at `.dependency-cruiser.cjs`; it resolves through the **root** `tsconfig.json`, which therefore mirrors the web app's `@/*` alias — change one, change both; every rule has a fixture under `scripts/arch-fixtures/` that `scripts/verify-arch-fixtures.mjs` proves still fails. `apps/api/scripts/check-architecture.mjs` keeps the specifier-level `BE_*` rules |
| Install constraints                      | _planned_   | no `bunfig.toml` maturity window and no `trustedDependencies`; install scripts follow Bun's default list (`INFRA_04` R6) |
| Git hooks                                | _planned_   | no hook manager (`INFRA_05` R9) |
| Hosting / CD                             | _planned_   | **open decision 4**. `INFRA_11` is `todo` and no workflow deploys anything |
| Playwright / browser Gherkin             | _planned_   | `FE_15` has no implementation                                                                                                                                          |

## 5. Open decisions

Load-bearing and unresolved. If your task depends on one, stop and raise it — do not
settle it on your own. Record the answer as an ADR (`GEN_13`) and delete the row.

1. **The 404 a streamed route cannot answer.** `FE_11` R6 wants a missing resource to carry
   a 404. `FE_11` R5 and `FE_09` R7 each make the response stream, and a streamed response has
   already been sent as 200 by the time `notFound()` runs. The fix is an existence check at the
   edge, which costs an API call on every request to the route. Logged in `FE_11`'s open
   questions. *(naroebordin.w)*
2. **Database host, ORM and migration tool.** Nothing is installed. Supabase Postgres in the
   Singapore region is the current lean, not a decision; Neon and Railway were the alternatives
   weighed. `BE_15` is `todo`, so the migration convention has to be written alongside. `BE_06`
   R4's mapper rule should inform the ORM choice. *(naroebordin.w)*
3. **Auth provider.** Shortlist: Better Auth, Clerk, Supabase Auth. Auth0, Auth.js, Keycloak and
   WorkOS are recorded as rejected with reasons. Blocks Epic #9 and nothing else. The brief, the
   constraints and the Google Calendar dependency are in `auth-decision-brief.md` in the brain.
   *(kritpavin)*
4. **Where the API runs, and how it gets there.** Railway is the assumption inherited from the
   retired repo; nothing is decided. `INFRA_11` CD is `todo`. *(naroebordin.w)*

**Settled alongside these, not open:** authorization is enforced in the application layer and
Postgres RLS is not used. RLS is built around a specific provider's session claims, and
half-adopting it is the failure mode; `BE_21` puts authorization in the application.

---

## 6. Keeping this file true

- Update the moment a fact changes — the same pull request that installs Tailwind moves
  its row to _present_.
- A fact stated here must appear nowhere else. If you find one duplicated in `AGENTS.md`
  or a convention document, delete it there and link here.
- Convention document statuses are **not** tracked here. Each entry in
  `docs/conventions/index.html` carries its own `data-status`; that is the only record.
- Sections 1–5 are project-local. They are never merged upstream and never inherited
  downstream.
