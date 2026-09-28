# 0018 — Branches land on main by rebase

Status:   accepted
Date:     2026-09-28
Deciders: naroebordin.w

## Context

`INFRA_08#R5` requires one merge method for the whole repository, "chosen once
and enforced by the platform, not per pull request". Its own open questions
leave the choice to an ADR, because squash and rebase trade differently against
`INFRA_08#R4`'s one-logical-change-per-commit discipline.

Until now all three methods were enabled on GitHub, and the four pull requests
merged so far used merge commits by default rather than by decision.

## Decision

**Rebase.** A pull request's commits are replayed onto `main` individually. On
GitHub, `Allow rebase merging` stays on and `Allow squash merging` and
`Allow merge commits` are turned off, so the policy is enforced rather than
remembered.

Two habits follow, and both were already the rule:

- A branch is brought up to date by rebasing onto `main`, never by merging
  `main` into it (`INFRA_08#R5`).
- Everything reaches `main` through a pull request. Branch protection already
  forbids a direct push and requires the four checks.

## Alternatives

- **Squash.** Rejected: it discards the per-commit structure `INFRA_08#R4`
  exists to produce. The work in this repository is routinely several small,
  separately-reversible commits — a deletion, a rename, a documentation fix —
  and squashing them into one subject throws away the only record of which was
  which, which is what `git bisect` and a clean revert depend on.
- **Merge commit.** Rejected: on a repository with one long-lived branch and
  short-lived feature branches, the merge commit records nothing the pull
  request does not already record, and it makes `main`'s history a graph to
  read rather than a list.

## Consequences

- `main` stays linear, so `git log` on it reads as the sequence of changes and
  `git bisect` lands on a commit small enough to understand.
- Every commit that reaches `main` is public, so a scratch commit is not
  acceptable and has to be cleaned up on the branch first. This is the cost of
  the decision, and it is the same discipline `INFRA_08#R4` already asks for.
- Rebasing rewrites commit hashes, so a branch someone else has checked out is
  coordinated before it is force-pushed (`INFRA_08#R6`).
- `Require linear history` is not enabled in branch protection. With the other
  two methods disabled it has nothing left to catch; it is the belt to this
  decision's braces if the repository settings are ever loosened by accident.

Supersedes: —
Referenced by: INFRA_08
