---
title: "INFRA_03 · Package boundaries & dependency rules"
id: "INFRA_03"
area: "INFRA"
tier: "P1"
status: "draft"
updated: "2026-08-31"
requires: [INFRA_01]
see_also: [INFRA_06, BE_03, FE_13]
---

[Conventions](../index.html) / Infrastructure / INFRA_03

# [Infra] Package boundaries & dependency rules

`P1` · `INFRA_03` · `draft` · `updated 2026-08-31`

**Open when:** you add a dependency between two workspaces, or an import feels like it crosses a line.

The allowed import graph — who may depend on whom — the public API through package entry points, the no-cycles rule, and how all of it is enforced automatically (`INFRA_06`).

## The rules

If you read nothing else:

1. <a id="R1"></a>The workspace graph is acyclic. A cycle is a defect, never a configuration to work around.
2. <a id="R2"></a>Declare every workspace you import as a dependency of the workspace that imports it.
3. <a id="R3"></a>Import a package through its entry point. Never reach past it into a file.
4. <a id="R4"></a>Dependencies point toward the reusable end: apps depend on packages, never the reverse, and never on each other.
5. <a id="R5"></a>A package's export map is its API. Adding to it is a decision; removing from it is breaking.
6. <a id="R6"></a>A shared package names no app and knows no app's configuration.
7. <a id="R7"></a>A configuration package exports configuration. It runs nothing at import time.
8. <a id="R8"></a>Reference an internal workspace by its workspace version, never by a published range.
9. <a id="R9"></a>Depend on a package because you import it, not because it is convenient to have.
10. <a id="R10"></a>Never widen a boundary rule to make a change compile.

## Why

Boundaries in a monorepo are conventions until something checks them, and everything about the tooling makes crossing one easy: the files are right there, the editor will happily autocomplete a path three directories up, and the result compiles. The damage is not the single import — it is that the graph stops predicting anything. Once a package imports an app, that package cannot be tested alone, cached independently, or extracted, and nobody finds out until they try.

Cycles are the sharpest version of the same problem. A cycle means neither workspace can be built, versioned or reasoned about without the other, and it makes build order undefined — which usually surfaces as an intermittent failure that looks like a caching bug. The fix is never configuration; it is that one of the two directions was wrong.

The other half is the entry point. A package with a declared surface can be refactored freely behind it. A package that consumers reach into has no inside, so every file in it is public API written by accident.

## Rule detail

### [R1](#R1) No cycles

If two workspaces need each other, one of three things is true: the dependency runs the wrong way and should be inverted; the shared part belongs in a third workspace both depend on; or they are one workspace pretending to be two.

