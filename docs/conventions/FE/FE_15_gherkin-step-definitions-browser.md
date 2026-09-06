---
title: "FE_15 · Gherkin step definitions & browser scenarios"
id: "FE_15"
area: "FE"
tier: "P1"
status: "draft"
updated: "2026-08-31"
requires: [GEN_10, FE_14]
---

[Conventions](../index.html) / Frontend / FE_15

# [FE] Gherkin step definitions & browser scenarios

`P1` · `FE_15` · `draft` · `updated 2026-08-31`

**Open when:** a scenario from `features/` has to run in a browser.

Implementing steps against the running app, page-object conventions, the selector policy (`data-testid`), auth and data setup, handling flakiness, and what deserves a browser scenario at all.

## The rules

If you read nothing else:

1. <a id="R1"></a>A browser scenario earns its place only if it proves something no cheaper test can. Everything else stays below.
2. <a id="R2"></a>Drive the real application in a real browser, through the interface a user has.
3. <a id="R3"></a>Keep every selector, URL and wait inside the step definitions. The feature file stays in the product's words.
4. <a id="R4"></a>Find elements the way a user does — by role and accessible name. Fall back to a test id only when nothing user-visible identifies it.
5. <a id="R5"></a>A test id names the thing, is stable, and is never a class, a position, or a generated string.
6. <a id="R6"></a>Put the knowledge of one screen in one page object, and keep assertions out of it.
7. <a id="R7"></a>Establish sign-in and starting data through the fastest honest path, and prove that path in one scenario.
8. <a id="R8"></a>Every scenario creates its own data with unique values and cleans up after itself.
9. <a id="R9"></a>Never wait for a duration. Wait for the condition you actually need.
10. <a id="R10"></a>A flaky scenario is quarantined with an owner and a deadline, never re-run until it passes.

## Why

Browser scenarios are the only tests that exercise what you actually ship: the built bundle, the real routing, the real styling, the real network. They are also the slowest, the most fragile, and the most expensive to diagnose — a failure can come from the code, the data, the environment, the browser, or the timing, and telling those apart takes a person. So the value of this suite is entirely in its restraint. A hundred scenarios that take forty minutes and fail twice a week get ignored; twelve that take four minutes and never lie get read.

The fragility is mostly self-inflicted, and two rules remove most of it. Selectors that describe structure break when anyone touches the markup, while selectors that describe what a user sees break only when the product changes — which is when a test *should* break. And waits expressed as durations are guesses that are simultaneously too long on a fast machine and too short on a loaded one; waits expressed as conditions are neither.

## Rule detail

### [R1](#R1) What earns a browser scenario

Three things: a path through the app that crosses several pages and must work end to end, a behavior that only exists once the real bundle runs in a real browser, and a flow whose failure is severe enough to justify the cost — signing in, paying, submitting the thing the business exists to receive.

Everything else is cheaper elsewhere and belongs there: a component's states in a component test ([FE_14](../index.html#FE_14)), a rule's branches in a unit test, an API's contract at the API level ([BE_13](../index.html#BE_13)). The usual sign of a misplaced scenario is a browser test that spends most of its steps arranging a precondition in order to assert one rule.

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

### [R2](#R2) and [R3](#R3) Real app, and the translation stays in the steps

The scenario drives the application as a user does: click, type, read what is on screen. It does not reach into the app's internals, call its functions, or assert against a store — those paths pass while the thing a user touches is broken.

The feature file is written in the product's words and belongs to everyone ([GEN_10](../index.html#GEN_10)), so no selector, URL, wait or status code appears in it. The step definitions hold all of that. This is the rule that decides whether the feature file stays worth reading, and it is broken one convenient parameter at a time.

**Do**

```
// feature
When the customer submits the order

// step
When('the customer submits the order', async function () {
  await this.checkout.submit();
});
```

**Don't**

```
// feature — a selector and a wait in a business document
When the customer clicks "#checkout-form button.primary"
And waits 3 seconds
```

