---
title: "GEN_03 · Starting a new project from this boilerplate"
id: "GEN_03"
area: "GEN"
tier: "P0"
status: "stable"
updated: "2026-08-15"
requires: [GEN_01]
see_also: [INFRA_01, INFRA_02]
---

[Conventions](../index.html) / General / GEN_03

# [General] Starting a new project from this boilerplate

`P0` · `GEN_03` · `stable` · `updated 2026-08-15`

**Open when:** you have just cloned this repo to start a new project.

Rewriting `PROJECT.md` — the one file that states what this repository is — then what to rename, what example code to delete, which convention statuses to reset, and the rest of the day-one checklist.

## The rules

If you read nothing else:

1. <a id="R1"></a>Initialize before you build. The first commit of the new project contains this procedure and nothing else.
2. <a id="R2"></a>Rewrite `PROJECT.md` sections 1–5 first — every other step reads from it.
3. <a id="R3"></a>Record where you came from: the upstream repository and the exact commit you copied.
4. <a id="R4"></a>Rename everything that names the project. Leave everything that names the structure.
5. <a id="R5"></a>Delete every path listed in `PROJECT.md` §3, then make both apps boot without them.
6. <a id="R6"></a>Install the planned stack you actually need now, and move each row to *present* as you do.
7. <a id="R7"></a>Carry the convention documents over unchanged, statuses included. Empty only the ones that hold project content.
8. <a id="R8"></a>Answer every open decision in `PROJECT.md` §5, or re-inherit it deliberately, before the first feature.
9. <a id="R9"></a>Prove it: install, lint, test and build must all pass before you commit.
10. <a id="R10"></a>Send convention improvements back upstream. Keep project changes local.

## Why

A copy of this repository inherits two things that are not the same: a set of conventions meant to travel, and one specific repository's circumstances — its name, its example code, its unfinished decisions. Day one is where you separate them. Skip it and the documents describe a repository you no longer have, which is worse than having no documents at all, because agents act on them without doubting them.

The cost is asymmetric. A leftover example module is a nuisance you notice within the hour. A `PROJECT.md` that still describes the repository you copied from misleads every agent on every task, silently, for as long as it stays wrong.

## Rule detail

### [R2](#R2) Rewrite `PROJECT.md` first

It is the only file that states what this repository is, so it is the only file the rest of this procedure reads from. Sections 1–5 are replaced wholesale, not edited around — they describe the repository you copied, not yours. Section 6 stays as written; it is the rule that keeps the file honest.

**Do**

```
| **Kind**  | `product` |
| **Stage** | pre-launch; no users, staging only |

## 3. Code that ships as example, not as product
None. Removed at initialization.
```

**Don't**

```
| **Kind**  | `boilerplate` |
| **Stage** | skeleton; no users, no CI |

(left as-is — "we'll update it once
 the project is real")
```

