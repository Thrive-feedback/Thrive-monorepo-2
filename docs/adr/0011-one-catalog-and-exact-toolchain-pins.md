# 0011 — One dependency catalog, and exact pins for the toolchain

Status:   accepted
Date:     2026-09-28
Deciders: kritpavin

## Context

`INFRA_04#R5` says to declare one version per dependency for the whole
repository and to pin exactly anything that shapes a build. The promotion
review found the repository breaking both halves:

- TypeScript was `5.5.4` in the API app, `5.8.2` in four workspaces, and `^5.8.2`
  in two more, which resolved to `5.9.3`. Three compilers built one repository.
- ESLint was `^9.31.0` in three workspaces and `^9.39.2` in two.
- Prettier, Turbo, Jest and Vitest carried caret ranges, so a patch release could
  reformat the tree or fail a pipeline nobody touched.
- Internal workspaces were referenced as `"*"`, a semver range, which `INFRA_03#R8`
  forbids.

The draft also showed the catalog in pnpm syntax, which Bun ignores without an
error.

## Decision

- The root `package.json` declares `workspaces.catalog`. Every dependency used by
  more than one workspace is declared there once, and each workspace references it
  as `"catalog:"`.
- Build-shaping tools are pinned exactly, at the versions already installed:
  `typescript` `5.8.2`, `eslint` `9.39.5`, `prettier` `3.9.6`,
  `prettier-plugin-tailwindcss` `0.6.14`, `turbo` `2.10.9`, `jest` `30.4.2`,
  `vitest` `3.2.7`, `next` `16.3.0`. Libraries keep a caret range, because the
  lockfile already fixes what is installed.
- Internal workspaces are referenced as `"workspace:*"`.

## Alternatives

- **Pin exactly in every manifest, without a catalog.** Rejected: drift is still
  expressible, and an upgrade is an edit in seven files that someone will
  eventually miss.
- **Catalog everything, including single-workspace dependencies.** Rejected for
  now: it adds indirection for no drift risk. A dependency moves into the catalog
  when a second workspace adopts it.
- **Leave the API app on TypeScript 5.5.4.** Rejected: there was no recorded
  reason. The API builds and passes every suite on 5.8.2.

## Consequences

- An upgrade of a shared dependency is one edit in the root manifest.
- `@nestjs/cli` still installs its own private TypeScript `5.9.3`. It is that
  tool's dependency, not the compiler any workspace builds with.
- Single-workspace build tools (`ts-jest`, `@tailwindcss/postcss` and the like)
  still carry ranges. Pinning them is the obvious next step for `INFRA_04#R5`,
  and is left out of this change to keep it reviewable.

Supersedes: —
Referenced by: INFRA_04, INFRA_03
