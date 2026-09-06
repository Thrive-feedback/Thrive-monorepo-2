# my-fullstack-bp

**A boilerplate: a starter for a Next.js + NestJS monorepo that ships with a complete
written convention set, built to be read by AI coding agents as much as by people.**

It exists to be copied, not shipped. Clone it, strip the example code, and you start a
real project with the architecture, the layering rules, the testing strategy and the
review standard already decided and written down — so the first feature is built the way
the tenth one will be, whether a person or an agent writes it.

What comes with it:

- **The monorepo** — Turborepo and Bun, a NestJS API app, a Next.js web app, and shared
  packages for types, UI and tooling configuration.
- **The convention set** — `docs/conventions/`, indexed and tiered, covering both stacks
  plus the repository itself. This is the part that makes it a boilerplate rather than a
  template.
- **The agent routing** — `AGENTS.md` and `CLAUDE.md` tell any coding agent what to read
  before it edits, so it works to the same rules a reviewer will apply.
- **The decision trail** — `docs/adr/` records what was decided and what was rejected, so
  a convention can be argued with instead of guessed at.

> **What this repository _is right now_** — its stage, which parts of the stack are
> installed versus planned, which code is example-only, and which decisions are still
> open — is stated in **[`PROJECT.md`](PROJECT.md)** and nowhere else. Read it before
> assuming anything about the stack. Every other document here states rules and
> conditions; `PROJECT.md` supplies the facts those conditions are checked against.

## Start here

| You are                       | Read                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| New to the repository         | [`PROJECT.md`](PROJECT.md), then [`AGENTS.md`](AGENTS.md)                                  |
| About to write code           | [`docs/conventions/index.html`](docs/conventions/index.html) — build your read set from it |
| An AI agent                   | [`AGENTS.md`](AGENTS.md) (and [`CLAUDE.md`](CLAUDE.md) for Claude Code specifics)          |
| Writing a convention document | `GEN_12` — the authoring contract                                                          |
| Reversing a decision          | [`docs/adr/`](docs/adr) — architecture decision records                                    |

## Getting started

Bun is the package manager and Turborepo runs every task. The pinned versions are in
`package.json`.

```bash
bun install
bun run dev
```

The full command list — build, test, lint, format, and how to scope a task to one
workspace — is in [`AGENTS.md`](AGENTS.md) §4. Do not add a script to a workspace
without adding the matching task to `turbo.json`.

## Layout

```
apps/          deployables — the API app and the web app
packages/      libraries and shared configuration, consumed by import
docs/
  conventions/ the convention set: index.html + the documents
  adr/         architecture decision records
```

[`AGENTS.md`](AGENTS.md) §3 holds the authoritative map with each workspace's role;
`INFRA_01` holds the rules that govern it. If the map and the repository disagree, the
repository is right — fix the map in the same change.

## Built for AI agents

The convention set is written so an agent can build a correct read set without being told
what to read. That is the difference between a template and this: an agent pointed at
`AGENTS.md` finds the routing table, works out which documents bind its task, and applies
the same rules a human reviewer would.

- **Rules are extractable.** Every document opens with at most ten numbered, imperative
  rules carrying stable ids, so an agent can act on the contract without consuming the
  prose around it.
- **Every rule states its enforcement** — `automated`, `partly automated`, `review` or
  `unenforced` — so nobody trusts a guardrail that does not exist.
- **Facts are separated from rules.** Conventions never assert what is installed; they
  state conditions and point at `PROJECT.md`. That is what stops an agent writing code
  against a library this project does not have.
- **A `todo` entry is still binding.** Where a document has not been written, its index
  entry is the rule, and an agent is expected to say which ones it had to interpret.

## The conventions

`docs/conventions/index.html` is the routing table for everything else. Open it in a
browser: it filters by area, validates its own entries, and links each document.

- **Areas** — `GEN` (both stacks), `FE`, `BE`, `INFRA`.
- **Tiers** — `P0` binds every change in any area; `P1` is the entry path for an area
  you are working in; `P2` opens when its trigger matches; `P3` waits until the project
  scales. `GEN_01` explains what each tier obliges you to read.
- **Status** — each entry carries its own `data-status` (`todo`, `draft`, `stable`,
  `deprecated`). While an entry is `todo` its document does not exist and the index
  entry itself is the binding text.

Cite the convention ids you relied on in your plan and in the pull request description.

### Changing a convention

Change the document, never the code that works around it (`GEN_01#R10`). A change that
reverses a decision or edits a lower-numbered document also gets an ADR (`GEN_13`).
Convention improvements are meant to travel back upstream; project-specific changes stay
local (`GEN_03#R10`).

## Hard rules

These need no document and have no exceptions. The full list is in
[`AGENTS.md`](AGENTS.md) §6; the ones people break first:

- No secret, token or credential in source, in a commit, or in a URL.
- No `.env` committed — `.env.example` is the only one in git.
- Never weaken a guardrail — lint rule, type, architecture test, CI gate — to make a
  change pass. Fix the change, or raise the rule for discussion.
- Never disable a test to make a build green.

## Using this as a boilerplate

`GEN_03` is the full checklist and it is worth reading before you start. The shape of it:

1. **Copy it, and record where from.** Take a copy — a template, a fork, or a clone with a
   new remote — and write down the upstream repository and the exact commit you copied.
   That reference is what lets you pull convention improvements later.
2. **Rewrite `PROJECT.md` sections 1–5 first.** Every other step reads from it: the
   identity, the stage, the stack table, the example-code list, and the open decisions.
   Do this before touching code, or the conventions are being checked against the wrong
   facts.
3. **Rename what identifies the project; leave what identifies the structure.** The
   repository name, the root manifest name and this README are yours. The `@repo/*`
   workspace scope, the `api` and `web` app names and the directory layout are convention
   (`INFRA_01`) — renaming them costs you every future upstream merge and buys nothing.
4. **Delete the example code.** `PROJECT.md` §3 lists exactly which paths ship as
   examples. Delete them, then make both apps boot without them.
5. **Install the planned stack you actually need.** `PROJECT.md` §4 marks each row
   _present_ or _planned_. Install what this project needs now and move its row to
   _present_ in the same change — never write code against a _planned_ row.
6. **Answer the open decisions.** `PROJECT.md` §5 lists the load-bearing ones that are
   unresolved. Settle each, record an ADR (`GEN_13`), and delete the row — or re-inherit
   it deliberately. Do this before the first feature.
7. **Carry the conventions over unchanged**, statuses included, and empty only the ones
   that hold project content. A convention you disagree with is changed in the open, not
   quietly dropped.
8. **Prove it.** Install, lint, test and build must all pass before the first commit.

Then point your agent at `AGENTS.md` and start building.

**Improvements to a convention are meant to travel back upstream; changes that are only
true for your project stay local** (`GEN_03#R10`). That is the whole arrangement: the
convention set gets better every time it is used, and no project inherits another's
circumstances.
