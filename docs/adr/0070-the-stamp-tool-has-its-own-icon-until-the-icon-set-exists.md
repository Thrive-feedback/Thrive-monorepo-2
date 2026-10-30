# 0070 — The stamp tool has its own icon until the icon set exists

Status:   accepted
Date:     2026-10-30
Deciders: kritpavin

## Context

The postcard's Stamp tool and the box printed for a stamp need a postage stamp. `lucide-react`, the
interim set under ADR 0022, has only a rubber stamp, which reads as a different thing. The design
gave the shape it wants: an empty stamp with a perforated edge.

`FE_03` R8 says icons come from a generated set and are never pasted into a component, and ADR 0022
rejected pasting because copies of one icon drift apart. The generated set does not exist yet: it is
Spike #43.

## Decision

**`PostcardStampIcon` is hand-drawn, in one file, until #43 generates the set.** This is a stated
departure from `FE_03` R8, as ADR 0022 is, and it covers this one icon and nothing else.

- It lives in `apps/web/components/organisms/postcard-dialog/postcard-stamp-icon.tsx`, and every use
  goes through that component, so there is one copy to replace.
- It takes its colour from `currentColor` and its size from the caller, as a generated icon would.
- The day #43 ships, the shape goes into the design source and this file is deleted.

## Alternatives

- **Use lucide's `Stamp`.** Rejected: a rubber stamp is not what a person sticks on a postcard, and
  the owner asked for this shape.
- **Wait for #43.** Rejected: the tool ships now.

## Consequences

- #43 has one more icon to bring in, named here so it is not missed.
- The shape can differ from what the design source ends up with until the swap.

Supersedes: —
Referenced by: `PROJECT.md` §4, `postcard-stamp-icon.tsx`
