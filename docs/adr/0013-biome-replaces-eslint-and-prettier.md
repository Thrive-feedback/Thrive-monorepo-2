# 0013 — Biome replaces ESLint and Prettier, and CI makes the checks required

Status:   accepted
Date:     2026-09-27
Deciders: naroebordin.w

## Context

The brain's `ADR-0015` chose Biome over ESLint + Prettier. That decision was about code
style; it did not say what happens to the pipeline, and the pipeline is where a convention
stops being advice (`INFRA_06`). This repository had **no CI at all** and an unprotected
`main`, so every convention in `docs/conventions/` was enforced only by whoever remembered
it.

The tooling being replaced was also weaker than it looked, which is part of why this is
worth recording:

- The root `.eslintrc.mjs` held flat-config contents under an eslintrc filename. ESLint 9
  reads neither spelling, so **the root config never ran**. It also disabled
  `@typescript-eslint/no-explicit-any` repository-wide, which `INFRA_05` R6 forbids.
- `eslint-plugin-only-warn` downgraded every rule to a warning. `apps/web` and `packages/ui`
  passed `--max-warnings 0`, so warnings failed there; `apps/api` and `packages/api` did
  not, so **their lint could not fail**.

## Decision

**Biome 2.5 owns lint, formatting and import sorting.** Shared rules live in
`packages/biome-config` and the root `biome.json` extends it (`INFRA_05` R4); per-workspace
`overrides` only *add* framework domains, never disable a shared rule (R5).

**Prettier is removed entirely, and Markdown has no formatter.** Biome 2.5 cannot format
Markdown, and `INFRA_05` R3 would have allowed keeping Prettier as the named secondary
formatter for it. The evidence said not to: `prettier --check "**/*.md"` failed on **55
files**, every convention document among them. Markdown in this repository has never been
formatter-governed — the old root `format` script globbed `.md` but nobody ran it — and its
line breaks are placed by hand. `GEN_12` already fixes document structure, section order and
the length budget, which is what a Markdown formatter would be approximating. Revisit only
if Biome ships Markdown support and the reflow is worth paying once.

**`.github/workflows/pr.yml` runs *Code style* and *Types* on every pull request to `main`,
and both are required checks.** `main` additionally rejects direct pushes and requires the
branch to be up to date before merging.

## Alternatives

- **Keep Prettier for `**/*.md`, as `INFRA_05` R3 permits.** Rejected once the 55 unformatted
  files were found: making it real costs a reflow of every convention document, against prose
  wrapped deliberately, and `docs/adr/` already had to be excluded from Prettier because it
  mangles the header layout `GEN_13` fixes. Keeping it unenforced was the worse option —
  `INFRA_05` R2 exists to stop exactly that.
- **Keep ESLint for type-aware rules alongside Biome.** Rejected: `INFRA_05` R1 gives each
  job one owner, and the type-aware rules this repository actually used were `no-floating-promises`
  and `no-unsafe-argument`, both set to *warn* and therefore not enforcing anything.
- **Require an approving review on `main`, as `INFRA_08` R9 states.** Deviated from, on
  purpose: the team is two people and most pull requests are agent-written, so a required
  review would stall solo work with no second reviewer awake. The other three parts of R9 —
  no direct pushes, required checks, up to date before merge — are enforced. Revisit when
  the team is larger than two; `INFRA_08` R10 still forbids an administrative bypass.

## Consequences

- `packages/eslint-config` and nine config files are deleted; `packages/biome-config` and a
  root `biome.json` replace them. Every workspace's `lint` script becomes `biome check .`.
- **`style/useImportType` is off repo-wide.** Biome's autofix rewrote
  `import { AppService }` to `import type { AppService }` in `app.controller.ts`, which made
  Nest's DI fail: `emitDecoratorMetadata` writes constructor types into `design:paramtypes`,
  and a type-only import has no runtime binding to write. Turning it off for `apps/api` alone
  would breach `INFRA_05` R5, so the question is answered once, globally.
- Tailwind class sorting moves from `prettier-plugin-tailwindcss` to Biome's
  `nursery/useSortedClasses`, which is a **nursery** rule and may change shape. #47 depends
  on it.
- `docs/conventions/**/*.html` is excluded: Biome rewrote the index's inline script, and
  `AGENTS.md` §9 puts that file off-limits. `docs/adr/` stays excluded too, so that a future
  Biome release gaining Markdown support cannot quietly reflow the header layout `GEN_13`
  fixes — including this file's.
- Excludes are written `**/`-anchored. A root-relative glob in an *extended* config resolves
  against the extended file's own directory, so `!apps/web/public/` in
  `packages/biome-config` silently matched nothing.
- `doc.css` had three real `noDescendingSpecificity` findings, fixed by ordering the base
  element rules ahead of the class-qualified ones.
- **`engines.node` was wrong and is now `>=24`.** `@repo/vitest-config` exports raw `.ts`,
  so loading `vitest.config.ts` needs Node's native type stripping; on Node 20 and 22 the web
  suite fails with `ERR_UNKNOWN_FILE_EXTENSION`. Turbo's cache had been serving a hit for the
  `test` task, so the suite read green on `main` for weeks. `--force` is what exposes it, and
  the pipeline runs from a clean checkout for exactly this reason (`INFRA_09` R1).
- **`INFRA_09` R3 is deviated from:** `check:types` runs every workspace rather than the
  affected set. At five workspaces it costs about 1.6 seconds. Revisit with `--affected` when
  the full run stops being instant.
- Markdown, YAML and `.gitignore`-style files now have no formatter at all. That is a
  deliberate gap, not an oversight: `GEN_12` governs the documents, and review governs the
  rest.
- **`INFRA_05` R9 is half-met.** Editor settings are committed in `.vscode/`; the pre-commit,
  commit-msg and pre-push hooks it also asks for are not, because they need a hook manager
  this repository has not chosen. Its own task.
- Tests and builds are deliberately not in CI yet. #46 adds the architecture guardrail to the
  same workflow.

Supersedes: —
Referenced by: `PROJECT.md` §4, brain `ADR-0015`, issues #44 and #46
