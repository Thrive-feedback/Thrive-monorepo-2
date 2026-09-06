---
title: "INFRA_08 · Git & GitHub — branching, commits, templates, protection"
id: "INFRA_08"
area: "INFRA"
tier: "P1"
status: "draft"
updated: "2026-09-06"
requires: [GEN_06]
see_also: [INFRA_09]
---

[Conventions](../index.html) / Infrastructure / INFRA_08

# [Infra] Git & GitHub — branching, commits, templates, protection

`P1` · `INFRA_08` · `draft` · `updated 2026-09-06`

**Open when:** you are branching, committing, or configuring the repository on GitHub.

Branch naming, trunk-based flow, Conventional Commits, rebase/merge policy, how AI-assisted commits are attributed, plus issue and PR templates, labels, CODEOWNERS, branch protection and required checks.

## The rules

If you read nothing else:

1. <a id="R1"></a>One long-lived branch. Everything else is short-lived and merges back within days.
2. <a id="R2"></a>Name a branch `<type>/<short-description>`, with the ticket where one exists.
3. <a id="R3"></a>Write Conventional Commits, and make the subject say what changed for a reader.
4. <a id="R4"></a>One logical change per commit, one concern per pull request.
5. <a id="R5"></a>Update a branch by rebasing onto the default branch. Never merge the default branch into it.
6. <a id="R6"></a>Never force-push a branch someone else is on, and never rewrite the default branch.
7. <a id="R7"></a>Attribute AI-assisted work in the commit trailer.
8. <a id="R8"></a>Templates and CODEOWNERS are checked in, and every path has an owner.
9. <a id="R9"></a>Protect the default branch: no direct pushes, review required, checks required, up to date before merge.
10. <a id="R10"></a>Never merge red, and never bypass protection to do it.

## Why

Git history is the only record of *why* that survives everyone who wrote the code. A history of squashed "fixes" and "wip" commits is a history you cannot bisect, cannot revert cleanly, and cannot read to understand a decision — so the cost of sloppy commits is paid years later by whoever is debugging at the time.

Branch protection exists for a narrower reason: it makes the conventions in this set non-optional at exactly one point, the merge. Everything else here — review, checks, ownership — is advice until the platform refuses to merge without it. That is why bypassing protection is treated as seriously as it is: it is the one control that does not depend on anyone remembering.

Trunk-based flow is the third piece, and its argument is integration cost. A branch open for a week is a week of divergence, resolved in one painful merge by the person who understands it least. Small branches merge boringly, which is the goal.

## Rule detail

### [R1](#R1) and [R2](#R2) One trunk, short branches

