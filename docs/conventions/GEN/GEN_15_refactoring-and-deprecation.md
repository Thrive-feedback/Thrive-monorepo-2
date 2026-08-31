---
title: "GEN_15 · Refactoring, deprecation & clean-up policy"
id: "GEN_15"
area: "GEN"
tier: "P3"
status: "stable"
updated: "2026-08-15"
see_also: [GEN_13, BE_26]
---

[Conventions](../index.html) / General / GEN_15

# [General] Refactoring, deprecation & clean-up policy

`P3` · `GEN_15` · `stable` · `updated 2026-08-15`

**Open when:** you want to change or delete something other code depends on.

Deprecation markers, migration windows, the boy-scout rule and its limits, and when a refactor must be its own pull request.

## The rules

If you read nothing else:

1. <a id="R1"></a>A refactor changes structure and not behavior. If behavior changes, it is not a refactor.
2. <a id="R2"></a>Refactor in its own pull request, never inside a feature or a fix.
3. <a id="R3"></a>Do not refactor code you have no tests for. Add them first, against the current behavior.
4. <a id="R4"></a>Deprecate before deleting anything a consumer outside your control depends on.
5. <a id="R5"></a>A deprecation names its replacement, its owner, and its removal date.
6. <a id="R6"></a>A deprecation without a removal date is a permanent second way to do things. There is no such thing as a temporary one.
7. <a id="R7"></a>Delete on the date. An expired deprecation is a decision nobody made.
8. <a id="R8"></a>Prefer expand then contract: add the new, migrate the callers, remove the old.
9. <a id="R9"></a>Dead code is deleted, not commented out and not flagged off. Git remembers it.
10. <a id="R10"></a>The boy-scout rule applies to what you are already changing, and stops at the file you are in.

## Why

Refactoring and deprecation are the two ways a codebase changes without a user asking for anything, which makes them the two most likely to be done invisibly and the two hardest to review. The rules below are almost entirely about keeping them visible: separate from feature work, bounded in scope, and — for anything with consumers — on a clock that someone agreed to.

The clock is the part teams skip. A deprecation with no removal date does not reduce the number of ways to do something; it doubles it permanently, and every new person has to learn both and guess which one is current.

## Rule detail

### [R2](#R2) Its own pull request

A diff that both moves code and changes what it does cannot be reviewed: the reviewer has to hold the whole restructuring in their head just to find the two lines that matter, so in practice they check neither. Separating them is also what makes a revert possible — you can undo the behavior change without giving back the structure, or the reverse. Sequence them in either order; just never in one change ([GEN_06#R1](../index.html#GEN_06)).

**Enforcement:** review — visible in the diff.

### [R3](#R3) Tests first, against current behavior

A refactor is defined by behavior staying the same, so without tests you have no way to claim it happened. Write them against what the code does today, including the parts you think are wrong — if something looks like a bug, that is a separate change under [GEN_05](../index.html#GEN_05), made before or after, never during. A test that encodes a bug and a comment saying so is the honest artifact here.

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

### [R5](#R5) What a deprecation says

Three facts, or the marker is decoration. The replacement, so nobody has to search for it; the owner, so there is someone to ask; the date, so it ends. Put it where the consumer will see it — in the type, not only in a changelog nobody reads at the moment they call the function.

**Do**

```
/**
 * @deprecated Use {@link findForCustomer}.
 * Owner: kritpavin. Removal: 2026-11-01 (#318).
 */
export function findVisible(id: CustomerId) { … }
```

**Don't**

```
/** @deprecated use the new one */
export function findVisible(id: string) { … }
// which new one? whose? until when?
```

**Enforcement:** partly automated — a lint rule can require the shape and fail the build past the date ([INFRA_06](../index.html#INFRA_06)).

### [R8](#R8) Expand, migrate, contract

Three changes instead of one, each safe on its own: add the new thing beside the old; move every caller; delete the old. Nothing is ever broken in between, which means the sequence can be paused, and a rollback at any step leaves a working system. The same shape appears wherever this repository changes something with consumers — the wire ([GEN_08#R8](../index.html#GEN_08)) and the database schema ([BE_15](../index.html#BE_15)) — because it is the only shape that works when you cannot update both sides at once.

**Enforcement:** review — visible in the sequence of pull requests.

### [R10](#R10) The boy-scout rule, bounded

Leaving code better than you found it is right, and it is also the most common way a two-file change becomes a fourteen-file one. The bound: improve what you were already changing, in the file you were already in, and only if it does not need its own tests. Past that line, write it down and propose it — [GEN_05#R7](../index.html#GEN_05) is the same discipline for bugs, and [GEN_02#R5](../index.html#GEN_02) is the general rule this one qualifies.

**Do**

```
// in the function you are already editing:
rename a misleading local, delete a dead branch,
extract a duplicated three-line block
```

**Don't**

```
// "while I was in there":
reorganize the module, change the error type
everything throws, upgrade a dependency
```

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

## Worked example

A repository method returns the wrong shape for two of its five callers. The clean sequence:

1. **R3** — characterization tests for all five callers, against today's behavior, including the shape that is wrong.
2. **R8**, **R5** — add `findForCustomer`; mark `findVisible` deprecated with replacement, owner and date.
3. **R2** — move the five callers in their own pull request, one per module if that keeps each reviewable.
4. **R7**, **R9** — on the date, delete the old method and its tests. Nothing is commented out, and no flag is left behind.
5. If one caller cannot move in time, the date moves *and* the reason is recorded — a silently expired deprecation is the failure this rule exists to prevent.

Four pull requests where one was possible. The cost is real; it buys the ability to stop after any of them and still have a system that works.

## Checklist

- Behavior did not change, or this is not being called a refactor ([R1](#R1)).
- The refactor is alone in its pull request ([R2](#R2)).
- Tests existed against current behavior before the move ([R3](#R3)).
- Anything with outside consumers was deprecated, not deleted ([R4](#R4)).
- Every deprecation names replacement, owner and removal date ([R5](#R5), [R6](#R6)).
- Expired deprecations were removed, or their extension was recorded ([R7](#R7)).
- The change followed expand → migrate → contract ([R8](#R8)).
- No commented-out code and no dead flags left behind ([R9](#R9)).
- Opportunistic clean-up stayed inside what was already being changed ([R10](#R10)).

## Open questions

- [R5](#R5) requires a removal date but nothing suggests how long a window should be. It depends on who the consumers are, and this document has no way to know.
- [R7](#R7) is the rule most likely to be quietly broken, and the guardrail that would catch it — failing the build on an expired deprecation — is also the one most likely to be disabled the first time it fires during an unrelated release ([INFRA_06](../index.html#INFRA_06)).
- Large refactors are not distinguished from small ones here. A restructuring that spans modules is arguably a decision needing an ADR ([GEN_13](../index.html#GEN_13)) before it starts, and no rule above says so.

## Related

See also [GEN_13](../index.html#GEN_13), [BE_26](../index.html#BE_26).

---

[← All conventions](../index.html)
