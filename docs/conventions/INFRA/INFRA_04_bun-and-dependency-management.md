---
title: "INFRA_04 · Bun runtime & dependency management"
id: "INFRA_04"
area: "INFRA"
tier: "P1"
status: "draft"
updated: "2026-09-06"
requires: [INFRA_01]
see_also: [INFRA_15]
---

[Conventions](../index.html) / Infrastructure / INFRA_04

# [Infra] Bun runtime & dependency management

`P1` · `INFRA_04` · `draft` · `updated 2026-09-06`

**Open when:** you are adding, upgrading or removing a dependency — or a workspace will not run on Bun.

Bun as runtime and package manager, lockfile policy, version pinning, where a dependency belongs, the rules for adding one, and the per-workspace runtime override for the cases that still need Node.

## The rules

If you read nothing else:

1. <a id="R1"></a>One package manager, one lockfile at the root: committed, generated, never hand-edited, never produced by another tool.
2. <a id="R2"></a>Install exactly what the lockfile says, in CI and in images. Never let a build resolve versions.
3. <a id="R3"></a>A dependency belongs to the workspace that imports it. The root holds only what the repository itself runs.
4. <a id="R4"></a>Split runtime and development dependencies by what has to exist in production.
5. <a id="R5"></a>Declare one version per dependency for the whole repository, and pin exactly anything that shapes a build.
6. <a id="R6"></a>Constrain the install itself: install scripts by allow-list, and no version younger than the maturity window.
7. <a id="R7"></a>Adding a dependency is a decision: say what it does, what it replaces, and what it costs.
8. <a id="R8"></a>Check the platform first. Do not install what the runtime already provides.
9. <a id="R9"></a>Upgrade in its own change, one thing at a time, with the changelog read.
10. <a id="R10"></a>Where a workspace genuinely needs a different runtime, declare that at the workspace, never globally.

## Why

Dependencies are the largest thing in the repository nobody wrote, and their failures are quiet. Versions drift between two machines or two workspaces, and the difference surfaces as a bug that reproduces for one person. Packages accrete: each arrives solving a real problem and stays forever, carrying transitive dependencies, install time, bundle size, a licence, and an attack surface someone else maintains.

The third failure is the most expensive. Installing a package runs someone else's code on your machine and in your pipeline, before any review — so a compromised release executes before anyone has read a diff. Most are caught and pulled within days, which is what makes [R6](#R6)'s two defenses effective for their cost: refuse install scripts you did not opt into, and refuse versions younger than the window in which those incidents get caught.

The rest is determinism. A committed lockfile plus frozen installs means what ran in the pipeline is what runs in the image; one declared version per dependency means two workspaces cannot disagree about what they compile against.

## Rule detail

### [R1](#R1) and [R2](#R2) One manager, one lockfile, frozen installs

Which package manager and runtime this project uses is a fact in `PROJECT.md`; this document says only that there is exactly one of each. A second manager's install produces a second lockfile whose resolutions differ, and from then on "what version is installed" depends on who ran what last.

The lockfile is at the root, covers every workspace, and is committed — the record of what was actually tested. It is generated, never edited, and a conflict in it is resolved by re-running the install rather than picking lines.

