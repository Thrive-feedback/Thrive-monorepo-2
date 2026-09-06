---
title: "INFRA_05 · Code quality tooling — Biome, Prettier, type-check"
id: "INFRA_05"
area: "INFRA"
tier: "P1"
status: "draft"
updated: "2026-09-06"
requires: [GEN_07]
see_also: [INFRA_06]
---

[Conventions](../index.html) / Infrastructure / INFRA_05

# [Infra] Code quality tooling — Biome, Prettier, type-check

`P1` · `INFRA_05` · `draft` · `updated 2026-09-06`

**Open when:** a lint rule blocks you, or you want to add or waive one.

Which tool owns what (Biome for lint and format; Prettier only for what Biome cannot handle), the shared config packages, editor setup, pre-commit hooks, and the process for changing a rule.

## The rules

If you read nothing else:

1. <a id="R1"></a>One formatter, one linter, one type-checker. Each owns its domain and none overlaps another.
2. <a id="R2"></a>Formatting is not a review topic. The formatter decides, and its output is not argued with.
3. <a id="R3"></a>Keep a second formatter only for files the primary one cannot handle, and name those files explicitly.
4. <a id="R4"></a>Configuration lives in shared config packages. A workspace extends; it never forks.
5. <a id="R5"></a>A rule is on for everyone or off for everyone.
6. <a id="R6"></a>A waiver is inline, narrow, and states the reason. A file-wide or repo-wide disable is not a waiver.
7. <a id="R7"></a>Never weaken a rule to make a change pass.
8. <a id="R8"></a>Type-checking is a task like any other, run locally and in the pipeline, at the strictest setting the code sustains.
9. <a id="R9"></a>Commit the editor settings and the git hooks, so a fresh clone formats, lints and pushes like everyone else's.
10. <a id="R10"></a>Changing a rule is a repository decision, and a change that rewrites existing code carries an ADR.

## Why

Two things make this worth writing down, and neither is code style. The first is that formatting arguments are pure cost: every minute spent on where a brace goes is a minute not spent on whether the code is right, and a tool that decides removes the topic permanently. The value is not the style chosen; it is that nobody chooses again.

