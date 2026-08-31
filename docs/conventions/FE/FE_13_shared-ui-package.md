---
title: "FE_13 · The shared UI package"
id: "FE_13"
area: "FE"
tier: "P1"
status: "stable"
updated: "2026-08-25"
requires: [FE_02, INFRA_03]
---

[Conventions](../index.html) / Frontend / FE_13

# [FE] The shared UI package (packages/ui)

`P1` · `FE_13` · `stable` · `updated 2026-08-25`

**Open when:** you are adding to `packages/ui`, or wondering whether a component belongs there.

When a component graduates from an app into the shared package, that package's public API and how it is versioned, and how app-specific concerns are kept out of it.

## The rules

If you read nothing else:

1. <a id="R1"></a>A second app is what earns the move. Reuse within one app stops at that app.
2. <a id="R2"></a>Only a component that names no domain concept may graduate.
3. <a id="R3"></a>Adding to the package's public surface is an API decision. Propose it, and say what earned it.
4. <a id="R4"></a>Nothing in the package reads data, names the domain, or reads application configuration.
5. <a id="R5"></a>The package's only design dependency is the token layer.
6. <a id="R6"></a>Adding an optional prop is safe. Changing or removing anything already published is breaking.
7. <a id="R7"></a>The element a component renders is part of what it published. Declare it variable up front, or treat changing it as breaking.
8. <a id="R8"></a>A change only one consumer needs belongs in that consumer.
9. <a id="R9"></a>Land a breaking change together with every consumer's migration, unless `PROJECT.md` records that the package is published beyond this repository.
10. <a id="R10"></a>Return a component to its app once it is down to one consumer.

## Why

A shared package is the most expensive place to put a component and the easiest place to put one. Expensive because every change is a change to somebody else's app, made by someone who cannot see what it breaks; easy because moving a file there feels like tidying. That gap is where shared packages go wrong: they accumulate until nobody dares change anything and every app has forked what it needed.

