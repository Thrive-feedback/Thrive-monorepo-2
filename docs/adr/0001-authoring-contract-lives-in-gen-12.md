# 0001 — The authoring contract lives in GEN_12, not a separate file

Status:   accepted
Date:     2026-08-15
Deciders: kritpavin

## Context

The rules for writing a convention document were held in
`docs/conventions/AUTHORING.html`, a file with no index entry. That put it
outside the system it describes:

- `GEN_01#R9` requires one subject in one document, and `GEN_12`'s commission
  covers the same subject — two documents, one topic.
- It carried `status: stable` while sitting outside the tier system, so it
  outranked documents that the index can actually validate.
- The index self-check cannot see it: no entry means no id, tier, filename or
  status checking.
- It was reachable only by a hardcoded path in `AGENTS.md` and `CLAUDE.md`,
  not by the routing every other document uses.

## Decision

`GEN_12` is the authoring contract. `AUTHORING.html` is deleted and every
reference points at `GEN_12` through the index.

## Alternatives

- **Give `AUTHORING.html` its own index entry.** Rejected: it would need a tier,
  and the tier system describes what a reader must read before changing code —
  which is not what an authoring procedure is. It also leaves two documents on
  one subject.
- **Split policy from procedure** — `GEN_12` for what a document must be,
  `AUTHORING.html` for the template and the agent prompt. Rejected: the line is
  not stable. Every rule has a procedural half, and authors would have to guess
  which file to open.
- **Leave it as-is.** Rejected: the duplication was already visible, and the
  next author of `GEN_12` would have written a third copy.

## Consequences

- One file to maintain, discoverable by the same routing as everything else, and
  validated by the index self-check.
- `GEN_12` is `P1`, so it is not in the mandatory read set for someone who only
  changes code. That is correct — it only binds people writing documents — but
  it is a demotion from the previous `stable`-and-always-read position.
- `GEN_12` carries both the rules and the template, which pushes it against the
  length budget it defines. The template is code and therefore excluded by
  `GEN_12#R8`; that is consistent, and it is also convenient, which is worth
  noting.
- Anything that linked `AUTHORING.html` breaks until updated. Updated in the
  same change: `AGENTS.md`, `CLAUDE.md`, `GEN_01`, `GEN_02`, `PROJECT.md`.

Supersedes: —
Referenced by: GEN_12, PROJECT.md §5
