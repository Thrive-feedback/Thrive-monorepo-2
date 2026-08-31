---
title: "GEN_04 · Feature workflow (human + AI agent)"
id: "GEN_04"
area: "GEN"
tier: "P0"
status: "stable"
updated: "2026-08-15"
requires: [GEN_01]
see_also: [GEN_06, GEN_10]
---

[Conventions](../index.html) / General / GEN_04

# [General] Feature workflow (human + AI agent)

`P0` · `GEN_04` · `stable` · `updated 2026-08-15`

**Open when:** you are starting any new feature or ticket.

Spec → acceptance criteria → plan → vertical slice → tests → review. When a ticket is ready to start, the prompt templates, and the checkpoints where a human must look.

## The rules

If you read nothing else:

1. <a id="R1"></a>Do not start a ticket that fails the Definition of Ready. Say what is missing and stop.
2. <a id="R2"></a>Write the acceptance criteria before any code. They are what "correct" means for this ticket.
3. <a id="R3"></a>Write the plan before the first edit: convention ids, files, needs from the *planned* column, decisions, checkpoints, non-goals.
4. <a id="R4"></a>Agree the seam before you implement either side of it.
5. <a id="R5"></a>Build one vertical slice end to end before you widen it.
6. <a id="R6"></a>Ship the tests with the change, at the level the behavior lives at.
7. <a id="R7"></a>Update every document your change made wrong, in the same change.
8. <a id="R8"></a>Stop at the checkpoints you named. Do not renegotiate them mid-flight.
9. <a id="R9"></a>Record a decision that is expensive to reverse before you build on it, not after.
10. <a id="R10"></a>Hand over against the acceptance criteria, one at a time.

## Why

Features fail in the first ten minutes, not the last. A ticket that never said what "done" looked like produces a change nobody can accept or reject; a plan that never named its non-goals produces a fourteen-file diff for a two-file request. Both are cheap to prevent and expensive to unwind, and an agent makes both faster than a human can notice.

The order below exists so that every expensive commitment happens while it is still words. The acceptance criteria fix what correct means, the plan fixes the shape, and the first vertical slice proves the shape works before you have built nine more of it.

## Rule detail

### [R1](#R1) Definition of Ready

A ticket may be started when all five are true. If one is not, the ticket is not blocked — the work is to fix it, and saying which one is missing takes a sentence.

