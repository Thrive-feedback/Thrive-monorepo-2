# `@repo/biome-config`

The repository's single Biome configuration. `INFRA_05` R4: every workspace extends this
package and none forks it; `INFRA_05` R5: a rule is on for everyone or off for everyone,
so nothing here is switched off per workspace.

- `./base` — formatter, linter and assist settings for every file type in the repository.

The root `biome.json` extends this file and adds path-scoped `overrides` for the framework
domains a workspace needs (Next.js and React under `apps/web`, the test domain under
`apps/api`). Those overrides only *add* rules. Disabling a shared rule for one workspace is
the thing `INFRA_05` R5 forbids, so it is not done here.

**Why the excludes in `files.includes` are what they are.** Generated files are build
output — committed, never edited (`GEN_08` R4) — and formatting them produces a diff the
next generation discards. `docs/adr/` is excluded because `GEN_13` fixes the ADR header
layout, and a formatter normalises those aligned runs of spaces away. The conventions'
`index.html` is excluded because `AGENTS.md` §9 puts it off-limits and Biome rewrites its
inline script.

Write every exclude **`**/`-anchored**. A root-relative glob here resolves against *this*
directory, not the repository root, so `!apps/web/public/` silently matches nothing.

**Markdown has no formatter** (ADR 0013). Biome 2.5 cannot format it, and Prettier was
removed rather than kept for it: the documents were never formatter-governed and `GEN_12`
already fixes their structure and length budget.
