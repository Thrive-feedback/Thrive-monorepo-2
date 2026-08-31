---
title: "GEN_13 · Architecture Decision Records"
id: "GEN_13"
area: "GEN"
tier: "P1"
status: "stable"
updated: "2026-08-15"
requires: [GEN_01]
---

[Conventions](../index.html) / General / GEN_13

# [General] Architecture Decision Records (ADR)

`P1` · `GEN_13` · `stable` · `updated 2026-08-15`

**Open when:** you are about to make a decision that is expensive to reverse.

When a decision needs an ADR, the template, and how an ADR supersedes another ADR or a convention document.

## The rules

If you read nothing else:

1. <a id="R1"></a>Write an ADR when the decision is expensive to reverse: a dependency, a boundary, a stored shape, a protocol, or a process everyone must follow.
2. <a id="R2"></a>One decision per record. Two decisions are two records.
3. <a id="R3"></a>`docs/adr/NNNN-kebab-title.md`, numbered sequentially, never reused.
4. <a id="R4"></a>Write it before you build on the decision. An ADR written afterwards is a changelog.
5. <a id="R5"></a>Record the alternatives you actually considered and why each was rejected.
6. <a id="R6"></a>State the consequences, including the ones you do not like.
7. <a id="R7"></a>An accepted ADR is immutable. To change the decision, write a new one that supersedes it.
8. <a id="R8"></a>Status is exactly one of `proposed`, `accepted`, `rejected`, or `superseded by NNNN`.
9. <a id="R9"></a>When an ADR changes a convention, the convention document changes in the same pull request and cites the ADR.
10. <a id="R10"></a>Link the ADR from whatever depends on it, so the reason is reachable from the code.

## Why

Every codebase accumulates decisions whose reasons are lost. Six months later the constraint that forced the choice is invisible, the choice looks arbitrary, and someone reverses it — rediscovering the original constraint the expensive way. An ADR costs twenty minutes and preserves the one thing the code cannot: what else was on the table.

It matters more with agents in the loop. An agent reading the code sees the decision but not the alternatives, and it is confidently willing to "improve" a choice that was deliberate. A linked ADR turns that into a question instead of a pull request.

## Rule detail

### [R1](#R1) What deserves one

The test is the cost of being wrong, not the size of the change. Adding a dependency is three lines and an ADR; renaming forty files is a large diff and no ADR at all.

