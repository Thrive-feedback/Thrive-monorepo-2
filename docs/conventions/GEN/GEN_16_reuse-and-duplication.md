---
title: "GEN_16 · Reuse, duplication & deleting what you replaced"
id: "GEN_16"
area: "GEN"
tier: "P1"
status: "draft"
updated: "2026-08-31"
requires: [GEN_01]
see_also: [GEN_15, FE_01, BE_03]
---

[Conventions](../index.html) / General / GEN_16

# [General] Reuse, duplication & deleting what you replaced

`P1` · `GEN_16` · `draft` · `updated 2026-08-31`

**Open when:** you are about to write a component, hook, util, type or constant — or your change replaces one.

The search that comes before writing anything new, where a thing lives by how many consumers it really has, the duplication thresholds, when not to extract, and deleting what you replaced with the evidence that it is dead.

## The rules

If you read nothing else:

1. <a id="R1"></a>Search before you write: the catalog, then the shared entry points, then sibling features and modules.
2. <a id="R2"></a>Search for the concept — *duration*, *debounce*, *status*, *empty* — never for the file name you were going to create.
3. <a id="R3"></a>State the outcome in the pull request: reused X, extended X with Y, or new because Z.
4. <a id="R4"></a>Where a thing lives is decided by how many consumers it has today, never by reuse you expect.
5. <a id="R5"></a>Write it once. At the second occurrence, extract it to the nearest common owner, in that same change.
6. <a id="R6"></a>Never copy a shared thing's body to change one line. Extend it, or write something genuinely different.
7. <a id="R7"></a>A thing that needs a flag to serve both callers is two things. Do not merge them.
8. <a id="R8"></a>A change that replaces, generalizes, renames or moves something deletes the original in the same change. No alias, no re-export shim.
9. <a id="R9"></a>Sweep what the deletion made dead: exports, props nobody passes, tests, fixtures, and every document the change falsified.
10. <a id="R10"></a>Prove it is dead before deleting, and put the evidence in the pull request.

## Why

