---
title: "GEN_10 · Gherkin & the shared feature suite"
id: "GEN_10"
area: "GEN"
tier: "P1"
status: "stable"
updated: "2026-08-15"
requires: [GEN_04]
see_also: [BE_13, FE_15]
---

[Conventions](../index.html) / General / GEN_10

# [General] Gherkin & the shared feature suite

`P1` · `GEN_10` · `stable` · `updated 2026-08-15`

**Open when:** you are writing acceptance criteria or a `.feature` file.

The single owner of `features/`: where feature files live, the scenario language rules, naming, tags, and which scenarios run against the API versus the browser.

## The rules

If you read nothing else:

1. <a id="R1"></a>All feature files live in `features/`, one per capability, named after the capability.
2. <a id="R2"></a>Write in the language of the person who asked. No selectors, no routes, no ids, no HTTP.
3. <a id="R3"></a>**Given** sets state, **When** is exactly one action, **Then** asserts one observable outcome.
4. <a id="R4"></a>Every scenario is independent: it creates what it needs and assumes nothing left behind.
5. <a id="R5"></a>Tag each scenario with the layer that runs it — `@api` or `@browser` — and nothing that repeats the file name.
6. <a id="R6"></a>Reuse step wording exactly. A near-duplicate step is a new step nobody will find.
7. <a id="R7"></a>Vary data in an **Examples** table, never by writing another scenario.
8. <a id="R8"></a>One scenario per rule, not one per input. This suite is the slowest one you own.
9. <a id="R9"></a>The feature file belongs to everyone; the step definitions belong to their stack.
10. <a id="R10"></a>A failing scenario is a defect until proven otherwise. Never fix it by editing the assertion.

## Why

Acceptance criteria and end-to-end tests are usually two artifacts that drift: the criteria are written first, agreed, and then never read again, while the tests grow separately and describe something slightly different. One file for both removes the drift, and it is the only artifact in this repository that product, developers and agents all read literally.

That only works if the file stays in the domain's language. The moment a scenario mentions a button, a route or a status code, it stops being something a non-engineer can confirm, and it becomes a slow test with an unusual syntax — which is the worst of both.

## Rule detail

### [R1](#R1) Where the files live

One directory at the repository root, shared by both stacks — not one copy per app, which is how two versions of the same truth appear. A feature is a capability, not a screen and not an endpoint. The step definitions that make it run live with the stack that runs them ([BE_13](../index.html#BE_13), [FE_15](../index.html#FE_15)).

```
features/
  archiving-orders.feature
  placing-an-order.feature
  signing-in.feature
```

**Enforcement:** automated — a glob check that no `.feature` file exists outside `features/` ([INFRA_06](../index.html#INFRA_06)).

### [R2](#R2) The language test

Could the person who asked for this feature read the scenario and say whether it is right? If not, it is written at the wrong level. Use the terms from [GEN_14](../index.html#GEN_14) and no others — the same words the domain uses, in code and on screen. Mechanics are the step definition's problem, and keeping them there is what lets one scenario run against both the API and the browser.

**Do**

```
When the customer archives the order
Then the order no longer appears in their list
```

**Don't**

```
When I POST /orders/42/archive with a valid token
Then the response status is 204
And [data-testid="order-42"] is not visible
```

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

### [R3](#R3) One action per scenario

Two **When** steps mean two scenarios wearing one name, and when it fails you cannot tell which action broke. Put setup in **Given**, however much of it there is; put the single thing under test in **When**; assert the outcome a person could observe in **Then**. If the outcome you want to assert is not observable from outside, the assertion belongs in a unit or integration test instead ([BE_11](../index.html#BE_11), [BE_12](../index.html#BE_12)).

**Enforcement:** automated — a linter can count `When` steps ([INFRA_06](../index.html#INFRA_06)).

### [R5](#R5) Tags mean where it runs

A tag exists to select scenarios for a run, so the only tags worth having are the ones a runner filters on. `@api` and `@browser` choose the step definitions; `@wip` excludes a scenario from CI and must never survive a merge. Tags that restate the file name — `@orders` on `archiving-orders.feature` — add nothing and go stale when the file is renamed.

**Enforcement:** automated — an allowed-tag list in the runner config.

### [R8](#R8) Few scenarios, each load-bearing

This suite is the slowest and flakiest thing you own, and its value is coverage of *rules*, not of inputs. One scenario for the happy path, one per genuinely different rule, and nothing for the seventeen input variations — those belong at a lower level where they run in milliseconds and point at the exact function. A feature file that has grown past a screen is usually one capability that was really three.

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

### [R10](#R10) A red scenario is a defect

The scenario was agreed with the person who asked for the feature, so when it goes red the default explanation is that the product is wrong. Changing the assertion to match the code silently renegotiates the agreement with nobody in the room. If the scenario really is wrong, that is a conversation and then an edit — in that order. Flakiness is not an exception: a scenario that fails intermittently is reporting a real race until someone proves it is the harness ([FE_15](../index.html#FE_15)).

**Enforcement:** review — the diff shows an edited assertion.

## Worked example

```
Feature: Archiving orders
  Customers tidy their order list by archiving orders
  they no longer care about.

  Background:
    Given a customer with an active order

  @api @browser
  Scenario: An archived order leaves the default list
    When the customer archives the order
    Then the order no longer appears in their list
    And the order still appears when archived orders are shown

  @api
  Scenario: Archiving twice changes nothing
    Given the order is already archived
    When the customer archives the order
    Then the order remains archived
    And no error is shown

  @api
  Scenario Outline: An order the customer does not own cannot be archived
    Given an order that <ownership>
    When the customer tries to archive it
    Then they are told the order cannot be found

    Examples:
      | ownership                   |
      | belongs to another customer |
      | does not exist              |
```

Three scenarios for three rules. The second says "no error is shown" rather than naming a status code. The third uses two rows precisely because both must produce the same answer — that is the domain-level statement of the decision not to leak whether someone else's order exists ([GEN_09#R8](../index.html#GEN_09)), and a single row would have proved nothing. All of it stays true whether the step definition drives HTTP or a browser.

## Checklist

- The file is in `features/` and named after a capability ([R1](#R1)).
- The person who asked could read it and say whether it is right ([R2](#R2)).
- One **When** per scenario; assertions are observable ([R3](#R3)).
- Each scenario sets up its own state ([R4](#R4)).
- Tags say where it runs and nothing else; no `@wip` merged ([R5](#R5)).
- Step wording matches existing steps exactly where it means the same thing ([R6](#R6)).
- Data variation is in **Examples**, not in extra scenarios ([R7](#R7)).
- One scenario per rule; input coverage pushed to a lower level ([R8](#R8)).
- No mechanics leaked from the step definitions into the file ([R9](#R9)).
- No assertion was edited to make a red scenario pass ([R10](#R10)).

## Open questions

- The runner is not named here — it is a tooling choice that needs an ADR ([GEN_13](../index.html#GEN_13)), and `PROJECT.md` says whether one is installed.
- [GEN_04](../index.html#GEN_04)'s open question applies here too: whether acceptance criteria must be executable `.feature` files from the first ticket, or may start as plain scenarios and be promoted. This document assumes they end up here either way.
- [R6](#R6) asks for exact reuse but nothing lists the existing steps. A generated step inventory would fix that and does not exist.
- A scenario tagged both `@api` and `@browser` runs twice, which doubles the slowest suite. No rule says when that is worth it.

## Related

Requires [GEN_04](../index.html#GEN_04). See also [BE_13](../index.html#BE_13), [FE_15](../index.html#FE_15).

---

[← All conventions](../index.html)
