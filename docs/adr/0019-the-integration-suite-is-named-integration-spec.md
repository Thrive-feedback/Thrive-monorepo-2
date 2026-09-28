# 0019 — The integration suite is named `*.integration.spec.ts`

Status:   accepted
Date:     2026-09-28
Deciders: naroebordin.w

## Context

`BE_12#R10` requires the integration suite to be separately named *and*
separately runnable from the fast suite. The second half was unmet, and the
reason recorded in `PROJECT.md` §5 was wrong in a way that mattered.

The recorded reason was that `*.integration-spec.ts` files are collected when
`bun test` scans a directory but cannot be picked out by its positional filter.
Measured on bun 1.3.14, they are not collected at all. Bun says so itself when
one is named directly:

```
note: Tests need ".test", "_test_", ".spec" or "_spec_" in the filename
```

A hyphen before `spec` is none of those. Three consequences follow, and the
third is the expensive one:

- The fast suite's `--path-ignore-patterns='**/*.integration-spec.ts'` excludes
  files bun would never have run. It is a no-op.
- `test:integration` could not select them, which is what was already known.
- **An integration test written under the documented name would never run, in
  any suite, and nothing would say so.** It would sit in the repository looking
  like coverage.

No integration test exists yet, so nothing is currently being skipped. That is
what makes now the cheap moment.

## Decision

Integration tests are named `*.integration.spec.ts`.

- The fast suite excludes them by path: `--path-ignore-patterns='**/*.integration.spec.ts'`,
  which now actually excludes something.
- The integration suite selects them by filter: `bun test integration.spec`.
- `test:integration` stops being a stub that explains itself and becomes the
  real command.

`BE_12`'s document is unchanged: it says "separately named" and "the integration
file-name pattern" throughout and never fixes the literal suffix. What changes
is the `data-paths` glob on its index entry, which did name the old pattern and
would otherwise route file-matching to a name nothing will ever carry.

## Alternatives

- **`*.integration.test.ts`.** Equivalent to bun. Rejected only for consistency:
  every existing test file in this repository ends `.spec.ts`.
- **Keep the name, select the suite by directory instead.** Rejected: it would
  work, but it does not fix the real defect — a file under the old name is still
  invisible to the fast suite's scan, so the trap survives the workaround.
- **Keep the name and pass explicit paths to `bun test`.** Rejected: the shell
  expands the glob, so the command fails when no file matches and has to be
  maintained as the suite grows.

## Consequences

- `BE_12#R10` is met in both halves, and the enforcement line it claims — the
  unit runner ignoring the pattern — is true for the first time.
- `bun test <filter>` exits **1** when the filter matches no file, so
  `test:integration` is red until the first integration test is written. That is
  the right way round — the web suite's `--passWithNoTests` has the opposite
  failure, where a broken glob passes silently. Nothing runs this script
  automatically: it is not in the pull request workflow and not in `bun run test`.
  The message bun prints is its generic one about test file names rather than
  "no integration tests yet", which is worth knowing before someone debugs it.
- Bun's positional arguments are an OR, not an AND: `bun test src integration.spec`
  runs everything matching *either*, which is every file under `src`. The fast
  suite keeps its single `src` positional and does its exclusion with
  `--path-ignore-patterns`.
- Nothing is renamed on disk — no integration test has been written yet.

Supersedes: —
Referenced by: BE_12, PROJECT.md §4
