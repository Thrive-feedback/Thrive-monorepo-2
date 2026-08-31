---
title: "GEN_05 · Bugfix workflow (human + AI agent)"
id: "GEN_05"
area: "GEN"
tier: "P0"
status: "stable"
updated: "2026-08-15"
requires: [GEN_01]
see_also: [GEN_04]
---

[Conventions](../index.html) / General / GEN_05

# [General] Bugfix workflow (human + AI agent)

`P0` · `GEN_05` · `stable` · `updated 2026-08-15`

**Open when:** something is broken.

Reproduce → failing test first → root cause, not symptom → fix → regression test → a one-paragraph note on why it was possible.

## The rules

If you read nothing else:

1. <a id="R1"></a>Reproduce it before you theorize. No reproduction, no fix.
2. <a id="R2"></a>Write the failing test first, at the lowest level that still reproduces it.
3. <a id="R3"></a>Explain the cause before you change anything. A fix you cannot explain is a coincidence.
4. <a id="R4"></a>Fix the cause, not the place where the symptom surfaced.
5. <a id="R5"></a>Keep the bugfix alone in its change — no refactoring, no adjacent improvements.
6. <a id="R6"></a>Keep the failing test. It is the regression test, and it must fail without the fix.
7. <a id="R7"></a>Look for siblings — the same mistake wherever else it can occur — and report what you find.
8. <a id="R8"></a>When you cannot reproduce it, change the instrumentation, not the code.
9. <a id="R9"></a>Write one paragraph on why it was possible and what would have caught it.
10. <a id="R10"></a>Turn that answer into a guardrail, a convention change, or a recorded open question.

## Why

The expensive part of a bug is rarely the fix. It is the second fix, six weeks later, for the same cause wearing different symptoms — because the first change made the report go away without anyone establishing why the report existed. Reproduction and a failing test are what separate "the symptom stopped" from "the cause is gone", and they are the two steps everyone skips when the fix looks obvious.

An agent is unusually good at the skipped version. It will read a stack trace, recognize a shape it has seen a thousand times, and produce a plausible patch at the call site in seconds. Plausible is the problem: nothing in that loop ever checked that the bug was real, that the patch addressed it, or that it will stay fixed.