The default branch is always releasable. Work happens on branches cut from it and merged back in days, not weeks — a branch that cannot be merged in that time is usually several changes, or a change hiding behind a flag it should be using ([INFRA_16](../index.html#INFRA_16)).

Branch names use the same type vocabulary as commits, a slug that says what it does, and the ticket identifier where the project has one:

```
feat/order-publishing
fix/1284-duplicate-enrolment
docs/be-conventions
```

**Enforcement:** review — a branch-name pattern is checkable in the pipeline ([INFRA_09](../index.html#INFRA_09)).

### [R3](#R3) and [R4](#R4) Commits that a reader can use

Conventional Commits give the type, an optional scope, and a subject. The type is what makes history filterable and changelogs derivable; the subject is what makes it readable. Write the subject for someone scanning a list a year from now, in the imperative, saying the effect rather than the mechanism.

The body carries what the diff cannot: why this approach, what was rejected, what the change does not do. That is where the conventions you relied on are cited ([GEN_01#R6](../index.html#GEN_01)), and a breaking change is marked so a release can find it.

Where the project tracks work in tickets, put the ticket in the **scope** rather than only in the branch name — `feat(abc-123): …` — and use the same subject for the pull request title. The scope is the part that survives into the squashed commit and the generated changelog, so every released line traces back to the request that caused it; a ticket that lives only in a branch name is gone the moment the branch is deleted.

**Do**

```
feat(orders): publish an order when its last item ships

Publishing was previously triggered by the nightly job, which
delayed notification by up to a day. Ownership moves to the
domain (BE_04) so the rule holds for the importer too.
```

**Don't**

```
fix stuff
wip
feat: changes           # type without meaning
update OrderService.ts  # names the file, not the change
```

One logical change per commit is what makes a revert or a bisect land on something coherent. A pull request carries one concern — a refactor that came along for the ride belongs in its own ([GEN_15#R2](../index.html#GEN_15)).

**Enforcement:** partly automated — a commit-message linter enforces the format; whether the subject is meaningful is review.

### [R5](#R5) and [R6](#R6) Rebase, and what may never be rewritten

Update a branch by rebasing it onto the default branch, so its commits stay a linear series that applies to current code. Merging the default branch *into* a feature branch produces merge commits that mean nothing and make the branch's own history unreadable.

Rewriting is fine on your own branch and forbidden everywhere else. Never force-push a branch someone else has checked out — coordinate first — and never rewrite the default branch, which invalidates every clone and every reference to a commit that no longer exists. Protection should make the second impossible rather than merely discouraged ([R9](#R9)).

How the branch finally lands — squash, rebase, or a merge commit — is one policy for the repository, chosen once and enforced by the platform, not per pull request.

**Enforcement:** partly automated — branch protection can forbid force-pushes to the default branch; the merge method is a repository setting.

### [R7](#R7) Attribution

Work done with an AI assistant is attributed in the commit trailer, as a co-author. This is not ceremony: it tells a future reader what kind of review the change had, and it keeps the record honest about how the code came to exist. The author remains the person who ran it and is accountable for it ([GEN_02](../index.html#GEN_02)).

**Enforcement:** review.

### [R8](#R8) Templates and ownership

The pull request template asks for what a review needs: what changed, why, the conventions relied on, how it was verified, and what is deliberately not done ([GEN_06](../index.html#GEN_06)). The issue templates separate a defect from a request, because they need different information.

CODEOWNERS names a reviewer for every path, with a catch-all so nothing is unowned. The point is routing, not gatekeeping: an unowned path is one where nobody is notified, and changes there get the least scrutiny precisely because nobody is watching.

**Enforcement:** partly automated — the platform can require review from code owners; template completeness is review.

### [R9](#R9) and [R10](#R10) Protection, and the line

The default branch requires: no direct pushes, at least one approving review, the required checks green, and the branch up to date with the default before merging. The last one matters more than it looks — two changes that each pass alone can fail together, and being up to date is what catches it before the merge rather than after.

Required checks are the ones that would let a defect through: lint, types, tests, build, the guardrails ([INFRA_06](../index.html#INFRA_06), [INFRA_09](../index.html#INFRA_09)). Not every job needs to be required, but every required job must be reliable — a flaky required check teaches people to re-run until green, which is how a real intermittent failure gets merged ([BE_11#R10](../index.html#BE_11)).

Never merge red, and never use an administrative bypass to do it. If protection is genuinely wrong, change the protection in the open. Bypassing it silently removes the only control that does not depend on someone remembering.

**Enforcement:** automated — branch protection is enforced by the platform once configured; that the configuration matches this rule is review.

## Worked example

A defect: enrolling twice creates two records.

The branch is `fix/1284-duplicate-enrolment` ([R2](#R2)), cut from the default branch that morning. The work is two commits, because it is two things: a failing test that reproduces the defect, then the fix ([R4](#R4), [GEN_05](../index.html#GEN_05)). Splitting them means the test can be verified to fail without the fix — which is the only proof the test tests anything.

```
test(enrolment): reproduce duplicate enrolment on repeat submit
fix(enrolment): reject a second enrolment for the same learner
```

The fix's body says the uniqueness rule moved to the aggregate, cites the convention, and notes that the existing duplicates are not cleaned up by this change ([R3](#R3)). The trailer attributes the AI assistance ([R7](#R7)).

Two days in, the default branch has moved. The branch is rebased onto it, not merged from it ([R5](#R5)) — and since a colleague had checked the branch out to review it, the force-push is coordinated first ([R6](#R6)).

CODEOWNERS routes the review to the module's owner ([R8](#R8)). A required check fails: a guardrail rejects an import the fix introduced. The change is adjusted; the guardrail is not ([INFRA_06#R6](../index.html#INFRA_06)). Merging waits for green and for the branch to be up to date ([R9](#R9), [R10](#R10)).

The one thing that does not happen: nobody uses an administrative merge because the fix is urgent. Urgency is the condition under which protection is most valuable and most likely to be bypassed.

## Checklist

- The branch is short-lived, cut from the default branch, and named to the pattern ([R1](#R1), [R2](#R2)).
- Commits follow Conventional Commits, carry the ticket in the scope, and say why in the body ([R3](#R3)).
- One logical change per commit; one concern per pull request ([R4](#R4)).
- The branch was rebased, not merged into ([R5](#R5)); no shared branch was force-pushed ([R6](#R6)).
- AI-assisted work is attributed in the trailer ([R7](#R7)).
- The pull request template is filled in, and CODEOWNERS routes the review ([R8](#R8)).
- Required checks are green and the branch is up to date ([R9](#R9)); nothing was bypassed ([R10](#R10)).

## Open questions

- The merge method ([R5](#R5)) is stated as "one policy" without naming it, because squash and rebase trade differently against [R4](#R4)'s per-commit discipline: squashing discards the two-commit structure the worked example depends on. It should be decided in an ADR.
- Nothing here defines a hotfix path. Every rule above assumes there is time; the one case where there is not is exactly where bypasses happen, and it deserves a written procedure rather than an improvisation.
- Whether release tagging and changelog generation derive from the commit types is assumed but unowned — it belongs with [INFRA_11](../index.html#INFRA_11), and until it exists the Conventional Commit types buy less than they could.

## Related

Requires [GEN_06](../index.html#GEN_06). See also [INFRA_09](../index.html#INFRA_09).

---

[← All conventions](../index.html)