- The user-visible outcome is stated, not the implementation.
- Acceptance criteria exist and could fail ([R2](#R2)).
- Everything it needs is in the *present* column of `PROJECT.md`, or installing it is the first thing the plan addresses.
- No open decision in `PROJECT.md` §5 has to be settled to build it.
- It fits one vertical slice, or it has already been split into ones that do.

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

### [R2](#R2) Acceptance criteria first

Write them as scenarios, in the language of the person who asked. They are the one artifact product, developers and agents all read, and they are what [R10](#R10) hands over against. [GEN_10](../index.html#GEN_10) owns their format and where the files live — follow it there rather than inventing a shape here. What matters at this step is that a criterion can fail: "the export works" cannot, "exporting 0 rows returns an empty file, not an error" can.

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

### [R3](#R3) What the plan contains

[GEN_02](../index.html#GEN_02) requires that a plan exists; this is what goes in it. Six lines, before the first edit. The last two carry the weight: an unnamed non-goal is how scope grows silently, and an unnamed checkpoint is how it grows unattended. Checkpoints here are the ones you choose for this ticket; [GEN_02#R6](../index.html#GEN_02) lists the ones that are never yours to skip.

```
Ticket:      <id> — <the outcome, one line>
Conventions: <ids from your read set — GEN_01#R6>
Files:       <paths you expect to create or change>
Needs:       <anything from PROJECT.md "planned", or "none">
Decisions:   <what needs an ADR before building, or "none">
Checkpoints: <where you will stop for a human>
Not doing:   <the nearest three things a reader might assume>
```

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

### [R4](#R4) Agree the seam first

Most features cross the API↔web boundary. Settle the shape of what crosses it before either side is written, because changing it later means changing both sides plus whatever was generated from it. [GEN_08](../index.html#GEN_08) owns who decides the contract and how it reaches the other side. The rule here is only about order: the seam is the first thing you write and the last thing you change.

**Do**

```
1. agree the request/response shape
2. both sides build against it
3. the shape changes only by agreement
```

**Don't**

```
1. build the endpoint
2. build the UI against what it happens
   to return
3. discover the shape was wrong in review
```

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

### [R5](#R5) One vertical slice, end to end

A slice is one path through every layer the feature touches — one scenario working, with nothing around it. Build that before the second scenario, the edge cases, or the admin screen. Layer-at-a-time work looks faster and is not: you find out whether the shape was right only after you have built all of it, and by then the cost of being wrong is the whole feature. The layer order inside the API app belongs to [BE_02](../index.html#BE_02); the point here is that you cross all of them once before you cross any of them twice.

**Enforcement:** review — visible in the diff; checklist item in [GEN_06](../index.html#GEN_06).

### [R7](#R7) Fix the documents you invalidated

If the change makes a convention document, a README or `PROJECT.md` wrong, it is part of the change — not a follow-up ticket, which is where these go to be forgotten. Installing something from the *planned* column means moving its row in the same pull request. Changing a convention rather than obeying it has its own procedure in [GEN_01#R10](../index.html#GEN_01).

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

### [R10](#R10) Hand over criterion by criterion

Close by walking the acceptance criteria in order and saying, for each, how it is satisfied and which test proves it. A criterion you cannot point a test at is not done, and naming it is worth more than a summary that implies everything passed. [GEN_02#R8](../index.html#GEN_02) owns the rest of the report format; [GEN_06](../index.html#GEN_06) owns what happens to the pull request next.

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

## Worked example

The ticket: *"a customer can archive an order they no longer want in their list."*

1. **R1** — outcome is user-visible; nothing needed from the *planned* column; no open decision blocks it; one slice. Ready.
2. **R2** — three criteria, written before anything else: archiving an active order removes it from the default list; archiving an already-archived order changes nothing and does not error; a customer cannot archive an order that is not theirs.
3. **R3** — the plan, with *not doing: bulk archive, an un-archive path, an admin view*.
4. **R4** — the seam is one route and its response. Agree it, then both sides build against it.
5. **R5** — the first criterion only, through every layer, green. Then the second and third.
6. **R6**, **R10** — the third criterion is an authorization rule, so it gets a test at the layer that enforces it, and the hand-over says which one.

**Do — the hand-over**

```
AC1 removed from default list
    → orders.query.spec.ts "excludes archived"
AC2 archiving twice is a no-op
    → archive-order.use-case.spec.ts
AC3 not your order → 404, not 403
    → archive-order.e2e-spec.ts (leaks
      existence otherwise)
```

**Don't**

```
"Implemented archiving. All tests pass.
 Also added un-archive since it was
 basically the same code, and tidied
 the list query while I was in there."
```

The second version is the more common failure. It is not lazy — it is someone doing extra work that nobody can review against anything.

## Checklist

- Definition of Ready met, or what is missing was stated ([R1](#R1)).
- Acceptance criteria written before code, and each one can fail ([R2](#R2)).
- Plan written first, with decisions, checkpoints and non-goals ([R3](#R3)).
- The seam was agreed before either side was built ([R4](#R4)).
- First slice went end to end before anything was widened ([R5](#R5)).
- Tests ship in this change, at the level the behavior lives at ([R6](#R6)).
- Every document the change invalidated is fixed here ([R7](#R7)).
- Named checkpoints were honored ([R8](#R8)).
- Expensive decisions recorded before being built on ([R9](#R9)).
- Hand-over walks the criteria and names a test for each ([R10](#R10)).

## Open questions

- Every rule here is `review`-enforced, and the reviewer checklist lives in [GEN_06](../index.html#GEN_06). While that entry is still `todo`, [GEN_01#R5](../index.html#GEN_01) applies and the checklist below is what a reviewer works from.
- [R2](#R2) requires acceptance criteria but defers their format to [GEN_10](../index.html#GEN_10). Whether criteria must be executable `.feature` files from the first ticket, or may start as plain scenarios and be promoted later, is unsettled — an ADR ([GEN_13](../index.html#GEN_13)).
- [R5](#R5) gives no rule for when a ticket is too big to slice. "One scenario through every layer" is the test used here, and it is a judgment call.

## Related

Requires [GEN_01](../index.html#GEN_01). See also [GEN_06](../index.html#GEN_06), [GEN_10](../index.html#GEN_10).

---

[← All conventions](../index.html)
