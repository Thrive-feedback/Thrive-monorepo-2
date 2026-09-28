# 0010 — A flaky test is fixed before merge, never quarantined

Status:   accepted
Date:     2026-09-28
Deciders: kritpavin

## Context

The promotion review of the draft conventions found three documents answering
"what do we do with a flaky test" three different ways:

- `FE_15#R10` said a flaky scenario is quarantined with an owner and a deadline.
- `INFRA_09#R7` said a flake is quarantined in the change that noticed it, so the
  suite "goes green honestly".
- The hard rules in `AGENTS.md` say "never disable a test to make a build green",
  and `FE_14` repeated that rule in its own words.

Quarantine is disabling a test. A tag that keeps a scenario out of the run is a
skip with paperwork, and `GEN_10` already allows exactly one exclusion tag,
`@wip`, which must never survive a merge. The documents could not all be
followed at once, and the hard rule outranks every convention document.

## Decision

A flaky test is a defect. It is fixed before the change that exposed it merges.
It is never quarantined, skipped, or wrapped in a retry.

`INFRA_09#R7` owns the rule for every suite. `FE_15#R10` keeps only the
browser-specific part, which is how to diagnose a flake: usually a wait on the
wrong condition, or a step that acts before the app has settled.

## Alternatives

- **Quarantine with an owner and a date.** Rejected: it contradicts the hard
  rule, and without a mechanism (a tag, a visible list, an expiry that fails the
  build) a quarantined test is a deleted test. None of the documents specified one.
- **Automatic retries on the flaky suite only.** Rejected: a retry converts an
  intermittent defect into a permanently green build. The next person to meet
  that defect is a user.
- **Amend the hard rule to allow quarantine.** Rejected: the hard rules are the
  one layer with no exceptions. Weakening one to settle a documentation conflict
  inverts the order of authority.

## Consequences

- A flake that reaches the default branch blocks everyone until it is fixed.
  That cost is intentional. The escape valve is reverting the change that
  introduced it, which `INFRA_09`'s open questions leave for the first real case.
- The API runners randomize test and scenario order, so order-dependent flakes
  surface in the change that creates them rather than later.
- `FE_14` no longer restates the hard rule. It cites `AGENTS.md`, so the rule has
  one wording.

Supersedes: —
Referenced by: INFRA_09, FE_15, FE_14
