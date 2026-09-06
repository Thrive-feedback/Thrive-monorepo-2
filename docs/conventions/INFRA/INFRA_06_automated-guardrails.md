---
title: "INFRA_06 · Automated guardrails — lint, types & architecture tests"
id: "INFRA_06"
area: "INFRA"
tier: "P1"
status: "draft"
updated: "2026-08-31"
requires: [INFRA_05]
see_also: [INFRA_09, BE_02, FE_02]
---

[Conventions](../index.html) / Infrastructure / INFRA_06

# [Infra] Automated guardrails — lint, types & architecture tests

`P1` · `INFRA_06` · `draft` · `updated 2026-08-31`

**Open when:** a convention needs teeth, or a guardrail is failing and you are tempted to disable it.

The conventions a machine enforces for both stacks: layer and import-boundary tests that fail CI on an architecture violation, atomic-level rules on the frontend, strict type-checking, and how to add a new guardrail rather than a new paragraph.

## The rules

If you read nothing else:

1. <a id="R1"></a>A convention that can be checked mechanically is checked. Prose is what is left over.
2. <a id="R2"></a>Every guardrail names the document and rule it enforces.
3. <a id="R3"></a>A guardrail fails the build. A warning nobody must act on is not a guardrail.
4. <a id="R4"></a>Check the import graph in both stacks: layer direction, module and package boundaries, cycles, deep imports.
5. <a id="R5"></a>Type-check at the strictest setting the code sustains. The compiler is the cheapest guardrail you own.
6. <a id="R6"></a>Never disable a guardrail, narrow its scope, or add an exclusion to make a change pass.
7. <a id="R7"></a>A waiver names its reason and its owner, and appears in the pull request.
8. <a id="R8"></a>A new guardrail lands with the rule it enforces, an example that fails it, and the fixes it demands.
9. <a id="R9"></a>Keep guardrails fast enough to run before a push; run the slow ones once per pipeline.
10. <a id="R10"></a>When a rule graduates to a guardrail, update the enforcement line in the document it came from.

## Why

Every rule in this set ends with an enforcement line, and a line that says `review` is the weakest state available: it catches a violation when someone notices, who has read the document, on a day they have time. A convention enforced by a machine is caught every time, immediately, by the person who can fix it cheapest — and stops being something anyone must remember.

