# 0012 — The API app tests on Bun, not Jest

Status:   accepted
Date:     2026-09-27
Deciders: naroebordin.w

## Context

`ADR 0011` moved `apps/api` onto the Bun runtime and left the test runner open, because
one record holds one decision (`GEN_13` R2).

That left the API testing on Node through Jest while shipping on Bun. The two runtimes do
not agree about TypeScript: the bug `ADR 0011` documents — Nest's decorators throwing on
`descriptor.value` — is exactly a case where Node-side tooling and Bun disagree about
decorator semantics. A suite that runs on a different runtime from production can pass
while production fails, and this repository has already met one instance of that.

`ADR 0007` split the runners by workspace on purpose: Jest for the API, Vitest for the
web. That decision is about the *web* app's runner and is untouched here.

## Decision

**`apps/api` runs its tests with `bun test`** — the runtime it ships on. `apps/web` keeps
Vitest under `ADR 0007`. The runners stay split by workspace; only the API's half changes.

## Alternatives

- **Keep Jest, accept the mismatch.** Rejected: the mismatch is the risk, and the repository
  has already produced a bug of that shape.
- **Vitest for the API too, unifying the runners.** Rejected: it does not remove the
  mismatch — Vitest would also run under Node — so it pays a migration for no safety gain.
- **Run Jest under Bun.** Rejected: possible, but it keeps five dependencies and a config
  package in order to emulate a runner Bun already provides.

## Consequences

- Five dependencies leave `apps/api`: `jest`, `ts-jest`, `@jest/globals`, `supertest` and
  `@types/supertest`, along with `jest.config.ts` and `jest.integration.config.ts`.
- **`@repo/jest-config` is now unreferenced.** Deleting a package is a structural change
  (`GEN_02` R6), so it is left in the tree and recorded here rather than removed quietly.
- Test globals come from the runtime, so `import { describe, it, expect } from '@jest/globals'`
  must go. `@nestjs/testing` works unchanged — `Test.createTestingModule().compile()` resolves.
- **`BE_12` R10 is half-met, and this is the cost of the decision.** The fast suite excludes
  `*.integration-spec.ts` correctly with `--path-ignore-patterns`. Selecting *only* the
  integration suite does not work: bun's positional filter matches paths containing `.test`,
  `.spec`, `_test_` or `_spec_`, and `*.integration-spec.ts` has a hyphen. Such files are
  collected when a directory is scanned but cannot be filtered to. The likely fix — renaming
  to `*.integration.spec.ts` — amends `BE_12` and needs its own ADR, so it is logged as
  `PROJECT.md` §5 decision 1 and `test:integration` is a stub that says so. No integration
  tests exist yet, so nothing is silently skipped.
- Cucumber still runs through `ts-node/register`, so `ts-node` and `tsconfig-paths` stay
  until the BDD wiring is revisited.

Supersedes: — *(does not supersede ADR 0007, which governs the web app's runner)*
Referenced by: `PROJECT.md` §4 and §5, `BE_12`
