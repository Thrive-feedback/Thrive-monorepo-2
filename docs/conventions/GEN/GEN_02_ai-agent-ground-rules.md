---
title: "GEN_02 · Working with AI agents — ground rules & context protocol"
id: "GEN_02"
area: "GEN"
tier: "P0"
status: "stable"
updated: "2026-08-15"
requires: [GEN_01]
see_also: [GEN_04, GEN_05, GEN_06]
---

[Conventions](../index.html) / General / GEN_02

# [General] Working with AI agents — ground rules & context protocol

`P0` · `GEN_02` · `stable` · `updated 2026-08-15`

**Open when:** you are an AI agent, or you are configuring one for this repo.

What the agent must read first, what it may change autonomously, what always needs a human, and how `AGENTS.md` / `CLAUDE.md` point at this folder instead of duplicating it.

## The rules

If you read nothing else:

1. <a id="R1"></a>Read `PROJECT.md`, then `AGENTS.md`, then build your read set from the index (`GEN_01#R1`–`#R4`) — all of it before your first edit.
2. <a id="R2"></a>Take every fact about what exists, what stage the project is at, and what is undecided from `PROJECT.md` — never from memory, from an agent-facing file, or from another agent's summary.
3. <a id="R3"></a>Keep the agent-facing files routers: they point at a convention document by id, and never restate its rule.
4. <a id="R4"></a>Write the plan before the first edit: convention ids, files you will touch, anything the task needs from the *planned* column, and what you are not doing.
5. <a id="R5"></a>Change only what the task implies; write down anything else you find, and leave it alone.
6. <a id="R6"></a>Stop and ask before adding a dependency, creating a top-level directory, restructuring `apps/` or `packages/`, changing a guardrail, acting on an open decision, or committing, pushing, or opening a pull request.
7. <a id="R7"></a>Verify with real command output — lint, test and build whatever you touched — and never report success from inspection alone.
8. <a id="R8"></a>End the task with a report: what you ran, what you skipped and why, and which `todo` entries you had to interpret.
9. <a id="R9"></a>Edit `index.html` only for the single entry of a document you just wrote, and never edit a file another agent has open.
10. <a id="R10"></a>Keep personal setup out of the repository — local overrides belong in the ignored `CLAUDE.local.md`.

## Why

An agent starts every task with no memory and a large, confident prior. Both failure modes follow from that. It fills the gap from its prior — writing code against a library nobody installed, or a pattern from some other repository — or it fills the gap from whichever file it happened to open, which is why a rule copied into an agent-facing file is worse than no rule at all: it goes stale where nobody looks. The protocol below replaces the prior with a fixed reading order and one source per kind of fact.

The second half is autonomy. An agent is fast enough to do the wrong thing thoroughly, and the conventions here are inherited, so a wrong pattern is copied into other projects rather than contained. So the boundary is drawn at reversibility: change what the task implies, stop at anything that binds the repository — a dependency, a structure, a guardrail, a commit.

## Rule detail

### [R1](#R1) Read in this order, before the first edit

The order matters, because each file decides how you read the next one. `PROJECT.md` tells you what this repository is and what it has; `AGENTS.md` tells you where the rules live and how to work; the index tells you which of them bind this change. `GEN_01` owns the read set itself — tiers, `data-paths` matching, precedence — so follow it there and do not re-derive it.

**Enforcement:** review — the ids you cite under `GEN_01#R6` are the evidence; checklist item in `GEN_06`.

### [R2](#R2) One source for project facts

Whether a library is installed, whether a decision is settled, which code is example code, what stage the project is at: all of it is in `PROJECT.md` and nowhere else. Writing code against something from the *planned* column is the most common agent failure here, and it is always the same mistake — the model knows how the library is used, so it never occurs to it to check that the library is there.

**Do**

```
Checked PROJECT.md §4: Tailwind is planned,
not installed. This task needs it — proposing
the addition instead of writing the classes.
```