So the rules below are mostly brakes: what gets in is deliberately hard, what may be assumed about the outside is nothing, and what leaves is easy. They are not a second statement of who may import what — that is [INFRA_03](../index.html#INFRA_03)'s, and the shape of a public surface is [GEN_07#R6](../index.html#GEN_07)'s. This document says what earns a place in that surface and what it costs to change it.

## Rule detail

### [R1](#R1) A second app, not a second page

[FE_01#R4](../index.html#FE_01) promotes on a second consumer; this rung raises the bar to a second *app*. A component used on four pages of one app belongs to that app — already shared, at the rung where sharing costs nothing. Moving it further buys no reuse and adds a boundary every change must cross. The failure this prevents is the package built ahead of its second consumer: designed against one app's needs, published as general, reshaped the first time a real second app arrives.

**Enforcement:** review — the number of consuming apps is countable, but nothing counts it ([INFRA_06](../index.html#INFRA_06)).

### [R2](#R2) The domain does not travel

A component whose props name a domain concept is an organism ([FE_02#R4](../index.html#FE_02)), and organisms do not graduate: a second app with a different domain cannot use one, and a second app with the same domain means the concept belongs in a shared contract rather than a shared button. So what moves is atoms and molecules. This keeps the package usable by an app nobody has written yet, the only property that makes it worth its cost.

**Enforcement:** review — a domain word in a props type is greppable once [GEN_14](../index.html#GEN_14)'s list exists; the same candidate guardrail as [FE_02#R4](../index.html#FE_02).

### [R3](#R3) Getting in is a decision

[GEN_07#R6](../index.html#GEN_07) already fixes *what* the public surface is. What this rule adds is that entering it is an event someone decides, not a side effect of adding a file. Say in the pull request which second app needs it ([R1](#R1)), and what about it is general rather than borrowed from the app it came from. A surface that grows by default grows monotonically, because nobody proposes removing what they were never asked to justify adding.

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06). Whether the surface is enumerated at all is [GEN_07#R6](../index.html#GEN_07)'s; see **Open questions**.

### [R4](#R4) Nothing about the outside

The package may not read from the API, reach for a session, read an environment variable, or import a router. Each is an assumption about the application around it, and every assumption is a way a second app fails to fit. A component that seems to need one is asking for a prop. The test is whether it renders in isolation with nothing set up around it.

**Do**

```
export type LinkButtonProps = { href: string; onNavigate?: () => void };
```

**Don't**

```
import { useRouter } from 'next/navigation';   // an app's router
import { useSession } from '@/lib/auth';       // and an app's session
```

**Enforcement:** unenforced — an import allow-list for the package is one rule and would catch every case of this ([INFRA_06](../index.html#INFRA_06)); see **Open questions**.

### [R5](#R5) Tokens are the only design input

Shared components take every design value from the token layer ([FE_03](../index.html#FE_03)) and accept nothing else — no per-app stylesheet, no theme object as a prop, no escape hatch letting one app restyle from outside. That is what makes a second app's adoption free: it supplies its own token values and the components follow. The moment a component can be restyled per app by other means, the token layer stops being the seam and every app has its own answer for what a button looks like.

**Enforcement:** review — the same import allow-list as [R4](#R4) would cover the mechanical half, and does not exist either.

### [R6](#R6) Published props are a contract

Adding an optional prop breaks nobody. Renaming one, narrowing its type, making it required, or removing it breaks every consumer — and unlike an app-internal change you cannot see them all from where you stand. So the question before editing a shared component's props is not "is this better" but "what does this cost the app I am not looking at". Where the answer is a migration, [R9](#R9) says when.

**Enforcement:** partly automated — narrowing or removing an exported prop fails the build's type check in every consumer built in this repository; a consumer outside it is not checked, and a prop nobody passes yet is not either.

### [R7](#R7) The element is published too

[FE_05#R6](../index.html#FE_05) has a shared component extend the props of the element it renders, which puts that element inside the exported type. Swapping a `button` for an `a` removes `type`, `disabled` and `form` from the published props and adds `href` — a narrowing, breaking under [R6](#R6). That answers the question [FE_05](../index.html#FE_05) left open: no. A component whose element may genuinely vary is declared polymorphic when it is written ([FE_05#R8](../index.html#FE_05)) — "we might make this a link later" is a reason to type it that way on day one, never a reason to reserve the right to swap it.

**Enforcement:** partly automated — the same build-time type check as [R6](#R6) catches the narrowing; that the component should have been polymorphic in the first place is review.

### [R8](#R8) One consumer's need is not the package's

When one app needs a variant, a flag or a slot the others do not, the change belongs to that app — as a wrapper around the shared component, not a new prop on it. Every prop added for one caller is surface every other caller must be considered against, and it is how a package that started with a button ends up unreadable ([FE_05#R10](../index.html#FE_05) says the same of props with no caller). When a second app needs that wrapper, [R1](#R1) applies and it graduates on its own merits.

**Enforcement:** review — nothing relates a new prop to the number of call sites that pass it.

### [R9](#R9) The migration is part of the change

Where every consumer lives in this repository at one version, there is no version for a breaking change to be released in: the change and every consumer's migration are one change, and the repository is never in a state where the package and its consumers disagree — [FE_01#R10](../index.html#FE_01)'s discipline one rung up. Where `PROJECT.md` records the package as published beyond this repository, that is impossible and its recorded versioning policy governs instead, with the deprecation window [GEN_15](../index.html#GEN_15) requires. Check which you are in before planning, because they are not the same work.

**Enforcement:** partly automated — in the single-version case the build fails until every in-repo consumer that is built is migrated, which is the type-visible part of the rule; a behavioral break leaves the build green, and the published case is review.

### [R10](#R10) Leaving is easy on purpose

When a component falls back to one consuming app it goes home, at the rung [FE_01](../index.html#FE_01) gives it. Everything that made the package expensive still applies to a component nobody else uses: the boundary, the contract, the migration cost. Making the exit as routine as the entrance stops the package becoming a museum, and makes [R1](#R1) safe to enforce strictly — you can refuse an early promotion knowing the later one is cheap. It follows that where only one app consumes the package, the package is empty. That is the intended state, not a gap to fill.

**Enforcement:** review — nothing notices that a shared component has lost its second consumer.

## Worked example

An admin app is added alongside the web app and needs the status badge the web app has in `components/atoms/`.

That is a second app, so the badge is eligible ([R1](#R1)), and its props are `status` and a label — no domain concept, so it may travel ([R2](#R2)). The pull request says which app needs it and why it is general ([R3](#R3)), and both call sites move in that change ([FE_01#R10](../index.html#FE_01)).

Two weeks later the admin app wants the badge to render as a link. The temptation is an `href` prop that switches the element — which narrows the published type ([R7](#R7)) and adds surface the web app never asked for ([R8](#R8)). So the admin app wraps it:

```
// apps/admin/components/molecules/status-badge-link.tsx
export type StatusBadgeLinkProps =
  React.ComponentPropsWithRef<'a'> & { status: Status };

export function StatusBadgeLink({ status, ...rest }: StatusBadgeLinkProps) {
  return (
    <a {...rest}>
      <StatusBadge status={status} />
    </a>
  );
}
```

The shared badge is untouched, so the web app is unaffected and no migration is needed. If the web app later wants the same behavior, the wrapper graduates ([R1](#R1)) — as a molecule, because it composes ([FE_02#R3](../index.html#FE_02)).

Later the admin app drops the badge. One consumer is left, so it goes back into the web app ([R10](#R10)): nothing deprecated, nothing announced, the move and the single call-site update landing together ([R9](#R9)).

## Checklist

- A second app consumes it today, named in the pull request ([R1](#R1)).
- No props type in the package names a domain concept ([R2](#R2)).
- Every addition to the public surface says what earned it ([R3](#R3)).
- Nothing reads data, a session, the environment, or a router ([R4](#R4)).
- Every design value comes from the token layer, and no per-app restyling seam exists ([R5](#R5)).
- No published prop was renamed, narrowed, made required, or removed without treating it as breaking ([R6](#R6)).
- No component changed the element it renders without treating it as breaking ([R7](#R7)).
- Nothing was added for a single consumer ([R8](#R8)).
- Every in-repo consumer migrated in the same change, or the published policy in `PROJECT.md` was followed ([R9](#R9)).
- Anything down to one consumer went back to that app ([R10](#R10)).

## Open questions

- [R3](#R3) presumes what [GEN_07#R6](../index.html#GEN_07) requires: one entry point exporting a curated set. A package whose entry point matches every file has no curated surface, so nothing here can be proposed or refused — curating it is a prerequisite of adopting this document, and a manifest change rather than a documentation one.
- [R4](#R4) and [R5](#R5) are one import allow-list between them, and it is the highest-value guardrail this document wants: [INFRA_06](../index.html#INFRA_06) owns it, and [INFRA_03](../index.html#INFRA_03) owns the graph it would encode.
- [R1](#R1) raises the promotion bar to a second app, which is right for a package consumed by applications and wrong for one consumed by other packages. If a package ever depends on this one, the rule needs restating in terms of workspaces rather than apps.

## Related

Requires [FE_02](../index.html#FE_02), [INFRA_03](../index.html#INFRA_03).

---

[← All conventions](../index.html)
