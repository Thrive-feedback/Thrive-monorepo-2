---
title: "GEN_06 · Code review, pull requests & the merge gate"
id: "GEN_06"
area: "GEN"
tier: "P0"
status: "stable"
updated: "2026-08-15"
requires: [GEN_01]
see_also: [INFRA_08]
---

[Conventions](../index.html) / General / GEN_06

# [General] Code review, pull requests & the merge gate

`P0` · `GEN_06` · `stable` · `updated 2026-08-15`

**Open when:** you are opening or reviewing a pull request.

PR size and description format, the definition of done that gates a merge, the human review checklist, the AI reviewer checklist, and what counts as a blocking comment.

## The rules

If you read nothing else:

1. <a id="R1"></a>One idea per pull request. If the description needs the word "and", split it.
2. <a id="R2"></a>Do not open it until the Definition of Done is met, or say which part is not and why.
3. <a id="R3"></a>Write the description in the fixed shape: what, why, how it was verified, what you did not do.
4. <a id="R4"></a>Review against the conventions the change cites, not against your own taste.
5. <a id="R5"></a>Mark every comment blocking or not. An unmarked comment is treated as blocking.
6. <a id="R6"></a>Block only for correctness, security, a broken convention, or a missing test.
7. <a id="R7"></a>Run the agent review pass before you ask a human for one.
8. <a id="R8"></a>Resolve every comment explicitly. Silence is not resolution, and neither is a force-push.
9. <a id="R9"></a>Approve only what you understood. An approval is a claim about you, not about the diff.
10. <a id="R10"></a>Merge when the gate is green: done, checks passing, every blocking comment resolved.

## Why

Review is the last place a wrong convention can be stopped before it is inherited, and the only place two people ever look at the same code. It fails in two directions. A pull request too large to hold in the head gets approved on faith, and a review that argues about preferences burns the attention that should have gone to the one line that was wrong.

Both failures get worse when an agent writes the change, because volume stops being evidence of effort. A four-hundred-line diff produced in ninety seconds deserves exactly the scrutiny of a four-hundred-line diff produced in a day — which is why the size limit is on the idea, not on the hours.

## Rule detail

### [R2](#R2) Definition of Done