**Enforcement:** review — selectors, URLs and waits inside `features/**` are greppable and are a candidate guardrail ([INFRA_06](../index.html#INFRA_06)).

### [R4](#R4) and [R5](#R5) The selector policy

Find things the way a user finds them: by role and accessible name — the button named "Place order", the heading named "Your order", the field labelled "Card number". Those selectors are readable, they break only when the product changes, and they fail when a control loses its accessible name, which is a real defect the test should catch ([FE_06](../index.html#FE_06)).

A test id is the fallback for what a user cannot name: a region with no heading, a row among identical rows, a chart. When you add one, it names the thing in the domain's words, it is stable, and it is not derived from styling or position. Never select by class, by tag structure, or by nth-child — those describe how the page happens to be built today.

**Do**

```
page.getByRole('button', { name: 'Place order' })
page.getByTestId('order-summary')
```

**Don't**

```
page.locator('.btn-primary')
page.locator('div > form > button:nth-child(3)')
page.getByTestId(`row-${Math.random()}`)
```

**Enforcement:** review — a class or structural selector in a step file is greppable and is a candidate guardrail ([INFRA_06](../index.html#INFRA_06)).

### [R6](#R6) Page objects hold knowledge, not judgment

One object per screen or major region. It knows how to reach its elements and how to perform its actions — `checkout.submit()`, `orders.openFirst()` — and it exposes what is on screen as values. It contains no assertions: the scenario decides what should be true, the page object only says what is.

Keeping assertions out is what lets one page object serve twenty scenarios that expect different outcomes. Putting them in produces a method per scenario and an object nobody can reuse.

**Enforcement:** review.

### [R7](#R7) and [R8](#R8) Getting to the starting state

Signing in through the form in every scenario multiplies the slowest flow in the suite by the number of scenarios. Establish the session the fastest honest way — a stored authenticated state, an API call, a seeded token — and then prove the real path in exactly one scenario that signs in through the form. That scenario is the reason the shortcut is safe.

The same applies to data: create it through the fastest reliable path, but create it per scenario, with unique values, and remove it afterward. Shared fixtures produce the failure mode that costs the most time in this suite — a scenario that passes alone and fails in the suite, with no relationship to the change that revealed it ([GEN_10](../index.html#GEN_10)).

**Enforcement:** review.

### [R9](#R9) and [R10](#R10) Waiting, and what to do with a flake

Never sleep. Wait for the condition: this element is visible, this text has changed, this request has settled, this URL is current. A duration is a guess that is too long on a fast machine and too short on a busy one, and a suite full of them is slow *and* flaky at the same time.

When a scenario is flaky anyway, it is telling you something — usually about a race in the application, which is a defect, not a test problem. Quarantine it with an owner and a date, and fix or delete it by then. What you must never do is add a retry until it passes: that converts a real intermittent bug into a permanently green build, and the next person to see it will be a user ([GEN_05](../index.html#GEN_05)).

**Enforcement:** review — a sleep call in a step file is greppable and is a candidate guardrail ([INFRA_06](../index.html#INFRA_06)).

## Worked example

`checkout.feature`, one scenario, tagged for the browser layer ([GEN_10](../index.html#GEN_10)).

```
Scenario: A customer buys a product from the catalog
  Given a signed-in customer
  And a product available to buy
  When the customer adds it to the cart and checks out
  Then the order appears in their order history
```

`Given a signed-in customer` restores a prepared authenticated state rather than driving the sign-in form ([R7](#R7)), and registers a customer with a unique email so the scenario can run beside its neighbours ([R8](#R8)). One separate scenario in the auth feature signs in through the form; that is what makes this shortcut honest.

`And a product available to buy` creates the product through the API and records its id on the scenario's context for teardown ([R8](#R8)).

`When the customer adds it to the cart and checks out` calls two page objects — the catalog and the checkout — each finding its controls by role and name ([R4](#R4)). The only test id in the whole scenario is on the order summary region, which has no heading a user could name ([R5](#R5)).

`Then the order appears in their order history` navigates to the history page and looks for the order by the product's name. It does not read a store, query the database, or assert a status code ([R2](#R2)) — it checks the thing the customer would check.

Waiting happens once, in the checkout page object, and it waits for the confirmation heading to appear, not for three seconds ([R9](#R9)).

What is deliberately not here: that the card field rejects a bad number, that the cart badge counts correctly, that the empty-cart message is right. All three are real requirements and all three are cheaper one level down ([R1](#R1), [FE_14](../index.html#FE_14)). This suite has one scenario for checkout because checkout has one promise.

## Checklist

- The scenario proves something no cheaper test can ([R1](#R1)).
- It drives the real app through the user's interface ([R2](#R2)).
- No selector, URL, wait or status code appears in the feature file ([R3](#R3)).
- Elements are found by role and accessible name; test ids are the documented fallback ([R4](#R4), [R5](#R5)).
- Page objects hold actions and readings, not assertions ([R6](#R6)).
- Session and data setup use a fast path, and the real sign-in path is covered once ([R7](#R7)).
- Data is unique per scenario and cleaned up ([R8](#R8)).
- Every wait is a condition ([R9](#R9)).
- No flaky scenario is left re-running; each is quarantined with an owner and a date ([R10](#R10)).

## Open questions

- Where step definitions and page objects live, and whether they share the scenario context shape with the API layer ([BE_13](../index.html#BE_13)), is unresolved in both documents. The same feature file is meant to be driven from both layers, and nothing says how the setup is shared rather than duplicated.
- [R10](#R10) describes quarantine but names no mechanism — a tag, a list, a dashboard. Without one, a quarantined scenario is a deleted scenario with extra steps.
- Nothing here covers visual comparison, deliberately: it belongs with the component surface in [FE_21](../index.html#FE_21). If browser scenarios later grow screenshots, the two documents will need a boundary.

## Related

Requires [GEN_10](../index.html#GEN_10), [FE_14](../index.html#FE_14).

---

[← All conventions](../index.html)