Every codebase has the same two failures, and they look like opposites. One is duplication: one formatter written five times under five names, drifting at the first bug fix. The other is premature abstraction: a wrapper with one caller, a hook with three flags serving two. Both come from one missing step — nobody checked what exists, and nobody said what they found. That step gets skipped because its payoff is invisible: a search that finds something produces no diff. So this document makes the search a deliverable ([R3](#R3)); "check whether something exists" fails on its own, because nobody can verify a search that left no trace.

What works is discoverability. Where these conventions come from, primitives named in documentation had no hand-rolled bypasses at all, while undocumented ones had been re-implemented between three and thirty-odd times each — a difference of findability, not diligence. That is why [R1](#R1) starts at a catalog, and why half this document is about deleting: a catalog listing what no longer exists stops being trusted, and an untrusted catalog is no catalog.

## Rule detail

### [R1](#R1), [R2](#R2) and [R3](#R3) The search, and what you report

Three steps, before adding any component, hook, util, type, constant or transform.

1. **The catalog.** Each shared package and directory documents what it holds and what each entry replaces ([GEN_07#R10](../index.html#GEN_07)). Look up the *symptom* — "truncate text to n lines", "color for a status" — not the name you had in mind.
2. **The shared entry points.** The shared package exports, and the shared directories of the app or service you are in.
3. **The siblings.** The other features, routes and modules. This is the step people skip, and where the expensive duplicates come from.

Search the concept noun — a duplicate rarely shares your name for it. `formatDuration`, `toHms`, `secondsToClock` and `prettyLength` are one function under four names.

Report the outcome in one line, in one of three shapes:

```
reused CardShell
extended CardShell with a `dense` variant
new: nothing existing can express a two-column media row
```

If the third sentence is hard to write, the search probably found something that fits.

**Enforcement:** review — the reported outcome is what a reviewer can check; checklist item in [GEN_06](../index.html#GEN_06).

### [R4](#R4) Altitude is earned, not predicted

A thing lives at the narrowest level holding every real consumer it has *today*. Where those levels are is each area's subject — [FE_01](../index.html#FE_01), [BE_03](../index.html#BE_03), [INFRA_03](../index.html#INFRA_03) — but the counting rule is the same everywhere, and covers hooks, utilities, types, constants, schemas and fixtures, not just components.

List the importers before choosing a level. "A second page will need this next sprint" is a prediction, not a consumer, and the usual outcome is a shared thing with one caller named after where it came from.

Promotion is a step, not a rename: it is when a constant gains its exhaustive key type, near-identical implementations collapse into one, and the old home's vocabulary is stripped.

**Enforcement:** review.

### [R5](#R5) The thresholds

| Occurrence | What to do |
| --- | --- |
| First | Write it where it is used |
| Second | Extract to the nearest common owner, in that change |
| Third | It is a shared concept: promote a level, migrate the copies you touch |

The second occurrence is the whole rule. Extracting then costs minutes with both call sites in front of you; later it costs an archaeology session. "I'll extract it at three" is how one debounce delay gets written ten times.

Two things look duplicated and are not: a one-off value used in exactly one place, and two numbers equal only by coincidence. A page size of `10` and a skeleton count of `10` are not one constant.

**Enforcement:** review.

### [R6](#R6) and [R7](#R7) Extend, split — never copy

Three honest moves when something almost fits. **It fits**: use it, without wrapping it "for consistency". **It fits except on one axis** — a size, a tone, one slot: extend it where it lives, because an override every caller passes *is* the variant. **It cannot express the shape**: write a new one at the right level and say so ([R3](#R3)).

Copying the body into your own directory to change one line is not on the list: it creates two paths for one concept, and the copy misses a branch the original later gains.

The opposite error is merging things that only look alike: a flag branching the whole body means two things sharing a primitive ([R7](#R7)). Read the flag's name aloud — if it names *which caller* rather than *what varies*, split.

**Enforcement:** review.

### [R8](#R8) Delete what you replaced, in the same change

A change that supersedes code deletes it now: no alias giving one thing two names, no barrel re-export "so existing imports keep working", no old path beside the new one. Generalizing counts as replacing. Broken with good intentions, it fails the same way every time — the replacement gets wired up, the original stays, and later nobody can tell which is real.

Deprecation markers and migration windows are for consumers *outside your control* ([GEN_15](../index.html#GEN_15)). Inside one repository every caller is in front of you, and migrating them is a smaller diff than the shim plus the second migration it guarantees.

**Enforcement:** review — a same-change deletion is visible in the diff; its absence is not.

### [R9](#R9) The sweep

Deleting one thing strands others. Before opening the pull request, sweep four kinds: exports only it reached; optional props no caller passes; tests, fixtures and stubs for the deleted code; and catalog entries, README rows or convention examples the change falsified. The last matters most — a document describing code that no longer exists is worse than none, because it is believed.

**Enforcement:** review — an unused-export check is mechanically possible and is a candidate guardrail ([INFRA_06](../index.html#INFRA_06)).

### [R10](#R10) Proving something is dead

Barrels and re-exports make a naive search lie in both directions, so state the evidence, not the conclusion: a deletion is safe when the search finds no live consumer outside the symbol's own file, its barrel and its tests.

Four cases mislead. A barrel that merely re-exports is not a consumer; one that *composes* the symbol is. A test-only consumer means tested, not dead. A props type exported beside its component is convention, not a caller. Anything reached by indirection — a registry, a string lookup, a generic wrapper — is invisible to a symbol search, so search the string too.

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

## Worked example

A page needs to show `2h 14m` under a video.

The search runs in order ([R1](#R1)). The catalog has no duration entry; the shared entry points have nothing under *duration*, *length* or *format*. The third step — the siblings — hits: another feature already renders a runtime through a local `toHms`. That is the step that would have been skipped, and the one that found the answer.

`toHms` had one consumer, so it lived there ([R4](#R4)). This change makes a second, so it moves now rather than in a follow-up ([R5](#R5)). The move tightens it: the promoted version takes seconds and returns a string, and the page-specific "ago" suffix stays at the call site that wanted it.

The pull request says `extended toHms with a compact option, promoted from the media feature` ([R3](#R3)), and the old helper is gone from the diff — not aliased, not re-exported ([R8](#R8)). Its test moved with it; the sibling test covering it in place is deleted rather than left duplicating the new one ([R9](#R9)).

Now the counter-example, because this document is as much about not extracting. The same page renders an empty state, and so does a page in another area — identical icon, heading, one line of copy. Extracting them buys a shared component with a flag for the call to action, then one for an optional heading, then one for tone: eight behaviors, two of them tested ([R7](#R7)). Different copy, audience and reason to exist: they stay separate, and a third with the same shape is the moment to look again ([R5](#R5)).

## Checklist

- The three-step search ran for every new component, hook, util, type or constant ([R1](#R1), [R2](#R2)).
- The pull request says `reused` / `extended` / `new because …` ([R3](#R3)).
- Nothing was placed at a level it has no second consumer for ([R4](#R4)).
- No second copy of a literal, type, helper or component body was left in place ([R5](#R5)).
- Nothing shared was copied and edited; nothing unrelated was merged behind a flag ([R6](#R6), [R7](#R7)).
- Everything this change replaced, generalized, renamed or moved is deleted ([R8](#R8)).
- Dead exports, unused props, orphaned tests and falsified docs are gone ([R9](#R9)).
- The pull request carries the evidence that the deleted thing had no live consumer ([R10](#R10)).

## Open questions

- Every rule here is `review`, in a document about a step that leaves no trace when it succeeds. One guardrail would change that: a catalog check failing when a shared export has no entry, or an entry names a symbol that is gone. It belongs to [INFRA_06](../index.html#INFRA_06) and would make [R1](#R1) and [R9](#R9) partly automated.
- An unused-export detector would cover most of [R9](#R9), and its false-positive rules are exactly the cases in [R10](#R10). Nothing has evaluated whether an off-the-shelf one handles them.
- The boundary with [GEN_15](../index.html#GEN_15) — "does a consumer outside your control depend on it" — is clear for a published package, unclear for a shared package inside one repository. The first case that lands there should settle it in an ADR ([GEN_13](../index.html#GEN_13)).

## Related

Requires [GEN_01](../index.html#GEN_01). See also [GEN_15](../index.html#GEN_15), [FE_01](../index.html#FE_01), [BE_03](../index.html#BE_03).

---

[← All conventions](../index.html)