The gate a change passes to be mergeable. It is the counterpart of the Definition of Ready in [GEN_04#R1](../index.html#GEN_04): that one says a ticket may start, this one says a change may land. Opening a pull request that fails it is allowed — as a draft, with the failing item named. Opening one silently is not.

- Every acceptance criterion is satisfied and points at a test ([GEN_04#R10](../index.html#GEN_04)).
- Lint, type-check, test and build pass, and the output was seen, not assumed.
- Every document the change made wrong is fixed in the same change.
- No guardrail was weakened, waived or disabled.
- Decisions that were expensive to reverse are recorded ([GEN_13](../index.html#GEN_13)).
- Nothing is in the diff that the stated scope does not imply.

**Enforcement:** partly automated — the checks run in CI ([INFRA_09](../index.html#INFRA_09)); the rest is review.

### [R3](#R3) The description

Four sections, in this order. The reviewer reads the description before the diff, so it has to answer why this change exists before showing what it does. The last section is the one people drop and the one that saves the most time: it stops the reviewer asking for work you deliberately excluded.

```
## What
One paragraph. The change, not the ticket.

## Why
The problem it solves. Link the ticket.

## Verified
Commands run and their result; which test covers which
acceptance criterion.

## Not doing
The nearest things a reader might expect and why they
are out of scope.

Conventions: GEN_04, GEN_07, BE_02, BE_07
Interpreted: BE_09 was todo — followed its index summary.
```

**Enforcement:** review — a pull request template makes it the default ([INFRA_08](../index.html#INFRA_08)).

### [R4](#R4) Review against the conventions, not your taste

The change cites the ids it worked under. Read those, and hold the diff to them. If you would have done it differently and no convention says so, that is a suggestion, not a blocker — and if you believe it should be a rule, the way to get one is [GEN_01#R10](../index.html#GEN_01), not a comment thread on someone's branch. This is what keeps review from being a tax whose rate depends on who is on duty.

**Do**

```
blocking: BE_02 — the use case imports the ORM
entity directly, so the domain now depends on
infrastructure.

non-blocking: I'd have named this `archive`
rather than `setArchived`. Your call.
```

**Don't**

```
We don't do it that way here.

Can you extract this into a helper?
(no rule; no reason; no marking)
```

**Enforcement:** review — visible in the comments themselves.

### [R6](#R6) What blocks

Four things: it is wrong, it is unsafe, it breaks a convention the change is bound by, or the behavior it adds has no test. Everything else is a suggestion the author may decline without negotiation. Naming, structure you would have chosen differently, and "while you are in here" all fail this test — the last one twice, because it also breaks [GEN_05#R5](../index.html#GEN_05).

**Enforcement:** review — checklist item in this document.

### [R7](#R7) The agent review pass

Before a human looks, have an agent review the diff against a fixed list. It is good at the mechanical half and it costs a minute, which means the human's attention is spent on judgment instead of bookkeeping. Give it this list, and require an id or a line reference for every finding — a finding without one is noise.

- Does the diff contain anything the stated scope does not imply?
- Is every cited convention actually followed, and is any uncited one broken?
- Does new behavior have a test, and would that test fail without the change?
- Any secret, credential, or personal data in code, logs or fixtures ([GEN_09](../index.html#GEN_09))?
- Any guardrail weakened, any suppression comment added?
- Any document, README or `PROJECT.md` row the change made wrong?

**Enforcement:** review — automatable once a pipeline exists ([INFRA_09](../index.html#INFRA_09)).

### [R9](#R9) An approval is a claim about you

It says: I read this, I understood it, and I accept part of the responsibility for it. If that is not true, do not approve — ask a question, or say plainly which part you could not judge and who should. There is no cost to "I reviewed the API surface but not the caching logic; someone should look at that." There is a large cost to an approval that turns out to have meant nothing.

**Enforcement:** unenforced — nothing distinguishes a real approval from a fast one.

## Worked example

A change adds an archive endpoint and its list filtering. The review, in order:

1. **R1** — one idea. The endpoint and the filtering are the same idea; a rename of the surrounding module would not be.
2. **R2** — the author ran the checks and pasted the output. One acceptance criterion has no test, so the pull request is a draft and says so.
3. **R7** — the agent pass finds a stubbed cache in a fixture that would have hidden the missing test. Reported with a line reference.
4. **R4**, **R6** — the human finds a use case importing an infrastructure type. That is a convention break, so it blocks. They also dislike a variable name, and mark it non-blocking.
5. **R8**, **R10** — the author fixes the import, replies to the naming comment declining it, and merges once checks are green.

The naming comment is the interesting one. Declining it is correct, and the exchange takes one line each way — because [R5](#R5) made it a suggestion instead of a standoff.

## Checklist

- The pull request contains one idea ([R1](#R1)).
- Definition of Done met, or the failing item is named and it is a draft ([R2](#R2)).
- Description has What, Why, Verified, Not doing, and the convention ids ([R3](#R3)).
- Review findings cite a convention id or a line, not a preference ([R4](#R4)).
- Every comment is marked blocking or not ([R5](#R5)).
- Nothing blocks that is not correctness, security, a convention, or a missing test ([R6](#R6)).
- The agent pass ran before a human was asked ([R7](#R7)).
- Every comment resolved explicitly ([R8](#R8)).
- Approvals cover what the approver actually read ([R9](#R9)).
- Merged only with the gate green ([R10](#R10)).

## Open questions

- [R1](#R1) gives no line count on purpose, because the limit is on the idea. Some teams want a hard number anyway. If this project wants one, it needs an ADR ([GEN_13](../index.html#GEN_13)) rather than a habit.
- [R7](#R7) assumes an agent is available to every contributor. Where that is not true, the pass falls to the human and this document does not say who.
- Review turnaround has no stated expectation here. A blocked change waiting three days is a process failure that no rule above catches.
- Whether an agent may approve a pull request at all — as opposed to reviewing it — is undecided, and [GEN_02#R6](../index.html#GEN_02) stops short of saying.

## Related

Requires [GEN_01](../index.html#GEN_01). See also [INFRA_08](../index.html#INFRA_08).

---

[← All conventions](../index.html)
