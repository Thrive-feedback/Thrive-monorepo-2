---
title: "INFRA_09 · CI pipeline (GitHub Actions)"
id: "INFRA_09"
area: "INFRA"
tier: "P1"
status: "draft"
updated: "2026-09-06"
requires: [INFRA_06]
see_also: [INFRA_11, INFRA_13]
---

[Conventions](../index.html) / Infrastructure / INFRA_09

# [Infra] CI pipeline (GitHub Actions)

`P1` · `INFRA_09` · `draft` · `updated 2026-09-06`

**Open when:** CI is failing, or you are adding a check.

The job graph (lint → typecheck → unit → build → integration → e2e), affected-only runs through Turbo, cache use, the flaky-test policy, and which checks are required to merge.

## The rules

If you read nothing else:

1. <a id="R1"></a>Every merge candidate runs the same pipeline, from a clean checkout, on pinned versions.
2. <a id="R2"></a>Order jobs cheapest and broadest first, so the common failure is reported in a minute.
3. <a id="R3"></a>Run only what the change affects, using the task graph rather than a hand-written list of paths.
4. <a id="R4"></a>Install from the lockfile in frozen mode. A pipeline never resolves a version.
5. <a id="R5"></a>Cache only what is deterministic, keyed by its inputs. Never cache a result you have not proven.
6. <a id="R6"></a>Every job runs a command a developer can run locally, with the same arguments.
7. <a id="R7"></a>Never merge red and never re-run a job to pass. Quarantine a flake with an owner and a date.
8. <a id="R8"></a>Bound every job with a timeout, cancel superseded runs, and split a suite that outgrows its runner.
9. <a id="R9"></a>Give the pipeline the least privilege it needs, and take its secrets from the platform's store.
10. <a id="R10"></a>Land a pipeline change with the change that needs it, and review it as code.

## Why

The pipeline is where every convention in this set becomes non-optional. A guardrail that runs only on someone's machine is advice; the same guardrail as a required check is a fact about merging ([INFRA_06](../index.html#INFRA_06), [INFRA_08#R9](../index.html#INFRA_08)). Its reliability decides whether the whole set has teeth.

Reliability means two things. The pipeline must be *trusted* — a red result always means something is wrong, so nobody learns to re-run it. And it must be *fast enough* that people wait for it rather than working around it; a thirty-minute pipeline gets bypassed exactly when the checks matter most.

Those pull against each other, which is what most of these rules are about: order the work so failures surface early, run only what a change can have broken, cache what cannot change — without trading away the guarantee that green means safe.

## Rule detail

### [R1](#R1) and [R2](#R2) One pipeline, ordered by cost

