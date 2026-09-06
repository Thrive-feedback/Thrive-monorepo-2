# 0003 — Reuse and duplication get their own convention (GEN_16)

Status:   accepted
Date:     2026-08-31
Deciders: kritpavin

## Context

Reviewing the backend and frontend convention sets against the codebase these
conventions were derived from surfaced one subject with no owner anywhere in
`docs/conventions/index.html`:

- the search a person or agent performs *before* writing a new component, hook,
  util, type or constant;
- the threshold at which a second occurrence must be extracted;
- the rule that a change replacing or generalising code deletes the original in
  the same change, and the evidence a deletion needs.

The pieces that exist cover neighbouring ground and stop short. `FE_01#R10`
forbids a re-export shim, but only when a component moves up its ladder.
`GEN_15` covers deprecating and deleting things *outside* your control, on a
migration window. `GEN_07#R10` requires a package README. None of them says
"look before you write", and none states a duplication threshold.

The source codebase measured the cost of that gap directly: primitives named in
its documentation had no hand-rolled bypasses, while primitives that existed but
were undocumented were re-implemented between three and thirty-odd times each.
Reuse follows discoverability, so the discovery step has to be written down.

## Decision

Add `GEN_16 — Reuse, duplication & deleting what you replaced` as a `P1`
General convention, and write it.

General rather than frontend, because the failure is not stack-specific: a
formatter cloned across two pages and a helper cloned across two backend modules
are the same defect with the same fix.

## Alternatives

- **A frontend-only entry (`FE_25`).** Rejected: it mirrors the source document
  exactly, but the backend then has no owner for the same rule, and the rule
  gets restated the first time a backend reviewer needs it — the duplication
  this repository exists to prevent, in the documents themselves.
- **Fold it into `FE_01` and `GEN_15`.** Rejected: both are `stable` and both
  already carry ten rules, so absorbing this subject means rewriting rules in
  inherited documents to make room. It also splits one procedure across two
  documents in two areas, which `GEN_01#R9` exists to prevent.
- **Leave it unowned.** Rejected: it is the one subject where the source
  codebase has measured evidence of what the absence costs.

## Consequences

- The General area gains a `P1`, so the per-area read set in `GEN_01#R2` grows by
  one document for every area — `GEN_16` binds both stacks.
- `GEN_15` keeps deprecation and migration windows; `GEN_16` takes same-change
  deletion of code you replaced. The boundary is whether a consumer outside your
  control depends on the thing: if yes, `GEN_15`; if no, `GEN_16`.
- `FE_01#R10` becomes a specific case of `GEN_16#R8`. It is left as written —
  it is `stable`, it is correct, and the overlap is a citation, not a conflict.
- The index gains an entry that no document commissioned; this ADR is that
  commission.

Supersedes: —
Referenced by: GEN_16