**Enforcement:** review — nothing detects a stale fact sheet. See [Open questions](#open-questions).

### [R3](#R3) Record the upstream and the commit you copied

[R10](#R10) depends on this. Without a remote and a commit you cannot tell which conventions you inherited, which you have since changed, or what a later upstream improvement would conflict with. Put the commit in `PROJECT.md` §1; keep the remote in git.

```
git remote add boilerplate <upstream-url>
git fetch boilerplate
git rev-parse boilerplate/main   # record this sha as Upstream in PROJECT.md §1
```

**Enforcement:** unenforced — nothing checks that the remote exists.

### [R4](#R4) Rename the project, not the structure

Two kinds of name live in this repository. One identifies the project — the root `package.json` name, the README title, the repository URL. That one is yours to change. The other identifies structure — the `@repo/*` workspace scope, the `api` and `web` app names, the directory layout. That one is a convention (`INFRA_01`), and renaming it costs you every future upstream merge for no benefit. Rename the scope only if you intend to publish the packages.

Note the old name before you rewrite `PROJECT.md` §1, then find every occurrence:

```
grep -rn "<old-project-name>" --exclude-dir=node_modules --exclude-dir=.git .
```

**Enforcement:** unenforced — a grep for the upstream name is a candidate guardrail for `INFRA_06`.

### [R5](#R5) Delete the example code, then make it boot

`PROJECT.md` §3 lists every path that ships as demonstration rather than product. Delete all of them — do not keep one "as a reference", because the next person cannot tell a reference from a pattern. Deleting a module breaks whatever registered it, so finish the job: the API app must start with an empty module list and the web app must render its own landing page.

**Enforcement:** review, then [R9](#R9) — a broken boot fails the build.

### [R7](#R7) Conventions carry over; project content resets

The conventions are the reason you copied this repository. They arrive as they are, with their `data-status` untouched — a `stable` document does not become `todo` because the project is new, and rewriting one to describe your domain is how the set stops being portable. What resets is the content that was always project-shaped: the glossary in `GEN_14` ships empty and your first feature fills it, and any ADR recording a decision you are not adopting is superseded rather than deleted (`GEN_13`).

**Enforcement:** review — checklist item in `GEN_06`.

### [R10](#R10) Improvements go up; circumstances stay down

You will improve a convention while building something real — that is where the good ones come from. Send it back to the upstream repository as its own pull request, touching only `docs/conventions/`. It stays cherry-pickable exactly as long as it contains no project facts, which is why they live in `PROJECT.md` and nowhere else. `PROJECT.md` itself never travels in either direction.

**Enforcement:** unenforced — see [Open questions](#open-questions) for the missing mechanism.

## Worked example

You are starting a product called *atlas*. The whole initialization is one commit.

```
git clone <boilerplate-url> atlas && cd atlas
git remote rename origin boilerplate          # R3 — keep the source reachable
git remote add origin <new-repo-url>
git rev-parse boilerplate/main                # → 9f2c1ab, record it

# R2 — rewrite PROJECT.md §1–5: name atlas, kind product, stage pre-launch,
#      §3 emptied, §4 rows for what you install, §5 answered or re-inherited

# R4 — the project name, not the structure
grep -rn "my-fullstack-bp\|my-turborepo" --exclude-dir=node_modules --exclude-dir=.git .

# R5 — every path PROJECT.md §3 listed, then fix the module registration
rm -rf apps/api/src/<example-module> packages/api/src/<example-module>

bun install && bun run lint && bun run test && bun run build   # R9
git add -A && git commit -m "chore: initialize atlas from boilerplate@9f2c1ab"
```

The commit message carries the upstream sha, so a year later you can diff your conventions against the ones you actually inherited. An agent may prepare every step above, but the commit itself is the human's — `GEN_02#R6`.

## Checklist

- Initialization is its own commit, with no feature work in it ([R1](#R1)).
- `PROJECT.md` §1–5 rewritten; nothing in it describes the upstream repository ([R2](#R2)).
- Upstream remote added and its commit recorded in `PROJECT.md` §1 ([R3](#R3)).
- Project name replaced everywhere; structural names untouched ([R4](#R4)).
- Every path from `PROJECT.md` §3 deleted, and both apps still boot ([R5](#R5)).
- Stack rows you installed moved to *present* ([R6](#R6)).
- Convention statuses untouched; only project-shaped content reset ([R7](#R7)).
- Every open decision answered or re-inherited on purpose ([R8](#R8)).
- Install, lint, test and build all pass ([R9](#R9)).
- Upstream pull request path understood before the first convention edit ([R10](#R10)).

## Open questions

- Every rule here is a one-time mechanical step, which makes this the strongest candidate in the set for a script — `bun run project:init` could prompt for the name, rewrite `PROJECT.md`, delete the §3 paths, set the remote and run [R9](#R9). Until it exists, most of this document is `unenforced`.
- [R10](#R10) names no mechanism. Cherry-pick, `git subtree` and a published conventions package all work and have different costs. Needs an ADR (`GEN_13`).
- Whether a derived project keeps this document at all. It is `P0` and unusable after day one; marking it `deprecated` downstream would free a P0 slot, but then re-cloning has no procedure.
- [R7](#R7) assumes convention documents contain no project facts. That holds only while [GEN_12#R6](../index.html#GEN_12) is followed; nothing checks it today.

## Related

Requires [GEN_01](GEN_01_how-to-use-these-conventions.md). See also [INFRA_01](../index.html#INFRA_01), [INFRA_02](../index.html#INFRA_02).

---

[← All conventions](../index.html)
