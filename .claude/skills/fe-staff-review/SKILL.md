---
name: fe-staff-review
description: Have the staff frontend engineer review a change to apps/web, then fix what it finds and review again until it meets the staff bar. Use when asked for a staff FE review, to review the frontend, or to loop on a change until it meets the staff standard.
---

# Staff FE review loop

Runs the `staff-fe-engineer-reviewer` agent over a change to `apps/web`, fixes what it finds, and
repeats until the verdict is **MEETS**: no `blocker` and no `major` finding.

The reviewer only reads. This session fixes. Asking for this skill is the instruction to spawn that
agent, which is what `CLAUDE.md` requires before any subagent.

**Arguments:** what to review, if given: a commit, a range, or a feature. Anything else in the
arguments is a focus to add to the brief.

## 1. Fix the scope

Without an argument, the scope is everything in `apps/web` on this branch against `main`, committed
or not, untracked files included:

```bash
git diff main...HEAD --stat -- apps/web
git status --short apps/web
```

If another session has work in this worktree, leave its files out of the scope and out of every fix.

## 2. Brief the reviewer

Launch `staff-fe-engineer-reviewer` in the background. It knows only what the brief says, so give it:

- the scope, as the exact commands that show it;
- **what the owner asked for**, as a list of behaviours taken from the conversation or the ticket.
  That list is the specification. State decisions as decisions, not as things to re-argue;
- what is known to be unfinished, so it is not reported as a defect.

Give it the code and the requirements, not your opinion of them.

## 3. Check each finding before acting on it

Read the code at each finding. A review can be wrong.

| The finding is | Do |
| --- | --- |
| Right, and keeps behaviour the same | Fix it |
| Right, but the fix changes what a person sees or does | Stop and ask the owner. Do not decide it here |
| Wrong | Do not fix it. Record why, and tell the reviewer in the next round |
| `minor` | Fix it if it is cheap. Otherwise list it as a trade-off in the report |

Fix every `blocker` and `major`. A missing scenario test (`T`) is fixed by writing that test. If a
new test fails, the test has found a bug: fix the code, not the test.

## 4. Prove the fixes

Node must be 24 or newer on the `PATH`. Run these from the repository root:

```bash
bun run check:style && bun run check:types && bun run check:arch
bun run test -- --force
bun run build
```

Where a fix changes how something behaves in a browser, use it in a real browser too: jsdom cannot
show layout, real focus order or animation, and a passing suite has missed bugs of exactly those
kinds here.

## 5. Review again

Send the earlier findings back to the **same** reviewer with `SendMessage`, saying which were fixed,
which were rejected and why. It confirms each one and looks for what the fixes broke.

Stop when any of these is true:

- The verdict is **MEETS**.
- Four rounds have run.
- The same finding comes back twice with no new evidence: it is a disagreement, so take it to the
  owner.

## 6. Report

Say plainly:

- the final verdict, and how many rounds it took;
- what was fixed, in the owner's terms: what changes for a person, not which file changed;
- what the reviewer found that was rejected, and why;
- the `minor` findings left, each with why;
- what needs the owner's decision;
- what nobody could check.

Do not commit or push unless asked. When asked, stage files by name.