**Don't**

```
<div className="flex gap-4 rounded-lg" />
// "it's a Next.js app, Tailwind is standard"
```

**Enforcement:** review — checklist item in `GEN_06`.

### [R3](#R3) Agent-facing files route; they do not rule

`AGENTS.md` is the entry point for every agent. `CLAUDE.md` and anything under `.claude/` or `.cursor/` hold only what is specific to one tool — how that tool plans, which of its features to use or avoid. None of them may carry a convention: they name the id and stop. Two copies of a rule drift, and the copy the agent reads first is the one that wins, which makes the convention document decorative. The same applies in reverse — a convention document never explains how to drive a particular tool.

**Do**

```
AGENTS.md:
  Nothing in packages/** may import from apps/**.
  → the graph and its enforcement: INFRA_03
```

**Don't**

```
AGENTS.md:
  Import rules: packages never import apps;
  apps meet through packages/api; barrel files
  only; no deep imports past exports; …
```

**Enforcement:** unenforced — nothing compares an agent-facing file against the document set. See [Open questions](#open-questions).

### [R4](#R4) Plan in writing, first

The plan is where a wrong read set becomes visible, while it is still cheap. Four things, every time: the convention ids you are working under, the files you will touch, anything the task needs from the *planned* column of `PROJECT.md`, and what you are explicitly not doing. The last one is not politeness — an unstated non-goal is how a two-file change becomes a fourteen-file change. `GEN_04` and `GEN_05` own what the plan must contain; this rule is only that there is one, in writing, first.

**Enforcement:** review — checklist item in `GEN_06`.

### [R5](#R5) Stay inside the task

You will pass code that is wrong, dead, or ugly. Note it in the report and leave it. A drive-by fix costs the reviewer the ability to read the diff as one idea, and it hides the change that was actually asked for. If the surrounding code blocks your task, say so and propose the refactor as its own change.

**Enforcement:** review — checklist item in `GEN_06`.

### [R6](#R6) Where autonomy stops

Inside your plan, act: write the code, the tests, the docs your change makes wrong. These six bind the repository beyond your change, so they need a human before, not a revert after.

| Stop before | Because |
| --- | --- |
| Adding, upgrading or removing a dependency | It is inherited by every project copied from here (`INFRA_04`). |
| Creating a top-level directory, or moving anything between `apps/` and `packages/` | The layout is a convention, not a preference (`INFRA_01`). |
| Changing, waiving or disabling a guardrail — lint rule, type, architecture test, CI gate | Never weakened to make a change pass (`GEN_01#R10`). |
| Anything that turns on an open decision in `PROJECT.md` §5 | Settling it silently is how it stops being visible. |
| Committing, pushing, or opening a pull request | Publishing is the human's call (`INFRA_08`, `GEN_06`). |
| Deleting a file you were not asked to delete | Nothing in the diff explains why it is gone. |

**Enforcement:** review — checklist item in `GEN_06`.

### [R7](#R7) Verify by running, not by reading

Run the lint, test and build tasks for the workspaces you touched, and quote what came back. `INFRA_02` owns the task names. "The types look right" is not a result. If a command fails and you cannot fix it inside your scope, report the failure — a red build handed over honestly is worth more than a green claim.

**Enforcement:** review — checklist item in `GEN_06`.

### [R8](#R8) Report what you did, skipped and assumed

The report is what the reviewer reads first, and the only place the invisible parts of the task appear: the commands you ran, the parts of the request you did not finish and why, and the `todo` entries whose summary you had to interpret (`GEN_01#R5`). An interpretation you name is a question for the reviewer. An interpretation you do not name is a convention you just invented on the project's behalf.

**Enforcement:** review — checklist item in `GEN_06`.

### [R9](#R9) One agent, one task, one index entry

`index.html` is the shared file every document author touches. Edit exactly the entry of the document you just wrote — its status and its date — and nothing else on the page. [GEN_12](../index.html#GEN_12) owns the rest of that contract. Do not edit a file another agent is working in, and do not hand a subagent a task you can do yourself: it starts cold and tends to miss the index entirely.

**Enforcement:** review — checklist item in `GEN_06`. The index self-check catches dangling ids, tier inversions and filename drift, but only when the page is opened.

### [R10](#R10) Personal setup stays out of the repository

Local overrides, model settings and personal workflow notes go in `CLAUDE.local.md`, which `.gitignore` keeps untracked. Anything committed under an agent-facing path is read by every agent on every project copied from here, so it has to be true for all of them. A local file may override how you work; it may not override a convention.

**Enforcement:** review — checklist item in `GEN_06`.

## Worked example

The task: *"cache the profile-lookup query in the API app, it is hit on every page load."* The protocol resolves it before any code is written.

1. **R1** — `PROJECT.md`, then `AGENTS.md`, then the read set. The change touches `apps/api/src/**`, so the BE entry path and `GEN_07` come in by `GEN_01#R4`.
2. **R2** — the stack table decides whether a cache exists. Where Redis is in the *planned* column, the task as phrased cannot be done.
3. **R6** — a cache is a dependency and a backing service. Stop, propose, do not install.
4. **R5** — the module you are reading may be listed in `PROJECT.md` §3 as example code. Note it; do not delete or extend it on your own initiative.
5. **R4**, **R8** — the plan, then the report.

**Do — the plan, before any edit**

```
Conventions: GEN_01, GEN_02, GEN_04, GEN_07, BE_01, BE_02
Files:       none yet — blocked
Needs from PROJECT.md "planned": Redis + a cache module
Proposal:    add @nestjs/cache-manager over Redis, compose
             service for local. Needs a human (GEN_02#R6) and
             an ADR (GEN_13) — it is expensive to reverse.
Not doing:   installing anything, touching the query, or
             hand-rolling an in-memory Map as a stand-in.
```

**Don't**

```
import Redis from "ioredis"; // added to package.json
const cache = new Redis(process.env.REDIS_URL!);
// "unblocked myself, it's a small dependency"
```

The hand-rolled `Map` is the tempting version, and it is the same violation wearing a smaller hat: it settles the caching decision where nobody will look for it, with no dependency to make the choice visible.

## Checklist

- `PROJECT.md` and `AGENTS.md` read before the first edit, read set built from the index ([R1](#R1)).
- Every claim about what exists traced to `PROJECT.md` ([R2](#R2)).
- No convention restated in an agent-facing file; ids only ([R3](#R3)).
- Plan written first, with ids, files, *planned*-column needs, and non-goals ([R4](#R4)).
- Diff contains nothing the task did not imply ([R5](#R5)).
- No dependency, structure change, guardrail change, open decision, or commit without a human ([R6](#R6)).
- Lint, test and build run for what was touched, output quoted ([R7](#R7)).
- Report states what ran, what was skipped, and which `todo` entries were interpreted ([R8](#R8)).
- At most one index entry touched; no file another agent has open ([R9](#R9)).
- No personal setup committed ([R10](#R10)).

## Open questions

- [R3](#R3) is `unenforced`. Candidate guardrail for `INFRA_06`: a check that every convention-shaped statement in an agent-facing file carries a document id, and that ids it cites exist in the index.
- The tool-specific agent files are a set that grows per tool. Whether each new one gets its own routing file, or they all share `AGENTS.md` with one thin per-tool file, should be settled before the second tool is added — an ADR (`GEN_13`).
- [R6](#R6) stops at "ask a human". Which human, and what a stop looks like when an agent runs unattended on a schedule, is undefined here.

## Related

Requires [GEN_01](../index.html#GEN_01). See also [GEN_04](../index.html#GEN_04), [GEN_05](../index.html#GEN_05), [GEN_06](../index.html#GEN_06).

---

[← All conventions](../index.html)
