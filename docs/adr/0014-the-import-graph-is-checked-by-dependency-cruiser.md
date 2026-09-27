# 0014 — The import graph is checked by dependency-cruiser, and each rule ships with a failing example

Status:   accepted
Date:     2026-09-27
Deciders: naroebordin.w

## Context

`INFRA_06` R4 calls the import graph the highest-value guardrail target and lists four rows:
layer direction, module and package boundaries, cycles, and per-directory allow-lists. Its own
enforcement line read *"unenforced — this is the queue, not a description of what runs today."*

Something already existed: `apps/api/scripts/check-architecture.mjs`, about 125 lines of regex
over `apps/api/src`, enforcing `BE_01` R6/R9, `BE_02` R1/R2/R3, `BE_03` R4 and `BE_09` R5.
Those documents already claimed `automated` and named it. **It ran nowhere except a laptop** —
there was no CI until ADR 0013 — and it was broken on the Node this machine has: it imports
`globSync` from `node:fs`, which needs Node 22, and the script ran under `node`.

What the script cannot do is the part `INFRA_06` R4 values most. Cycles need the whole graph.
Reaching past a package's entry point needs real module resolution, because `@repo/ui/button`
is legitimate — `packages/ui` declares `"./*"` in its export map — while
`../../packages/ui/src/button` is the same file reached illegitimately. Telling those apart by
regex means reimplementing `exports` resolution.

## Decision

**dependency-cruiser owns the graph-level rules; the existing script keeps its specifier-level
rules.** Nine rules run as one required *Architecture* check: cycles, app↔app and package→app
direction, two rules for reaching into a package by path, unresolvable specifiers, and three
for `FE_01` R5's ladder.

**Every rule ships with a fixture that fails it, and that requirement is itself mechanical.**
`scripts/verify-arch-fixtures.mjs` cruises each fixture and asserts it trips its own rule, and
fails when a rule has no fixture or a fixture has no rule. `INFRA_06` R8 asks for an example
"so the check is proven to work rather than assumed"; a prose requirement would have decayed
on the first rule added in a hurry.

Each fixture is a miniature repository — `apps/…`, `packages/…` — cruised with its own
directory as the working directory, so its paths match rules anchored at `^apps/` without
putting deliberately broken files in the real tree.

**Both run under Bun**, so `bun run check:arch` behaves the same in CI and on a laptop whatever
Node happens to be on `PATH` (`INFRA_09` R6).

## Alternatives

- **Extend the existing script instead of adding a tool.** Rejected: cross-workspace cycle
  detection and honest deep-import detection mean hand-writing `exports`-map resolution — the
  most error-prone code in the repository, where a false negative is silent.
- **Biome's `noPrivateImports` and `noRestrictedImports` only.** Rejected: no cycle detection,
  and cycles are one of the three checks #46 names.
- **`eslint-plugin-boundaries`.** Rejected: ESLint was removed in ADR 0013.
- **Replace the script with dependency-cruiser entirely.** Rejected: its rules are about
  filenames and role suffixes, which are not graph properties. Two tools, two jobs, no overlap.

## Consequences

- `apps/api`'s `check-arch` runs on Bun rather than Node. It had been failing on Node 20 for
  anyone who ran it; now it runs on the runtime the app ships on (ADR 0011).
- Enforcement lines change in four documents (`INFRA_06` R10): `INFRA_03` R1 to `automated`,
  R3/R5 and R4 to `partly automated`; `INFRA_01` R5 to `partly automated` and R6 to
  `automated`; `FE_01` R5 to `partly automated`; and `INFRA_06` R4 itself. Four open-question
  bullets that said nothing was checked are rewritten.
- `BE_03` R4 is enforced by the script but has no rule-detail section, so it has no enforcement
  line to update. Noted rather than invented.
- **The private-folder rules match routes one segment deep.** `app/orders/_components/` is
  covered, `app/orders/detail/_components/` is not, because the path alone does not say where a
  route ends. Recorded in `FE_01`'s open questions rather than hidden behind a rule that looks
  complete.
- The entry-point rule keys on dependency type: a path-based reach is `local` and fails, while a
  specifier the export map declares resolves and passes. A specifier the map *refuses* does not
  resolve at all, which `not-unresolvable` reports — so the two rules together cover the
  boundary without reimplementing resolution.
- Per-directory allow-lists (`INFRA_06` R4's fourth row, `FE_02`, `BE_02`) remain unenforced.
  They were out of scope for #46 and need a vocabulary per stack rather than one graph query.
- `check:arch` joins `bun run check`, so the local gate is style, types, then architecture.

Supersedes: —
Referenced by: `PROJECT.md` §4, `INFRA_01`, `INFRA_03`, `INFRA_06`, `FE_01`, issue #46