Every candidate for the default branch runs the same jobs, from a clean checkout, on the versions the repository pins ([INFRA_04](../index.html#INFRA_04)). No manually triggered variant and no "skip CI" for a trivial-looking change — those are the ones merged without thinking.

Order by how cheap the feedback is and how many failures it catches:

| Stage | Catches |
| --- | --- |
| Lint, format, type-check, guardrails | Most mistakes, in seconds, without building anything |
| Unit tests | Domain and use-case defects ([BE_11](../index.html#BE_11), [FE_14](../index.html#FE_14)) |
| Secret scan, dependency audit | Credentials in the diff, and known advisories in the tree ([INFRA_15](../index.html#INFRA_15)) |
| Build | Anything the type-checker missed; produces the artifact later stages use |
| Integration | Adapters against real backing services ([BE_12](../index.html#BE_12)) |
| Acceptance / browser | Whole flows, on the built artifact ([BE_13](../index.html#BE_13), [FE_15](../index.html#FE_15)) |

Run independent jobs in parallel; keep the dependency edges that matter, so a compile error is not discovered by a browser suite twenty minutes in.

**Enforcement:** review.

### [R3](#R3) Affected-only, from the graph

A change to one workspace does not need every workspace's tests. Let the task runner compute the affected set from the dependency graph, diffed against the pull request's base ([INFRA_13](../index.html#INFRA_13)) — never a hand-maintained mapping of paths to jobs, which is wrong the first time a dependency changes and silently skips what broke.

One exception: on the default branch and before a release, run everything. Affected-only optimizes feedback speed; it is not a statement that the repository is healthy.

**Enforcement:** partly automated — the task runner computes the affected set; that the pipeline uses it rather than a path filter is review.

### [R4](#R4) and [R5](#R5) Frozen installs, honest caches

Install in a mode that fails when the lockfile and the manifests disagree ([INFRA_04#R3](../index.html#INFRA_04)). A pipeline that resolves versions tests something other than what was committed, and its green result means less than it appears to.

Cache aggressively but only what is deterministic, keyed by everything that can change the output: the lockfile for dependencies, the task's declared inputs for its outputs — **including the environment variables the task reads**, which are the input people forget. A task whose behavior depends on an undeclared variable will be served a cached result computed under a different one, which is a green pipeline that tested something else. If a task's inputs cannot be stated precisely, it is not cacheable yet ([INFRA_13](../index.html#INFRA_13)).

**Enforcement:** review.

### [R6](#R6) Nothing exists only in the pipeline

Every job runs a task the repository already exposes, with the arguments a person would use ([INFRA_01#R7](../index.html#INFRA_01)). Logic living only in the pipeline — a bespoke command, an inlined script, a flag nobody has locally — cannot be reproduced when it fails, so debugging becomes commit-and-wait. The test: can a failing job be reproduced by copying one command out of it?

**Enforcement:** review — an inline shell script of any length in a job is visible in the diff.

### [R7](#R7) Red means red

A red pipeline blocks the merge, and the response is to fix the cause. Re-running until green is the single most damaging habit available here: it converts an intermittent defect into a permanently green build, and the next person to see that defect is a user ([BE_11#R10](../index.html#BE_11)).

When a test is genuinely flaky, it is telling you about a race — usually in the application, not the test. Quarantine it in the change that noticed it, with an owner and a date, so the suite goes green honestly and the problem stays visible. What is not acceptable is an automatic retry wrapper around the suite, which hides the same information permanently.

**Enforcement:** review — an automatic retry setting is visible in the pipeline configuration and should be treated as a change to this rule.

### [R8](#R8) Job hygiene: bound, cancel, split

Three settings that decide whether the pipeline stays usable as it grows, and all three are one line each.

**A timeout on every job.** A job with no bound does not fail — it hangs, holds a runner, and is eventually killed by a platform limit twenty minutes later with no useful output. Set the timeout a little above the job's honest worst case, so a hang is reported as a hang. It is also the only mechanism that makes [R9](#R9)'s time budget real: a job that outgrows its timeout forces the conversation rather than quietly costing everyone four minutes.

**Cancel superseded runs.** When a branch is pushed twice, the first run's result is worthless before it finishes. Group runs by branch and cancel the in-flight one on a new push. This is pure saving — shorter queues for everyone — with one exception: never cancel runs on the default branch, where each commit's result is a fact someone may need.

**Split a suite that outgrows its runner.** When one suite dominates wall-clock time, run it as parallel jobs over disjoint slices rather than accepting the wait or deleting tests. Sharding needs exactly the property [BE_12#R4](../index.html#BE_12) and [FE_15#R8](../index.html#FE_15) already require — no dependence between scenarios — so a suite that cannot be sharded is reporting an isolation defect.

**Enforcement:** review — a missing job timeout is mechanically detectable in the pipeline definition and is a candidate guardrail ([INFRA_06](../index.html#INFRA_06)).

### [R9](#R9) and [R10](#R10) Privilege, and changing the pipeline

The pipeline holds credentials, so it is a target. Give each job least privilege — read-only by default, write only where it publishes — and take secrets from the platform's store ([INFRA_07#R4](../index.html#INFRA_07)). Never expose secrets to a job triggered by an untrusted contribution, and pin third-party actions to an immutable reference rather than a moving tag ([INFRA_15](../index.html#INFRA_15)).

Pipeline definitions are code: reviewed, changed with the work that needs them, never edited on the default branch to "just try something". A pipeline change that cannot be tested before merging argues for thinner jobs ([R6](#R6)).

**Enforcement:** partly automated — permissions are declared per job and enforced by the platform; least privilege is review.

## Worked example

A change adds a cache adapter to the API app.

Lint, type-check and the guardrails run first and finish in under a minute ([R2](#R2)). The affected set from the task graph is the API app and the packages it depends on; the web app's tests do not run, because nothing it imports changed ([R3](#R3)).

Unit tests pass. The build produces the artifact. Integration tests then start the cache service the repository defines and run the adapter's suite against it ([BE_12](../index.html#BE_12)) — the first stage in the pipeline that needs a service, which is why it is not first ([R2](#R2)).

The acceptance suite fails intermittently. The tempting move is a re-run, and it would go green ([R7](#R7)). Instead the failure is read: two scenarios share a cache key because both create a user with the same fixture email, so one evicts the other's entry. That is an isolation defect ([BE_12#R3](../index.html#BE_12)), fixed rather than retried — exactly the bug a retry hides until it reaches production as a cross-user cache collision.

Meanwhile the pipeline change itself: the integration job needs the cache service, which is one line in the job's service definition, using the same version the repository's local stack uses ([INFRA_10](../index.html#INFRA_10)). It runs the existing integration task with no new arguments ([R6](#R6)), carries a timeout above its honest worst case, and lands in the same pull request as the adapter ([R8](#R8), [R10](#R10)).

## Checklist

- The change runs the standard pipeline from a clean checkout ([R1](#R1)).
- New jobs are placed by cost, not by convenience ([R2](#R2)).
- Job selection comes from the task graph, not a path filter ([R3](#R3)).
- Installs are frozen ([R4](#R4)); new caches are keyed by their real inputs ([R5](#R5)).
- Every job runs a task a developer can run locally ([R6](#R6)).
- Nothing was merged red, no job was re-run to pass, and any flake is quarantined with an owner and a date ([R7](#R7)).
- Every new job has a timeout; superseded runs cancel; no suite is silently over budget ([R8](#R8)).
- New jobs declare least privilege and take secrets from the store ([R9](#R9)).
- The pipeline change landed with the work that needed it ([R10](#R10)).

## Open questions

- No total time budget is stated for the pipeline. Per-job timeouts ([R8](#R8)) bound the worst case but do not stop the sum creeping up one job at a time, and nothing reports the trend.
- [R7](#R7) names quarantine but no mechanism; without a tag and a visible list, a quarantined test is a deleted test.
- Sharding ([R8](#R8)) has no stated threshold — how slow a suite must be before it is split, and how the slices are balanced, will be decided by whoever hits it first.
- Whether the default branch runs the full suite on every merge or on a schedule is undecided, and it trades merge latency against how quickly a cross-workspace breakage is found ([R3](#R3)).

## Related

Requires [INFRA_06](../index.html#INFRA_06). See also [INFRA_11](../index.html#INFRA_11), [INFRA_13](../index.html#INFRA_13).

---

[← All conventions](../index.html)