That is the trade this document makes. A rule expressed as a check is worth more than the same rule as a paragraph, because the paragraph competes with every other paragraph. The corollary is deliberate: when a convention *can* be checked and is not, that is a gap, not a style choice ([R1](#R1)).

The second half is why guardrails must not bend. One that can be switched off to unblock a change is a suggestion with extra steps, and the switching-off happens under time pressure, by the person least able to judge the consequence. The guardrail wins and the change adapts ([R6](#R6)) — which is only fair if changing a guardrail is itself an open, cheap process ([R8](#R8)).

## Rule detail

### [R1](#R1) and [R2](#R2) Check what is checkable, and say what you are checking

Could a program decide it from the files? Path shapes, import edges, export lists, file names, a required file's presence, a banned identifier, a type-level property — yes. Whether a name is good, whether an abstraction earns its cost, whether a rule belongs on the entity or the use case — no, permanently and correctly.

Every check carries the id of the rule it enforces, in its name or its message. A failure saying only "import not allowed" sends a person hunting; one quoting the rule sends them to the paragraph explaining why, and lets them argue with the rule rather than the tool.

**Do**

```
name: "BE_02-R1-domain-imports-nothing-outward"
message: "BE_02#R1 — domain/ may not import application/, infrastructure/ or presentation/"
```

**Enforcement:** review — that a new check names its rule is visible in the diff.

### [R3](#R3) Fail, do not warn

A warning is a message people learn to scroll past, and a pipeline with a hundred of them has none. If a violation matters, it fails; if it does not matter enough to fail, it does not belong here.

One non-failing signal is legitimate and temporary: a new guardrail run in report-only mode long enough to size existing violations before it is turned on. That is a migration step with an end date, not a mode a check lives in.

**Enforcement:** review — a check configured to warn is visible in its configuration.

### [R4](#R4) The import graph is the highest-value target

Most of the architecture in this set is a statement about which file may import which, which makes the import graph the one artifact that carries the most enforceable rules. Four checks cover the bulk of it, and they apply to both stacks:

| Check | Enforces |
| --- | --- |
| Layer direction | Domain imports nothing outward; application does not import presentation; the frontend ladder runs one way ([BE_02](../index.html#BE_02), [FE_01](../index.html#FE_01)) |
| Module and package boundaries | No import into another module's internals; nothing imports an app; entry points only ([BE_03](../index.html#BE_03), [INFRA_03](../index.html#INFRA_03)) |
| Cycles | No cycle between workspaces or modules ([INFRA_03](../index.html#INFRA_03)) |
| Allow-lists per directory | No framework or persistence import under a domain directory; no data client below an organism ([BE_02](../index.html#BE_02), [FE_02](../index.html#FE_02)) |

These come first because they are cheap — a graph the tooling already computes — and their violations are the most expensive to unwind, since a leaked import spreads through everything that touches it.

**Enforcement:** unenforced — this is the queue, not a description of what runs today.

### [R5](#R5) The compiler is a guardrail

Strict type-checking catches a class of defect no other check will, at a cost already paid. Run it as a task ([INFRA_05#R8](../index.html#INFRA_05)) and treat loosening a flag as changing a guardrail ([R6](#R6)), not as a local fix.

Better still are conventions enforceable *in the type system*: an exhaustive record over an enumeration, a branded type for a validated value, a signature that makes the illegal call impossible ([GEN_07#R5](../index.html#GEN_07)). A rule the compiler enforces needs no lint rule and no paragraph.

**Enforcement:** partly automated — the type-check task fails on error wherever it is wired; the strictness level is review.

### [R6](#R6) and [R7](#R7) Guardrails do not bend

Never disable a check, exclude a path from it, widen its allow-list, or suppress its finding to make a change pass. This is a hard rule of the repository and it has no exception. When a guardrail blocks you, exactly two things can be true: the change is wrong, or the rule is wrong — and the second is settled by changing the rule and its document in the open ([GEN_01#R10](../index.html#GEN_01)), not by editing a configuration file inside an unrelated pull request.

A genuinely warranted exception is a waiver, not a hole: narrow to where it applies, carrying a reason and an owner, and called out in the pull request ([INFRA_05#R6](../index.html#INFRA_05)). An exclusion added to a guardrail's configuration is the most invisible change in this repository, and reviewers should treat it as a change to the convention it silences.

**Enforcement:** review — a new exclusion or suppression is visible in the diff; nothing prevents one.

### [R8](#R8) and [R9](#R9) Adding a guardrail

A new guardrail lands as three things together: the rule it enforces, stated in a document; an example that fails it, so the check is proven to work rather than assumed; and the fixes to existing code, so the repository is never in a state where the check is on and the code is red. If the existing violations are too many for one change, the check goes in as report-only with an owner and a date, and turning it on is the next change ([R3](#R3)).

Speed decides whether a guardrail is loved or resented. Checks fast enough to run before a push should be. Anything slower runs once per pipeline ([INFRA_09](../index.html#INFRA_09)); slower still is a nightly job, not a gate.

**Enforcement:** review.

### [R10](#R10) Close the loop

Every rule in this set states how it is enforced, and those lines are only trustworthy if they are maintained. When a rule graduates from `review` to a real check, the enforcement line in its own document changes in the same pull request — otherwise the set slowly fills with documents claiming automation that does not exist, which is the one failure that makes every other enforcement line worthless.

The reverse holds too: if a check is removed, its document goes back to `review` in that change.

**Enforcement:** review — the enforcement vocabulary is checkable, but whether a claim of `automated` is true is not.

## Worked example

Promoting one rule: `BE_02#R3`, the domain layer imports nothing outside itself.

Today it is `review`. It is a statement about import edges from files under a domain directory ([R4](#R4)), so it is checkable, which by [R1](#R1) means it should be checked.

The check is one rule in the import-graph tool: from any path matching a module's domain directory, to any framework, persistence, transport or configuration package — forbidden, severity error ([R3](#R3)). It is named for the rule it enforces and its message quotes it ([R2](#R2)).

Before turning it on, it is run in report-only mode once, to size the problem. If it is clean, the change enables it, adds a deliberately failing example so the check is proven, and updates `BE_02`'s enforcement line from `review` to `automated`, naming this guardrail ([R8](#R8), [R10](#R10)). If it is not clean, the violations are the interesting output — each is either a defect to fix in the same change or evidence that the rule is wrong, which is a conversation about `BE_02`, not about the check.

Then the pressure test. Someone needs a generated identifier in an entity and imports a library for it; the check fails. Adding that package to the allow-list and excluding the file are both forbidden ([R6](#R6)). The available moves: pass the identifier in from the use case ([BE_04#R9](../index.html#BE_04)), or argue that generating one is a legitimate domain capability and change `BE_02` and its guardrail together, in the open. Both are fine. The quiet exclusion is not — and it is the one that always looks reasonable at the time.

## Checklist

- Any convention the change relies on that could be checked mechanically is either checked or named as a gap ([R1](#R1)).
- New checks name the document and rule they enforce ([R2](#R2)) and fail rather than warn ([R3](#R3)).
- No guardrail was disabled, excluded, widened or suppressed ([R6](#R6)).
- Every waiver carries a reason and an owner, and is called out in the pull request ([R7](#R7)).
- A new guardrail ships with a failing example and the fixes it requires ([R8](#R8)).
- The check is fast enough for where it runs ([R9](#R9)).
- The enforcement line in the source document was updated ([R10](#R10)).

## Open questions

- This document describes a system that does not exist yet, which makes every enforcement line in it `review` or `unenforced` — including its own. The bootstrap order that buys the most is: cycles, then layer direction, then boundaries and deep imports, then the per-directory allow-lists.
- Which tools do the checking is deliberately unnamed, because it is a project fact and because the rules outlive any of them. The first implementation should record the choice in an ADR ([GEN_13](../index.html#GEN_13)).
- Nothing measures whether a guardrail is worth its runtime. A check that has never failed may be preventing violations or may be checking something nobody would do; the two are indistinguishable without a record of what it caught.

## Related

Requires [INFRA_05](../index.html#INFRA_05). See also [INFRA_09](../index.html#INFRA_09), [BE_02](../index.html#BE_02), [FE_02](../index.html#FE_02).

---

[← All conventions](../index.html)