| Needs an ADR | Does not |
| --- | --- |
| Adding or replacing a dependency everything will import | Adding a dev-only tool one person uses |
| Choosing a database, a queue, a schema library | Choosing a variable name |
| A boundary: what a module owns, who owns the contract | Moving a file inside a module |
| A stored or transmitted shape that others will depend on | An internal type nobody else sees |
| Reversing an earlier decision, including a convention | Following an existing convention |

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06); [GEN_04#R9](../index.html#GEN_04) requires it before building.

### [R4](#R4) Before, not after

An ADR written after the code is a changelog: the alternatives are no longer live, the author already knows which one won, and the reasoning gets reconstructed to justify it. Written first, it does actual work — half the time, listing the alternatives changes the decision, and that is the half that pays for the practice. It is also the cheapest moment to discover that two people had different decisions in mind. [GEN_04#R9](../index.html#GEN_04) puts it in the workflow: record it, then build on it.

**Enforcement:** review — the commit order shows which came first.

### [R5](#R5) The alternatives are the point

The decision itself is usually visible in the code. What is not visible is the option you rejected and the reason — which is exactly what the next person needs before reopening it. Record only alternatives you genuinely weighed; a straw option listed to make the choice look inevitable is worse than none, because it hides that the decision was close.

**Enforcement:** review — an ADR with one alternative is usually an ADR written afterwards.

### [R6](#R6) Consequences, including the unwelcome ones

This is where most records go soft. A consequences section listing only benefits is advocacy, and it tells the next reader nothing they could not have guessed from the decision. Write what the choice makes harder, what it forecloses, and the mistake it makes likely — that last one is the highest-value sentence in the document, because it is a warning written before anyone has made the mistake. If a decision genuinely has no downside, it probably did not need a record.

**Do**

```
- Every display path must format; no amount
  is printable as-is.
- Zero- and three-decimal currencies need a
  lookup, so "× 100" is wrong and will be
  written anyway at least once.
```

**Don't**

```
- Exact arithmetic
- Type safety
- Industry standard
(nothing a reader could act on)
```

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

### [R7](#R7) Immutable once accepted

The record is of what was decided and why, at a point in time, with the information then available. Editing it destroys that — and the reason a later reader most needs is often the constraint that no longer applies. Correct a typo; never rewrite the decision. Superseding keeps both records and makes the change of mind itself part of the history.

**Do**

```
0007 — status: superseded by 0019
0019 — status: accepted, supersedes 0007
       "0007 assumed a single region; we now
        have two, which changes the trade-off."
```

**Don't**

```
0007 — edited in place, two years later,
       to describe what we do now.
       (the original reasoning is gone)
```

**Enforcement:** review — an edit to an accepted ADR is visible in the diff.

### [R9](#R9) ADRs and conventions move together

The two are different artifacts: an ADR records a decision at a moment, a convention document tells you what to do today. When a decision changes a rule, both change in the same pull request — the document is edited, and it cites the ADR that authorized the edit. An ADR that contradicts a live convention document, with the document unchanged, means the rule the reader actually follows is still the old one ([GEN_01#R10](../index.html#GEN_01)).

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

## Worked example

```
# 0004 — Money is stored as integer minor units

Status:   accepted
Date:     2026-08-15
Deciders: kritpavin
Context
  Amounts appear in orders, invoices and reports. Two of them are
  summed in more than one place, and the system will take a second
  currency within the year.

Decision
  Money is `{ amountMinor: number, currency: CurrencyCode }`.
  No amount exists without a currency. Rounding happens only at
  the presentation edge.

Alternatives
  - Decimal library: exact and ergonomic, but every boundary
    (JSON, database, generated client) needs a conversion, and the
    type leaks into the domain.
  - Float: rejected — 0.1 is not representable, errors compound
    over sums, and the first symptom is a one-cent discrepancy
    nobody can attribute.

Consequences
  + Arithmetic is exact; cross-currency addition is a type error.
  - Every display path must format; no amount is printable as-is.
  - Currencies with zero or three minor units need a lookup, so
    "× 100" is wrong and will be written anyway at least once.

Supersedes: —
Referenced by: GEN_11#R5
```

The third consequence is the one that earns the record. It is the mistake this decision makes likely, written down before anyone made it.

## Checklist

- The decision is expensive to reverse, per the table ([R1](#R1)).
- One decision in the record ([R2](#R2)).
- Numbered sequentially in `docs/adr/` ([R3](#R3)).
- Written before the code that depends on it ([R4](#R4)).
- Real alternatives, with real reasons for rejection ([R5](#R5)).
- Consequences include the unwelcome ones ([R6](#R6)).
- No accepted ADR was edited; changes of mind supersede ([R7](#R7)).
- Status is one of the four values ([R8](#R8)).
- Convention documents affected were changed in the same pull request ([R9](#R9)).
- The ADR is linked from what depends on it ([R10](#R10)).

## Open questions

- ADRs are Markdown while convention documents are HTML. That is deliberate — an ADR is a short, append-only record with no navigation — but it is an inconsistency someone will question, and it deserves recording as its own ADR.
- Nothing lists the open decisions and the ADRs that closed them in one place. `PROJECT.md` §5 holds the open ones and `docs/adr/` holds the closed ones, with no link between them except by hand.
- [R8](#R8) has no `deprecated` status, so a decision that simply stopped applying — rather than being replaced — has no accurate state.

## Related

Requires [GEN_01](../index.html#GEN_01).

---

[← All conventions](../index.html)
