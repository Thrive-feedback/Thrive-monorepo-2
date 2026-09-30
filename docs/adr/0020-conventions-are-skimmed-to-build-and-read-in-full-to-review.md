# 0020 — Conventions are skimmed to build and read in full to review (GEN_01)

Status:   accepted
Date:     2026-09-30
Deciders: kritpavin

## Context

`GEN_01` R1–R4 decide *which* documents are in a read set: the ten `P0`, the area's entry path,
the triggered `P2`, the `data-paths` matches. They never said *how much* of each to read, so an
agent reads every one end to end. A typical change touches fifteen to twenty-five documents of
around 12 KB each; the whole set is 58 documents and about 690 KB. Most of that is *Why*, *Rule
detail*, *Worked example* and *Checklist* — explanation of rules the agent only needs to obey.

The cost is paid on every task, in time and in tokens, and it buys little: `GEN_12` already
requires each document's **The rules** list to stand alone ("If you read nothing else").

## Decision

To build, read each document's head (**Open when**, summary) and **The rules**, and stop at
*Why*. Open a single rule's *Rule detail* when its one-liner leaves you unsure or you are about
to depart from it. Read a document in full only when asked to review against it, or when
authoring or changing it (`GEN_12`).

The rule is carried by `GEN_01` R1, whose one-liner and detail now cover depth.

## Alternatives

- **A new `GEN_01` R11.** Rejected: `GEN_12` R4 caps a document at ten rules, and `GEN_01`
  has ten.
- **Merge R3 and R4 to free an id.** Rejected: it reuses R4 for a different rule, and a rule id
  is meant to be stable.
- **Put the rule only in `AGENTS.md` and `CLAUDE.md`.** Rejected: `AGENTS.md` may not outrank a
  `stable` convention, and `GEN_01` would still say "read" with the old meaning.
- **Shrink the documents.** Rejected for now: the long sections are what a reviewer and an
  author need. The problem was when they are read, not that they exist.

## Consequences

- A change reads a fraction of what it did; the read set itself is unchanged.
- A rule whose one-liner is ambiguous now costs more — an agent may act on the one-liner
  without the detail. The guard is that departing from a rule, or being unsure of it, triggers
  opening its detail; the review, which reads in full, is the backstop.
- The quality of **The rules** lists matters more than it did. A one-liner that only makes
  sense with its detail is now a defect in that document, to be fixed under `GEN_12`.

Referenced by: GEN_01, AGENTS.md §2, CLAUDE.md
