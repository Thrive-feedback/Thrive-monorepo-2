---
title: "GEN_01 · How to use these conventions"
id: "GEN_01"
area: "GEN"
tier: "P0"
status: "stable"
updated: "2026-08-15"
see_also: [GEN_12, GEN_13]
---

[Conventions](../index.html) / General / GEN_01

# [General] How to use these conventions

`P0` · `GEN_01` · `stable` · `updated 2026-08-15`

**Open when:** it is your first day in this repo.

The document map, what each tier obliges you to read, the precedence rules when two documents disagree, and how to propose a change to a convention.

## The rules

If you read nothing else:

1. <a id="R1"></a>Read all ten `P0` documents before you change anything, in any area.
2. <a id="R2"></a>Read `<AREA>_01` through the last `P1` of an area when you start working there — once per area, not once per change.
3. <a id="R3"></a>Open a `P2` when its **Open when** trigger matches the change in front of you; leave `P3` closed until the project scales, splits, or breaks.
4. <a id="R4"></a>Add any entry whose `data-paths` glob matches a file you are about to edit, whatever its tier.
5. <a id="R5"></a>Treat the index entry as the binding text while a document is `status: todo`, and do not infer past its summary.
6. <a id="R6"></a>Cite the convention ids you relied on in your plan and in the pull request description.
7. <a id="R7"></a>Resolve a disagreement between two documents by precedence — the hard rules win, then the lower-numbered document of the same area; across areas, stop and ask.
8. <a id="R8"></a>Believe the document over the code, unless the document predates the code it describes and is unreviewed — then stop and ask.
9. <a id="R9"></a>Keep one subject in one document: link another document's id instead of restating its rule.
10. <a id="R10"></a>Change a convention by changing its document, never by working around it, and record an ADR (`GEN_13`) when the change reverses a decision or edits a lower-numbered document.

## Why

These conventions are inherited. They are shared across every project built from this repository and read by people and agents who were not in the room when they were written, so a wrong convention costs more than a wrong line of code — and it costs it repeatedly. The document set exists so the same decision is made the same way every time, by a human or by an agent.

It is also more than anyone can hold. The tiers exist so you never read all of it: ten bind every change, one path per area makes you productive there, the rest wait for a trigger. Without the tiers the read set is either everything, which nobody does, or nothing, which is what actually happens.

> This document states rules and conditions, never facts about the project it sits in. What this repository is, what stage it is at, what is installed and what is still undecided all live in `PROJECT.md` — check there whenever a rule below says "if" or "until".

## Rule detail

### [R1](#R1) Read all ten P0 documents before you change anything

`P0` is a fixed budget of ten — how we work, how agents work, the BE↔FE seam, the repository layout, how to run it. Filter the index to `P0` to see which ten they are today. Adding an eleventh means demoting one; the index self-check fails the page above the budget, so the number cannot drift unnoticed.