Cycles inside a workspace matter too — a module cycle produces partially initialized imports, which fail in ways unrelated to their cause. Both are detectable from the import graph, which is why this is the first rule a guardrail should enforce ([INFRA_06](../index.html#INFRA_06)).

**Enforcement:** review — a cycle check over the workspace and module graphs is the cheapest high-value guardrail available ([INFRA_06](../index.html#INFRA_06)).

### [R2](#R2) Import what you declare

Every workspace you import appears in that workspace's own manifest. Relying on a dependency being hoisted, or present because a sibling installed it, produces a workspace that builds in the repository and fails anywhere else — including in a container that installs only what a manifest declares ([INFRA_10](../index.html#INFRA_10)).

The reverse also holds: a declared dependency that nothing imports is noise that slows installs and confuses the graph ([R9](#R9)).

**Enforcement:** review — undeclared and unused dependencies are both mechanically detectable ([INFRA_06](../index.html#INFRA_06)).

### [R3](#R3) and [R5](#R5) The entry point is the contract

A package declares what it exports. Consumers import from that declaration and nothing else — no path into a source file, no reach into a build output, no import of a file the export map does not name.

Two consequences. Anything reachable through the entry point is public and changing it is a consumer-visible change; anything else is free to move. And adding an export is a decision worth a sentence in the pull request, because the surface only grows by default ([FE_13](../index.html#FE_13) works the same rule at the component level).

**Do**

```
import { Button } from '@repo/ui';
```

**Don't**

```
import { Button } from '@repo/ui/src/button';
import { Button } from '../../packages/ui/src/button';
import { internalThing } from '@repo/ui/dist/internal/thing';
```

A package whose entry point exposes every file — a wildcard over its source — has declared no surface at all, which is the same as having none. Exports are chosen.

**Enforcement:** review — deep imports match a path pattern and are a strong candidate guardrail ([INFRA_06](../index.html#INFRA_06)).

### [R4](#R4) and [R6](#R6) Direction, and what a shared package may know

Apps depend on packages. Packages depend on packages. Nothing depends on an app, and no app depends on another ([INFRA_01#R6](../index.html#INFRA_01)).

The subtler rule is [R6](#R6): a shared package may not name a consumer. Not in a type, not in a constant, not in a conditional, not in a comment that explains "this is for the admin app". A package that knows who uses it has inverted the dependency in everything but the manifest, and the next consumer inherits the first one's assumptions. If behavior must vary per consumer, the consumer passes it in.

**Don't**

```
// packages/ui/src/nav.tsx
const items = isAdminApp ? ADMIN_LINKS : WEB_LINKS;   // the package knows its callers
```

**Enforcement:** review — an app name appearing in `packages/**` is greppable and is a candidate guardrail ([INFRA_06](../index.html#INFRA_06)).

### [R7](#R7) Configuration packages stay inert

A config package exports configuration objects and nothing else: no side effects at import, no environment reads, no file-system writes, no network. Consumers extend or spread what it exports.

The reason is that these packages are imported by tools during startup, often before anything else exists. A side effect there fails in a context with no error handling and no obvious owner, and it makes the config package's behavior depend on import order.

**Enforcement:** review.

### [R8](#R8) and [R9](#R9) Versions and honesty

An internal workspace is referenced as a workspace dependency, so the local source is always what is used. A published version range for an internal package means a consumer can silently resolve to a registry copy that does not exist or is stale.

And a dependency exists because code imports it. "We might use it", "it came with the template", and "the other app has it" are not reasons; each one is an install cost, an audit surface ([INFRA_15](../index.html#INFRA_15)), and a node in a graph someone will have to reason about.

**Enforcement:** review — both are checkable from the manifests ([INFRA_06](../index.html#INFRA_06)).

### [R10](#R10) The rule does not bend

When a boundary blocks a change, the change is wrong or the boundary is wrong — and the second is decided in the open, by changing this document ([GEN_01#R10](../index.html#GEN_01)). What is never acceptable is widening the rule locally: an added path alias, a suppression comment, a guardrail exclusion, a dependency added to make a deep import resolve. That is a hard rule of the repository, and it applies to boundaries with no exception.

**Enforcement:** review — a new exclusion in a guardrail's configuration is visible in the diff and should be treated as a change to this document ([INFRA_06](../index.html#INFRA_06)).

## Worked example

The web app needs the shape of an API response.

Reaching into the API app for its types is the obvious move and is forbidden — apps do not import apps ([R4](#R4)), and doing it would make the web app un-buildable without the API's whole dependency tree. The legitimate answer is a package both depend on, and what that package may contain for this particular seam is [GEN_08](../index.html#GEN_08)'s decision, not this document's.

The package exports the types through its entry point ([R3](#R3)). The web app declares it as a dependency ([R2](#R2)), references it by workspace version ([R8](#R8)), and imports from the package name — never from a source path inside it, even though the editor will offer one ([R3](#R3)).

Then the pressure arrives. A view needs one field that only exists on an internal type the package does not export. Three responses, in order of preference: export it deliberately, because it is genuinely part of the contract ([R5](#R5)); derive what the view needs from what is exported; or accept that the field is internal and the view is asking the wrong question. What is not on the list is a deep import into the package's source, and neither is adding a wildcard export to make the problem go away — that converts every internal file into public API to solve one case ([R10](#R10)).

Later someone proposes a helper in the shared package that formats a value "the way the web app shows it". That is [R6](#R6): the package would then know a consumer. The formatter belongs to the app, or, if a second app truly needs the same behavior, to a package that neither app is named in ([GEN_16](../index.html#GEN_16)).

## Checklist

- The change introduces no cycle, between workspaces or within one ([R1](#R1)).
- Everything imported is declared in that workspace's manifest, and nothing unused was added ([R2](#R2), [R9](#R9)).
- All imports go through package entry points ([R3](#R3)).
- No package imports an app; no app imports another app ([R4](#R4)).
- New exports were deliberate, and no published export was removed or narrowed ([R5](#R5)).
- No shared package names or assumes a consumer ([R6](#R6)).
- Config packages export values and run nothing ([R7](#R7)).
- Internal dependencies use the workspace version ([R8](#R8)).
- No alias, suppression or exclusion was added to make a boundary pass ([R10](#R10)).

## Open questions

- Every rule here is checkable and none is checked, which makes this the document with the largest gap between what it says and what happens. The cycle check and the deep-import check are the two highest-value items in [INFRA_06](../index.html#INFRA_06)'s queue.
- Whether a package may export its source directly or must export a build output is unsettled, and the two coexist badly: a consumer's type-checking and bundling behave differently for each. It should be one policy, decided in an ADR.
- [R6](#R6) has no answer for a package that legitimately serves two consumers with different defaults. Passing configuration in is the intended answer, but no pattern for it is written down.

## Related

Requires [INFRA_01](../index.html#INFRA_01). See also [INFRA_06](../index.html#INFRA_06), [BE_03](../index.html#BE_03), [FE_13](../index.html#FE_13).

---

[← All conventions](../index.html)
