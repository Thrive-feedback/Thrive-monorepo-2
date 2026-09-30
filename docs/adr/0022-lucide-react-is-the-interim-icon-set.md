# 0022 — lucide-react is the interim icon set

Status:   accepted
Date:     2026-09-30
Deciders: kritpavin

## Context

The shadcn components adopted in ADR 0021 draw their icons from `lucide-react`: the check in a
checkbox, the chevron on a select, the status marks on a toast, the spinner. `FE_03` R8 wants
icons shipped as a set generated from the design source, exposed as one typed surface. There is no
design source in code yet — that pipeline is Spike #43 — so there is nothing to generate from.

## Decision

Use **`lucide-react`** as the icon set until #43 generates one. This is a stated departure from
`FE_03` R8, not an exception to it: the day a generated set exists, every lucide import moves to it.

Icons are imported only inside `apps/web/components/` and the showcase that demonstrates them,
never in a screen directly, so the swap touches those files and nothing else.

## Alternatives

- **Export the icons from the Figma Icon page now.** Rejected: it is the first half of #43's
  pipeline, pulled into a task that is out of scope for it.
- **Paste the SVG markup into each component.** Rejected: `FE_03` R8 forbids exactly that, and it
  is worse than a library — the same icon drifts between copies.

## Consequences

- `lucide-react` is a runtime dependency of `apps/web`; `PROJECT.md` §4 records it as interim.
- Lucide's drawings are not the design's icons, so a shape can differ from Figma until the swap.
- A screen that needs an icon before #43 takes it from a component or asks for one — it does not
  import `lucide-react` itself.

Supersedes: —
Referenced by: ADR 0021, `PROJECT.md` §4