> If it is burning in production, mitigate first — roll back, disable, or flag it off — then come back here. This document is the fix, not the mitigation. [INFRA_16](../index.html#INFRA_16) owns the incident path.

## Rule detail

### [R1](#R1) Reproduce before you theorize

A reproduction is a sequence someone else can run that produces the wrong result. Not a screenshot, not a stack trace, not a description. Until you have one you cannot tell whether you fixed anything, and you will not know whether the bug was in the code, the data, or the reporter's expectations — which is a real and frequent third answer. Narrow it until every step that does not change the outcome is gone.

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

### [R2](#R2) The failing test comes before the fix

Turn the reproduction into a test and watch it fail. A test written after the fix proves only that the code does what it currently does. Put it at the lowest level that still reproduces the bug: if a use case can express it, do not write an end-to-end test — that one is slower, flakier, and points at a smaller part of the system. [BE_11](../index.html#BE_11) and [BE_12](../index.html#BE_12) own what belongs at each level.

**Do**

```
it("excludes archived orders", async () => {
  await repo.save(archivedOrder());
  const list = await listOrders.execute(customerId);
  expect(list).toHaveLength(0);   // fails: 1
});
```

**Don't**

```
// fix applied, then:
it("works", async () => {
  const list = await listOrders.execute(customerId);
  expect(list).toEqual(await repo.findVisible(customerId));
});
// green against the implementation, either way
```

**Enforcement:** review — the commit order shows it; checklist item in [GEN_06](../index.html#GEN_06).

### [R4](#R4) Fix the cause, not the surface

The place a bug becomes visible is usually not the place it was created. A guard added where the wrong value arrived leaves the wrong value being produced, and the next consumer gets it too. Ask where the invariant was actually broken, and fix it there. If the honest answer is that the layer boundary allowed it, that is the fix — and it may need [GEN_01#R10](../index.html#GEN_01), because changing a convention is not something you do quietly inside a bugfix.

**Do**

```
// the repository never excluded archived rows
findForCustomer(id, { includeArchived: false })
```

**Don't**

```
// filter it out in the controller
return rows.filter((r) => !r.archivedAt);
// every other caller still gets them
```

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

### [R5](#R5) One bug, one change

A bugfix is read under time pressure, often by someone deciding whether to ship it now. Any line that is not the fix or its test costs the reviewer the ability to see what changed and why. Rename, tidy and refactor in their own change, afterwards. This is [GEN_02#R5](../index.html#GEN_02) applied where the temptation is strongest, since you are already inside the file and it is already wrong.

**Enforcement:** review — visible in the diff; checklist item in [GEN_06](../index.html#GEN_06).

### [R7](#R7) Find the siblings

A cause that occurred once usually occurred more than once — the same missing filter in the neighbouring query, the same unhandled shape in the other adapter. Search for the pattern, not the symptom, and list what you found. Fixing the siblings may belong in this change or in its own, depending on [R5](#R5); deciding that is the reviewer's call, and they can only make it if you looked.

**Enforcement:** unenforced — nothing detects an unsearched-for sibling. See [Open questions](#open-questions).

### [R8](#R8) Cannot reproduce is a result, not a failure

Some bugs will not reproduce: they need production data, a race, or a client you do not have. Do not fix them speculatively — a speculative fix costs you the ability to tell whether it worked, and it usually ships a second bug. Add what would let you see it next time: a log line with the missing context, a metric, an assertion that fires loudly. Then say so and stop. [INFRA_14](../index.html#INFRA_14) owns what that instrumentation looks like.

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

### [R9](#R9) The paragraph

Close every bugfix with one paragraph in the pull request — what the cause was, why the system allowed it, and what would have caught it earlier. The three labeled lines in the worked example are that paragraph; prose is equally fine. It takes two minutes and it is the only step that pays back more than once. The third clause is the one that matters — "a type would have made it unrepresentable", "an integration test with a real database would have caught it", "nothing would have; it was a bad requirement". [R10](#R10) is what you do with that answer.

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

### [R10](#R10) Spend the answer

[R9](#R9)'s third clause names something that would have caught the bug, which makes it a proposal. Spend it in one of three ways: a guardrail, if a lint rule, a type or a test level would have caught it ([INFRA_06](../index.html#INFRA_06)); a convention change, if the document set told someone to do the thing that broke ([GEN_01#R10](../index.html#GEN_01)); or a recorded question, if it is real but you cannot act on it now. What you may not do is answer the question and drop it — that is the same bug agreeing to happen again.

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

## Worked example

*"Some customers still see archived orders in their list."*

1. **R1** — "some customers" is not a reproduction. Narrowed: it happens for every customer whose list was loaded before the order was archived. Now it is a sequence.
2. **R2** — the use case can express it, so the test goes there, not in a browser scenario. Red first.
3. **R3**, **R4** — the list result was cached and archiving never invalidated it. The symptom is in the list; the cause is in the archive path. Fix it there.
4. **R7** — the same cache key is written by two other paths. Both have the same gap. Reported, and fixed in a follow-up so this change stays readable.
5. **R9** — the paragraph, below.

```
Cause:   archiving wrote the order but never invalidated the
         customer's cached list.
Allowed: invalidation lives at each call site, so a new writer
         is correct by default only if its author remembers.
Caught:  an integration test over a real cache would have; the
         unit tests all stub it. Two sibling paths have the same
         gap (linked). Proposing invalidation move into the
         repository adapter — needs an ADR.
```

## Checklist

- A reproduction exists that someone else can run ([R1](#R1)).
- The test was written first and observed failing ([R2](#R2)).
- The cause is stated, not just the fix ([R3](#R3)).
- The fix is where the invariant broke, not where it surfaced ([R4](#R4)).
- The diff contains the fix and its test, nothing else ([R5](#R5)).
- The regression test fails without the fix ([R6](#R6)).
- Siblings searched for, and what was found is listed ([R7](#R7)).
- If it could not be reproduced, instrumentation was added instead of a guess ([R8](#R8)).
- The paragraph is in the pull request ([R9](#R9)).
- The "what would have caught it" answer became a guardrail, a convention change, or a recorded question ([R10](#R10)).

## Open questions

- [R7](#R7) is `unenforced`, and hardest exactly when it matters — a cause with many siblings is usually a pattern no grep expresses. No candidate guardrail yet.
- [R10](#R10) has nowhere to put an answer that is neither a guardrail nor a convention change. A recurring-causes list would be the obvious home, and nothing in the document set owns one.
- [R6](#R6) says the regression test must fail without the fix, but nothing re-checks that later. Mutation testing would; whether it is worth the runtime here is undecided ([INFRA_09](../index.html#INFRA_09)).

## Related

Requires [GEN_01](../index.html#GEN_01). See also [GEN_04](../index.html#GEN_04).

---

[← All conventions](../index.html)
