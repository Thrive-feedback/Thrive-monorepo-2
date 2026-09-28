# 0015 — Code comments explain; they do not cite conventions (GEN_17)

Status:   accepted
Date:     2026-09-28
Deciders: kritpavin

## Context

ADR 0004 noted in passing that code may cite the rule it satisfies in a
comment, and that "that direction needs no permission". The codebase took that
literally. Comments across the API, the web app, the shared packages and the
tool configuration open with an id — `GEN_07 R4 —`, `BE_12 R10 —`,
`FE_10 R7 —` — often followed by a paraphrase of the rule rather than the
reason the code is shaped that way.

Read by someone who is not holding the index open, those comments are noise
with a lookup attached. The id says *which* rule, not *why* this line; the
paraphrase is a second copy of a rule that lives in a document and will drift
from it. Where the comment is only an id and a paraphrase, the code was already
clear and the comment adds nothing.

`GEN_07#R7` says "comment why, never what", but it says nothing about citing
conventions, and nothing about when a function deserves a comment at all. One
id-prefixed comment even reached a string that ships: an OpenAPI parameter
description, which lands in the published contract and the generated client.

## Decision

Add `GEN_17 — Code comments` as a `P1` General convention, and write it.

A comment carries the reason in its own words. It does not cite a convention id,
except where the code would look like a mistake without one, or where the code's
job is to enforce a convention. Shipped text never carries an id.

Code that `PROJECT.md` §3 lists as example code is exempt: it is the reference
implementation the documents point back at (ADR 0004), so citing ids there is
allowed, not required.

Existing comments outside the example code are rewritten to the rule in the
same change, keeping their reasons and dropping their ids.

## Alternatives

- **Fold it into `GEN_07#R7`.** Rejected: `GEN_07` is `stable`, `P0` and at its
  ten-rule cap, and the subject — when a comment earns its place, what it may
  cite, what it may not ship — is more than one rule's detail block.
- **A lint rule banning ids in comments.** Rejected for now: both exceptions need
  judgement, so a blanket ban would be suppressed exactly where it matters. A
  narrower check on shipped strings is logged in `GEN_17`'s open questions.
- **Leave the ids; ask for better reasons next to them.** Rejected: the id is the
  part that makes the comment unreadable in isolation, and it is the part a
  copied project most often invalidates when it renumbers or deletes a document.

## Consequences

- The General area gains a `P1`, and its `data-paths` cover every code file, so
  `GEN_17` joins the read set of any change that touches code.
- ADR 0004's decision — a document may carry a **Reference implementation** line —
  is unaffected. Only its passing remark about comments is narrowed, and only
  outside the example code.
- Guardrail code keeps its ids: an architecture check that reports `BE_02 R3` is
  telling the reader which rule failed, which is the one place the id is the
  message.
- Nothing enforces `GEN_17` except review, so it holds only while reviewers and
  agents apply it. The agent guide points at it so agents stop generating the
  pattern.

Supersedes: —
Referenced by: GEN_17