Automated environments install frozen, failing when the lockfile and manifests disagree. A build that resolves versions tests something other than what you committed ([INFRA_09](../index.html#INFRA_09), [INFRA_10](../index.html#INFRA_10)).

**Enforcement:** partly automated — a frozen install fails on drift wherever it is used; that every environment uses it is review.

### [R3](#R3) and [R4](#R4) Where a dependency lives

A dependency belongs to the workspace whose code imports it ([INFRA_03#R2](../index.html#INFRA_03)). The root holds only what the repository itself runs — the task runner, the formatter, the shared configs. A library at the root because two workspaces need it makes both lie about their dependencies and breaks building one alone.

The runtime/development split turns on one question: does production need this at run time? A runtime dependency parked in development installs fine locally and crashes in an image built without development dependencies ([INFRA_10](../index.html#INFRA_10)).

**Enforcement:** review — a workspace importing something it does not declare is mechanically detectable ([INFRA_06](../index.html#INFRA_06)).

### [R5](#R5) One version, declared once

Two workspaces on two versions of the same library is the monorepo's characteristic dependency bug: the type packages disagree, two copies land in one bundle, and identity checks across the boundary fail for reasons that look impossible. Declare the version **once**, in a shared catalog the workspaces reference by name, so upgrading is one edit and drift is not expressible.

**Do**

```
# the catalog — one declared version for the whole repository
catalog:
  zod: 3.25.76
  typescript: ^6.0.3

# a workspace references it by name, never by version
"dependencies": { "zod": "catalog:" }
```

**Don't**

```
apps/api/package.json   "zod": "^3.25.0"
apps/web/package.json   "zod": "^3.24.1"    # two versions, one concept
```

Where a workspace genuinely needs a different version — a tool that has not caught up — that is a second, named catalog entry with a comment saying why, not a loose range in one manifest.

Pin exactly anything that produces output or shapes a build: formatter, linter, compiler, bundler, task runner, test runner. A patch bump in a formatter reformats the repository; one in a linter fails a pipeline nobody touched. Libraries may carry a range, since the lockfile already fixes what is installed.

**Enforcement:** review — a version literal where a catalog reference belongs is checkable across manifests ([INFRA_06](../index.html#INFRA_06)).

### [R6](#R6) Constrain the install

Two settings, both cheap, both defending against the same thing: code that executes before anyone reviews it.

**Install scripts run by allow-list.** Install hooks are arbitrary code running with your credentials. Default to running none and opt in per package — the handful that genuinely compile something. The allow-list also makes the set visible: a new entry is a line someone approves.

**No version younger than the maturity window.** A compromised release is usually discovered and pulled within days, so refusing anything published more recently than a fixed window — a week is a reasonable default — means the repository is never the one that finds out first.

Exceptions matter as much as the rule. A security fix is often newer than the window, so each exclusion is listed with a comment naming the advisory and why it cannot wait ([INFRA_15](../index.html#INFRA_15) owns the audit that finds them). That comment is the difference between a considered exception and a hole.

**Do**

```
minimumReleaseAge: 10080          # one week, in minutes

minimumReleaseAgeExclude:
  # GHSA-xxxx-… middleware bypass, fixed in 16.2.11 — newer than the window.
  - "next"

allowBuilds:
  sharp: true                     # native image codecs, genuinely needed
  "@scarf/scarf": false           # telemetry on install
```

**Enforcement:** partly automated — the package manager enforces both once configured; that every exclusion carries a reason is review.

### [R7](#R7) and [R8](#R8) The cost of one more

Check what the platform already does first. Runtimes and browsers have absorbed most of what small utility packages were written for — dates, formatting, ids, deep equality, fetch, test running. A dependency saving five lines is rarely worth its supply chain.

When one is warranted, the pull request says what problem it solves, what it replaces or what nothing existing could do ([GEN_16](../index.html#GEN_16)), and what it costs — transitive weight, whether it ships to the browser, its licence, and whether it needs an install script ([R6](#R6)). A sentence. It is the only record of the reasoning that will exist in two years.

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

### [R9](#R9) Upgrades are their own change

An upgrade lands separately from feature work, so a regression bisects to the upgrade rather than hiding inside a change that also altered behavior. One dependency at a time where it is load-bearing; grouping is fine for routine patch movement that cannot change behavior.

Read the changelog for anything crossing a major version, and say in the pull request what you checked. "Tests pass" is not that — the tests were written against the old behavior, and the interesting changes are the ones no test covers. Cadence and audit obligations are [INFRA_15](../index.html#INFRA_15)'s.

**Enforcement:** review.

### [R10](#R10) Runtime overrides stay local

Occasionally a workspace cannot run on the standard runtime — a native module, a tool that assumes a specific implementation. That is a property of *that workspace*: declared there, with a comment naming the reason and the condition under which it can be removed.

What must not happen is the whole repository moving to accommodate one workspace, which converts a local problem into a global one and makes the exception invisible to everyone who did not cause it.

**Enforcement:** review.

## Worked example

A view needs relative times: "3 hours ago".

The first question is [R8](#R8): can the platform do it? Modern runtimes have a relative-time formatter with locale support, so the change adds a shared helper and no dependency ([GEN_16](../index.html#GEN_16)).

Now a case where the answer is no: the project must parse spreadsheets. The dependency goes to the workspace that imports it ([R3](#R3)), as a runtime dependency ([R4](#R4)), at a version declared once in the catalog so the worker cannot later resolve a different one ([R5](#R5)). The pull request states what it does, that nothing existing covers it, its weight, its licence, and that it needs no install script ([R7](#R7)).

It is four days old, so the install refuses it ([R6](#R6)). That is the rule working: the change waits three days rather than adding an exclusion. An exclusion would be right only for a security fix, and then it carries the advisory id in a comment.

The lockfile updates as generated output and is committed ([R1](#R1)); CI installs frozen, so a lockfile that disagrees with the manifest fails the pipeline instead of resolving something new ([R2](#R2)).

Two months later a major version appears. It lands on its own branch with nothing else in it ([R9](#R9)). The changelog says date cells now return a different type; the pull request names that, points at the two call sites, and shows the test that would have failed. That sentence is why the upgrade is safe to merge — and it is what "all tests pass" would have missed, because no test asserted the old type.

## Checklist

- Only the project's package manager was used; no second lockfile appeared, and the lockfile was not hand-edited ([R1](#R1)).
- Installs are frozen in CI and in images ([R2](#R2)).
- The dependency is declared in the workspace that imports it, on the correct side of the runtime/development split ([R3](#R3), [R4](#R4)).
- Its version comes from the catalog; tools that shape output are pinned exactly ([R5](#R5)).
- No new install script was enabled without an allow-list entry, and any maturity-window exclusion names its advisory ([R6](#R6)).
- The pull request states what the dependency does, what it replaces, and what it costs ([R7](#R7)), and the platform was checked first ([R8](#R8)).
- Upgrades are separate changes with the changelog read ([R9](#R9)).
- Any runtime override is declared at the workspace, with its reason ([R10](#R10)).

## Open questions

- [R6](#R6)'s window has no stated length here because it trades responsiveness against exposure; a week is the common choice and should be recorded in an ADR once set, along with who may add an exclusion.
- Nothing says what to do about an unmaintained dependency that still works. A staleness signal in the audit ([INFRA_15](../index.html#INFRA_15)) would surface it; the policy for acting on it is unwritten.
- Whether automated update proposals are wanted — and grouped how — is undecided, and interacts directly with [R9](#R9)'s one-at-a-time rule and with [R6](#R6)'s window.

## Related

Requires [INFRA_01](../index.html#INFRA_01). See also [INFRA_15](../index.html#INFRA_15).

---

[← All conventions](../index.html)