The second is that lint rules are conventions with teeth. A rule in a document is advice a reader may not have read; the same rule in a linter is a fact the change must satisfy. That makes the linter the cheapest place to put any convention narrow enough to express there ([INFRA_06](../index.html#INFRA_06)) — and it makes weakening one a much bigger act than it looks, because it silently revokes a decision for everyone.

The third, quieter reason is uniformity across workspaces. Configuration copied into each workspace drifts, and drift means a rule enforced in the API and not in the web app, discovered when someone moves code between them.

## Rule detail

### [R1](#R1), [R2](#R2) and [R3](#R3) One tool per job

Three jobs, three owners. The formatter decides layout. The linter decides patterns — correctness, hazards, conventions. The type-checker decides types. Where a tool can do two of these, it does; what matters is that only one tool owns each, because two tools with opinions about the same thing fight on every save.

Formatting is therefore not a review topic ([R2](#R2)): a review comment about layout is a bug report against the formatter's configuration, not feedback on the change. And a second formatter is kept only for file types the primary one does not support — named explicitly, scoped to those files, never overlapping. Which tools this project uses, and whether a second is needed at all, is a fact in `PROJECT.md`; the entry for this document names the intended ones, and where the repository has not caught up, that gap belongs in `PROJECT.md`, not here.

**Enforcement:** partly automated — a formatting check in the pipeline enforces [R2](#R2); tool ownership and overlap are review.

### [R4](#R4) and [R5](#R5) Shared configuration, uniform rules

Each tool's configuration lives in a config package that workspaces extend ([INFRA_01#R8](../index.html#INFRA_01), [INFRA_03#R7](../index.html#INFRA_03)). A workspace may add what is genuinely specific to it — the framework preset it needs, the environment its files run in — and may not turn a shared rule off.

That is [R5](#R5), and it is the rule that keeps the set meaningful. A rule enabled in one workspace and disabled in another is not a convention; it is a preference with a location. If a rule is wrong for one workspace, it is worth asking whether it is wrong everywhere — and that question is answered once, in the shared config, not per directory.

**Enforcement:** review — a workspace-level override that disables a shared rule is visible in the diff and is a candidate guardrail ([INFRA_06](../index.html#INFRA_06)).

### [R6](#R6) and [R7](#R7) Waivers, and the line that is never crossed

A legitimate waiver is a single line, at the place it applies, naming the rule and the reason:

**Do**

```
// biome-ignore lint/suspicious/noExplicitAny: third-party callback is typed as any upstream
```

**Don't**

```
/* eslint-disable */                    // the whole file, no reason, forever
"rules": { "noExplicitAny": "off" }     // the whole repository, to fix one call site
```

The difference is scope and evidence. An inline waiver is visible where the exception lives, expires when the line is deleted, and can be counted. A file-level or repository-level disable removes the rule from code nobody was thinking about, and it never comes back.

[R7](#R7) is the hard rule behind that: never weaken a rule — or a type, or a guardrail — to make your change pass. Fix the change, or raise the rule for discussion in the open ([R10](#R10)). This is the one place where "it was blocking me" is not a reason, because that is what the rule is for.

**Enforcement:** review — added waivers and any loosened rule in a config package are visible in the diff; counting waivers over time is a candidate guardrail ([INFRA_06](../index.html#INFRA_06)).

### [R8](#R8) Type-checking is a task

The type-checker is not something the editor does; it is a task every workspace exposes ([INFRA_01#R7](../index.html#INFRA_01)), run locally and in the pipeline ([INFRA_09](../index.html#INFRA_09)). An editor checks the file you have open; a task checks the repository, including the file your change broke three packages away.

Run it at the strictest setting the code sustains, and treat loosening a compiler flag exactly as [R7](#R7) treats a lint rule — a repository decision, not a local unblock. The rules about what the types themselves must look like are [GEN_07](../index.html#GEN_07)'s.

**Enforcement:** partly automated — the task fails on error; the strictness setting itself is review.

### [R9](#R9) Editors and hooks

Editor settings that make a fresh clone behave correctly — format on save, the right formatter per file type, the recommended extensions — are committed. Onboarding should not include configuring a machine to match invisible expectations ([INFRA_02#R8](../index.html#INFRA_02)).

Hooks are the same idea at the other end, and their division of labour is decided by cost. Three stages, each doing the most it can afford:

| Hook | Runs | Why there |
| --- | --- | --- |
| pre-commit | Format and lint **the staged files only**, writing fixes back and re-staging them | Instant, and it means formatting never reaches review ([R2](#R2)) |
| commit-msg | The commit-message linter | The only moment the message exists to check ([INFRA_08#R3](../index.html#INFRA_08)) |
| pre-push | Lint, type-check, tests and guardrails **for what changed against the default branch** | Seconds to a couple of minutes, and it catches what would otherwise be a red pipeline ten minutes later |

The pre-push filter is what makes this bearable: scoping to the affected workspaces means a one-package change does not run the repository ([INFRA_09#R3](../index.html#INFRA_09)). Hooks never replace the pipeline — they can be skipped, and they run on a machine nobody controls ([INFRA_09#R1](../index.html#INFRA_09)) — but a hook that catches a failure before a push saves a full pipeline round trip, which is the cheapest feedback in this document.

**Enforcement:** partly automated — the hook manager installs the hooks from a committed configuration; that a developer has not bypassed them is not checkable, which is why the pipeline repeats the same checks.

### [R10](#R10) Changing a rule

Changing a rule follows the same path as changing any convention ([GEN_01#R10](../index.html#GEN_01)): propose it, state what it will do to existing code, and land the rule with the fixes in the same change so the repository is never in a state where the tool disagrees with the code. When the change rewrites code broadly — a formatting change, a rule that touches hundreds of files — it carries an ADR, because the reasoning matters more than the diff, which nobody will read ([GEN_13](../index.html#GEN_13)).

**Enforcement:** review.

## Worked example

A rule fires on a change: the linter rejects a non-null assertion, which [GEN_07#R4](../index.html#GEN_07) also bans.

The tempting fixes are both forbidden. Adding a repository-level disable turns the rule off for code nobody is looking at ([R6](#R6)); adding an inline waiver "for now" is a waiver with no reason, which is the same thing at smaller scale ([R7](#R7)).

The real fix is usually that the type is wrong: the value is optional because the function that produced it can genuinely return nothing, and the assertion was hiding that. Handling the absent case satisfies the linter and fixes a defect that had not happened yet.

Now the case where the rule is genuinely wrong. A third-party library's callback is typed loosely upstream, and there is no way to express the correct type at the boundary. That earns an inline waiver naming the rule and the upstream reason ([R6](#R6)) — one line, at the call site, which someone can find and delete when the library is fixed.

And the case where the *rule* should change. Reviewers keep waiving the same rule for the same legitimate reason, five times in a month. That is evidence, and it is a proposal: change the shared configuration, state what it does to existing code, land the rule and the resulting fixes together, and record an ADR if the change is broad ([R10](#R10)). The five waivers are deleted in that same change, because a waiver for a rule that no longer exists is exactly the kind of stale artifact [GEN_16#R9](../index.html#GEN_16) sweeps.

## Checklist

- No new tool overlaps another's domain ([R1](#R1)); no review comment is about formatting ([R2](#R2)).
- New configuration went into the shared config package, not a workspace ([R4](#R4)).
- No shared rule is disabled for one workspace ([R5](#R5)).
- Every waiver is inline, narrow, and states its reason ([R6](#R6)).
- No rule, type or compiler flag was loosened to make the change pass ([R7](#R7)).
- The type-check task passes locally and in the pipeline ([R8](#R8)).
- Editor settings and hooks still make a fresh clone behave correctly ([R9](#R9)).
- A rule change lands with its fixes, and with an ADR if it rewrites code broadly ([R10](#R10)).

## Open questions

- Nothing counts waivers, so [R6](#R6)'s "narrow and justified" degrades silently: a hundred justified waivers is a rule that should have changed. A count reported per pull request is cheap and belongs to [INFRA_06](../index.html#INFRA_06).
- The boundary in [R3](#R3) — which files the primary formatter cannot handle — is a project fact that changes as tools improve, and nothing prompts a re-check. Whenever the second formatter's file list can shrink, it should.
- [R9](#R9) fixes what each hook stage does but not what happens when someone bypasses them routinely; nothing detects that, and the pipeline absorbing the failure is the intended answer ([INFRA_09](../index.html#INFRA_09)).

## Related

Requires [GEN_07](../index.html#GEN_07). See also [INFRA_06](../index.html#INFRA_06).

---

[← All conventions](../index.html)
