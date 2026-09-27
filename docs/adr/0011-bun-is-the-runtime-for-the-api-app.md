# 0011 — Bun is the runtime for the API app; the web app stays on Node

Status:   accepted
Date:     2026-09-27
Deciders: naroebordin.w

## Context

`INFRA_04` is titled *"Bun runtime & dependency management"* and its summary describes
*"Bun as runtime and package manager … and the per-workspace runtime override for the cases
that still need Node."* Its R10 treats Node as the exception.

The repository did the reverse. Bun installed packages; Node ran everything —
`start:prod` is `node dist/main`, the HTTP adapter is `@nestjs/platform-express`, `engines`
names Node, and the tests are Jest. No workspace declared an override, because the
exception was the default.

Notably, `INFRA_04`'s **Why** section never argues for Bun as a runtime. All ten of its
rules are package-manager rules — lockfiles, frozen installs, install-script allow-lists,
one version per dependency. Bun appears seventeen times across all eighty-two convention
documents and every occurrence is package-manager usage. Nothing was load-bearing on the
runtime claim, so the repository and the document could be reconciled in either direction.

## Decision

**Bun is the runtime for `apps/api`. `apps/web` runs on Node**, declared as a
per-workspace override with its reason, exactly as `INFRA_04` R10 describes. Bun remains
the package manager for the whole repository.

The web app is not a temporary exception: Next.js does not support Bun as a production
runtime, so this override has no removal condition today.

## Alternatives

- **Node everywhere; correct `INFRA_04` instead.** The recommendation put to the decider,
  and rejected by them after their own research. Node is the blessed path for NestJS, has
  the most trodden deployment story, and — the argument that carries most weight for an
  AI-assisted codebase — far more training data behind it. What lost it: Bun natively
  executes TypeScript and ships a test runner, which removes `ts-node`, `ts-loader`,
  `tsconfig-paths` and `ts-jest` from the dependency list.

- **Bun everywhere, including the web app.** Not available. Next.js requires Node in
  production.

- **Node with `tsx` and Vitest for the API.** Most of the toolchain saving without leaving
  the supported path. Rejected: it trades one set of tools for another rather than removing
  a layer, and it splits the API and web test runners for no reason beyond habit.

## Consequences

- **A measured blocker, and its fix.** NestJS fails immediately under Bun with
  `TypeError: undefined is not an object (evaluating 'descriptor.value')`, thrown from
  `@nestjs/common`'s route decorators. Bun applies TC39 Stage 3 decorators, whose method
  decorators receive `(value, context)` rather than `(target, key, descriptor)`. The cause
  is narrower than it appears: **Bun does not resolve `experimentalDecorators` and
  `emitDecoratorMetadata` through a tsconfig `extends` into a workspace package.** `tsc`
  does, which is why it works on Node and not on Bun.

  Both flags must therefore be declared in `apps/api/tsconfig.json` itself. With that,
  `design:paramtypes` is emitted, DI resolves constructor dependencies by type with no
  `@Inject()`, and the suite runs. Verified against the reference implementation's
  `TodoListController` before that code was deleted.

- **This is a documented exception to `INFRA_03`'s shared-config pattern.**
  `@repo/typescript-config` exists so workspaces do not repeat compiler options; under Bun,
  two options must be repeated or nothing boots. The duplication is required, not sloppy,
  and deleting it as tidy-up will break the app.

- **`INFRA_04` is now accurate as written** for the first time, including R10 — which no
  longer describes a hypothetical.

- **Two runtimes in one repository**, so a change can pass in one workspace and fail in the
  other. The decorator behaviour above is precisely that class of bug.

- **The API's test runner is left open by this record.** `PROJECT.md` §4 has Jest for the
  API; `bun test` ran the same suite in 241ms with no configuration and would remove five
  more dependencies. Testing on Node while shipping on Bun is a runtime mismatch of the
  kind that produced the bug above. One decision per record (`GEN_13` R2) — this needs its
  own ADR.

- Deployment targets must be checked for Bun support before `PROJECT.md` §5 decision 5 is
  settled.

Supersedes: —
Referenced by: `PROJECT.md` §4, `INFRA_04`, `apps/api/tsconfig.json`