**Enforcement:** review — checklist item in `GEN_06`, via the ids you cite under [R6](#R6).

### [R2](#R2) Read the entry path of the area you are working in

The numbers in an area are a reading order, not a catalogue. The entry path runs from `_01` to the last `P1` of that area — filter the index by that area and by `P1` to see where it ends. Do not copy the range into your notes; it moves when an entry is added or re-tiered.

| Area | What its entry path covers |
| --- | --- |
| GEN | How we work, and the seams that belong to no single stack |
| INFRA | The repository, the tooling, the pipelines, the runtime |
| BE | The API app: structure, layers, module, then how you prove it works |
| FE | The web app: structure, atomic levels, tokens, components, data |

**Enforcement:** review — checklist item in `GEN_06`.

### [R3](#R3) Open a P2 on its trigger; leave P3 alone

The **Open when** line is the whole selection mechanism for the `P2` documents. Match it against the change in front of you, not against the subject you find interesting. The `P3` documents describe a project with real users, real load, or a monolith worth splitting — check the stage in `PROJECT.md` before deciding they do not apply to you. Skipping `P3` is correct on a project that has not shipped, and negligent on one that has.

**Enforcement:** review — checklist item in `GEN_06`.

### [R4](#R4) Match your changed files against `data-paths`

`data-paths` on an index entry lists the globs that document governs. A path match overrides the tier: a `P2` whose globs cover a file you are editing is in your read set, even though its trigger did not fire.

**Do**

```
Touching apps/api/src/orders/orders.controller.ts
→ GEN_07  (data-paths="**/*.ts,**/*.tsx")
→ BE_01   (data-paths="apps/api/**")
→ BE_02   (data-paths="apps/api/src/**")
```

**Don't**

```
Touching apps/api/src/orders/orders.controller.ts
→ BE_07 only
  ("it's an endpoint change, the rest is
   structure and I already know it")
```

**Enforcement:** unenforced — nothing compares a diff against the index globs today. See [Open questions](#open-questions).

### [R5](#R5) A `todo` entry is binding text

Status runs `todo` → `draft` → `stable` → `deprecated`. `todo` means the document is not written and its index entry is the only rule that exists: follow the summary and the trigger, and stop there. Do not invent the missing document in your head and then obey it. Name the entries you had to interpret in your plan, so whoever writes that document can see what you assumed.

**Enforcement:** review — checklist item in `GEN_06`.

### [R7](#R7) Resolve conflicts by precedence, then stop

The five hard rules at the top of the index outrank every document. Below them, a document may not contradict a lower-numbered document of the same area: the lower number is the older, more fundamental decision, so it wins and the higher-numbered one is the bug. Across areas there is no tiebreak, on purpose. Two areas disagreeing is a design problem, not a reading problem — stop and ask.

**Enforcement:** review — checklist item in `GEN_06`.

### [R8](#R8) The document wins over the code

The document is what future projects inherit, so conforming code is the fix. The exception is age: if the document's `data-updated` predates the code it describes and nobody has reviewed it since, it may simply be stale. Do not guess which case you are in. Stop and ask, then fix whichever one is wrong in the same pull request.

**Enforcement:** review — checklist item in `GEN_06`.

### [R9](#R9) One subject, one document

The failure mode of a large document set is not a bad document. It is four documents explaining caching slightly differently, after which none of them is trusted. If your subject already has an entry, cite its id and move on. Cite a specific rule as `<ID>#<Rn>` — for example `GEN_01#R5`.

**Enforcement:** unenforced — nothing detects a rule stated in two documents. See [Open questions](#open-questions).

### [R10](#R10) Change the convention, do not route around it

A convention you disagree with is changed in the open: edit the document, set `data-updated`, update the index entry, and ship a pull request that says what changed and why. Write an ADR (`GEN_13`) when the change reverses an earlier decision or forces an edit to a lower-numbered document of the same area. Never weaken a guardrail — a lint rule, a type, an architecture test, a CI gate — to make a change pass. `GEN_12` owns the shape of the document you are editing.

**Do**

```
PR: "FE_03 forbids raw hex. This screen needs
a new surface color, so this PR adds the token
and updates FE_03's palette table."
```

**Don't**

```
PR: "added `style={{ background: '#f6f5f2' }}`
+ biome-ignore, token pipeline isn't ready yet"
```

**Enforcement:** review — checklist item in `GEN_06`.

## Worked example

You are asked to add an *archive* endpoint to a module in the API app — call it `orders`. Build the read set before you open an editor.

1. **R1** — the ten `P0` documents. You read them once, on your first day.
2. **R2** — you are in BE, so the entry path is `BE_01` through the last BE `P1`. Read it now if this is your first change in the API app.
3. **R4** — you will touch `apps/api/src/orders/*.ts`, which matches `GEN_07`, `BE_01` and `BE_02`. All already in the set.
4. **R3** — the endpoint changes the wire shape, so `GEN_08`'s trigger fires. It is `P0`, so you have it. No `P2` triggers: no transaction, no cache, no new integration.
5. **R5** — check each entry's `data-status`. For any still `todo`, the summary is the rule: `BE_07`'s is what tells you the route is a resource, not an action.
6. **R6** — close the pull request description with the ids you actually used.

```
Conventions: GEN_04 (workflow), GEN_07 (naming), GEN_08 (contract),
             BE_01, BE_02, BE_07, BE_08, BE_09, BE_11
Interpreted: BE_07 and BE_09 were todo — followed their index summaries.
             BE_07 gave no pagination rule; none needed here.
```

Nine documents, not the whole set. That is the tier system working.

## Checklist

- All ten `P0` documents read ([R1](#R1)).
- Entry path read for every area this change touches ([R2](#R2)).
- Every matching **Open when** trigger followed; no `P3` opened without cause ([R3](#R3)).
- Changed files matched against `data-paths` ([R4](#R4)).
- `todo` entries followed as written, and the interpreted ones named ([R5](#R5)).
- Convention ids cited in the plan and the pull request description ([R6](#R6)).
- No conflict resolved by picking a favorite; cross-area conflicts raised ([R7](#R7), [R8](#R8)).
- Nothing restated that another document owns ([R9](#R9)).
- No guardrail weakened; convention changes shipped as document edits, with an ADR where required ([R10](#R10)).

## Open questions

- [R4](#R4) and [R9](#R9) are `unenforced`. Candidate guardrails for `INFRA_06`: a check that matches the diff against the index globs and prints the read set, and a duplicate-rule check across `docs/conventions/`. Both need a CI pipeline — see `INFRA_09`, and `PROJECT.md` for whether one exists here yet.
- The index self-check — dangling ids, tier inversions, filename drift, the `P0` budget — runs in the browser on page load only. Promoting it to a CI gate belongs to `INFRA_09`.
- [R7](#R7) leaves cross-area conflicts with no tiebreak. Confirm that, or file an ADR that gives one.

## Related

See also [GEN_12](../index.html#GEN_12), [GEN_13](../index.html#GEN_13).

---

[← All conventions](../index.html)
