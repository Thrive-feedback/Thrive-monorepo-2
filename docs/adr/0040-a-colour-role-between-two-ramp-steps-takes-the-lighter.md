# 0040 — A colour role between two ramp steps takes the lighter one

Status:   accepted
Date:     2026-10-12
Deciders: kritpavin

## Context

The blueprint export of 2026-10-12 retargets 22 colour roles to weights no track has: 175, 225,
275, 325 and 375. They sit exactly halfway between two of the 21 ramp steps (ADR 0028), and no
track pins them as a manual override. Most are dark-mode states (`action-primary` → `primary-325`,
its hover → `225`, its active → `175`); a few are light mode (`action-secondary` →
`secondary-375`, `status-warning` → `warning-225`). The generator refused the export, because a
role could only name a step or a pinned override.

## Decision

**A role that names a weight its track does not have uses the nearest lighter weight the track
does have** — a step or a pinned override. `primary-325` becomes `--primary-300`;
`secondary-375` becomes `--secondary-350`. The generator writes the weight the blueprint named
beside the line, `/* blueprint: primary-325 */`, so the difference is visible in the diff and
in the file.

## Options considered

| Option | Why not |
| --- | --- |
| Interpolate the colour halfway, in OKLCH, as its own primitive | Invents colours design never saw as swatches, and multiplies primitives |
| Ask design to pin every in-between weight as an override | Correct, but leaves code unable to take an export until design re-exports |
| Always the darker step | Raises contrast in light mode but lowers it in dark mode; the decider preferred the lighter step for every role, one direction across both modes |
| Contrast-wards: darker in light mode, lighter in dark mode | Keeps contrast in both modes, but the direction then depends on the mode; the decider preferred one rule that reads the same in every line of `semantic.css` |

## Consequences

- In light mode, a role rounded lighter has **less** contrast against a light surface than design
  intended — `action-secondary` and `status-success` (375 → 350), `status-warning` and its states.
  Check those on the showcase page (`/ui-showcase/tokens`) after each export.
- In dark mode, rounding lighter **raises** contrast against the dark surfaces.
- When design pins one of these weights in Blueprint, the role uses the pinned colour and its
  comment disappears; nothing in code changes.
- A weight lighter than every step of its track still fails the generation.
