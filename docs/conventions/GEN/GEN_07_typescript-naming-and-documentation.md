---
title: "GEN_07 · TypeScript, naming & code documentation"
id: "GEN_07"
area: "GEN"
tier: "P0"
status: "stable"
updated: "2026-08-15"
requires: [GEN_01]
see_also: [INFRA_05, BE_24, FE_22]
---

[Conventions](../index.html) / General / GEN_07

# [General] TypeScript, naming & code documentation

`P0` · `GEN_07` · `stable` · `updated 2026-08-15`

**Open when:** you are writing any TypeScript.

File and symbol naming, module and barrel policy, strictness settings, banned constructs (`any`, non-null assertion, default export), TSDoc, when a comment is mandatory, the TODO format, and what every package README must contain.

## The rules

If you read nothing else:

1. <a id="R1"></a>Name a file after what it exports; name a symbol after what it is, not what it holds.
2. <a id="R2"></a>`kebab-case` files, `PascalCase` types and classes, `camelCase` values, `SCREAMING_SNAKE` only for true constants.
3. <a id="R3"></a>No default exports. Every export is named.
4. <a id="R4"></a>No `any`, no non-null assertion, no type assertion that the compiler cannot check.
5. <a id="R5"></a>Make the illegal state unrepresentable before you write the check that rejects it.
6. <a id="R6"></a>A package's entry point is its only public surface. No deep imports, no internal barrels.
7. <a id="R7"></a>Comment why, never what. If the what needs a comment, the name is wrong.
8. <a id="R8"></a>Put TSDoc on an exported symbol whose name does not fully explain it, and on every one with a non-obvious failure mode.
9. <a id="R9"></a>A `TODO` carries an owner and a link. Otherwise delete it.
10. <a id="R10"></a>Every package README says what the package owns, what it exports, and how to run its tasks.

## Why

Naming and types are the cheapest documentation in the repository, because they are the only kind the compiler keeps honest. Everything in this document is either a way to move information out of prose and into a name or a type, or a way to stop the type system being switched off at the one point where it was about to be useful.

The constructs banned below share a property: each one silences the compiler locally, in exchange for nothing. `any` does not mean "this could be anything" — it means "no one will check this again". A non-null assertion does not mean "this is not null" — it means "crash here instead of where the mistake was made".

## Rule detail

### [R1](#R1) Names

A file exporting `ArchiveOrder` is `archive-order.ts` — one primary export per file, named the same thing. For symbols: a function is a verb phrase, a boolean reads as a predicate, a collection is plural, and a type is a noun. Avoid names that describe the container instead of the contents: `data`, `info`, `manager`, `helper`, `utils` tell the reader nothing and attract unrelated code, which is how a `utils.ts` reaches four hundred lines.

**Do**

```
// archive-order.ts
export class ArchiveOrder { … }

const isArchived = order.archivedAt !== null;
const activeOrders = orders.filter(…);
```

**Don't**

```
// utils.ts
export function handleOrderData(d: OrderData) { … }

const flag = order.archivedAt !== null;
const list = orders.filter(…);
```

**Enforcement:** partly automated — casing is a lint rule ([INFRA_05](../index.html#INFRA_05)); the choice of word is review.

### [R3](#R3) No default exports

A default export has no name at the import site, so the same symbol acquires three spellings across the codebase and none of them can be found by searching. Named exports also make automated renames work and stop a typo becoming a silent `undefined`. The rule has one practical exception — frameworks that require a default export from specific files, such as a page or layout module in the web app. Obey the framework there and nowhere else.

**Enforcement:** automated — lint rule ([INFRA_05](../index.html#INFRA_05)).

### [R4](#R4) The banned constructs

`any` disables checking for everything it touches downstream; when you genuinely do not know a type, `unknown` says so and forces a check at the boundary. The non-null assertion `!` moves the crash away from the mistake. A type assertion `as T` tells the compiler to stop verifying exactly where verification was needed — parse instead, at the edge, once. If you must break one of these, the suppression comment carries a reason and a link, and it is reviewable ([GEN_06#R6](../index.html#GEN_06)).

**Do**

```
function parseWebhook(raw: unknown): WebhookEvent {
  const parsed = webhookSchema.parse(raw); // throws at the edge
  return parsed;
}
```

**Don't**

```
function parseWebhook(raw: any): WebhookEvent {
  return raw as WebhookEvent; // wrong shape now fails
}                             // three layers away
```

**Enforcement:** automated — lint rules plus `strict` type-checking ([INFRA_05](../index.html#INFRA_05)).

### [R5](#R5) Make illegal states unrepresentable

Before adding a runtime check, ask whether the type could have refused the value. A discriminated union beats a bag of optional fields where "if `status` is `failed` then `error` is set" is a comment nobody enforces. This is the highest-leverage rule in this document, because every state you delete is a class of bug and a test you never write.

**Do**

```
type Result =
  | { status: "ok"; value: Order }
  | { status: "failed"; error: OrderError };
```

**Don't**

```
type Result = {
  status: "ok" | "failed";
  value?: Order;    // set when ok, by convention
  error?: OrderError; // set when failed, by hope
};
```

**Enforcement:** review — no tool suggests a better type.

### [R7](#R7) Comment why

The code says what it does; only a person can say why it does it that way. Comment the non-obvious decision, the constraint from outside the codebase, the bug that this ordering prevents. A comment restating the line above it is worse than nothing: it is a second thing that can be wrong, and it will be, because nobody updates it.

**Do**

```
// The provider rejects more than 50 ids per call
// and returns 200 with a partial body, so batch.
const batches = chunk(ids, 50);
```

**Don't**

```
// split ids into batches of 50
const batches = chunk(ids, 50);
```

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06).

### [R9](#R9) The TODO format

An anonymous `TODO` is a wish. One with an owner and a ticket is work. If you cannot name either, the honest options are to do it now or to delete the comment — and deleting it is fine, because the code will still be wrong later and will still be findable then.

```
// TODO(kritpavin, #142): drop the fallback once every
// client sends the correlation id.
```

**Enforcement:** automated — a lint rule can require the shape ([INFRA_05](../index.html#INFRA_05)).

## Worked example

A function that reads an external payload and returns a domain value, applying most of the rules at once:

```
// parse-archive-request.ts

/**
 * Reads an archive request from the wire.
 * Throws {@link InvalidArchiveRequest} when the payload does not
 * match the contract — callers at the edge are expected to catch it.
 */
export function parseArchiveRequest(raw: unknown): ArchiveRequest {
  // The mobile client still sends `order_id`; the contract has
  // `orderId`. Accept both until #211 ships. TODO(kritpavin, #211)
  const normalized = normalizeLegacyKeys(raw);
  return archiveRequestSchema.parse(normalized);
}
```

The file is named after its export, the input is `unknown` rather than `any`, the TSDoc documents the failure mode rather than the happy path, the comment explains a constraint that lives outside the repository, and the `TODO` is attached to the thing that will remove it.

## Checklist

- Files named after their export; no container-words as symbol names ([R1](#R1)).
- Casing follows the table ([R2](#R2)).
- No default exports outside framework-required files ([R3](#R3)).
- No `any`, `!`, or unchecked `as`; suppressions carry a reason ([R4](#R4)).
- Optional-field bags replaced by unions where the state is really exclusive ([R5](#R5)).
- No deep imports past a package entry point ([R6](#R6)).
- Comments explain why; none restate the code ([R7](#R7)).
- Exported symbols with non-obvious behavior carry TSDoc ([R8](#R8)).
- Every `TODO` has an owner and a link ([R9](#R9)).
- Touched packages have a README that matches what they now export ([R10](#R10)).

## Open questions

- [R4](#R4) assumes a schema library at the parse boundary but names none, because that choice belongs to the contract seam ([GEN_08](../index.html#GEN_08)) and to `PROJECT.md`. Until one is chosen, the examples here show the shape, not the import.
- [R6](#R6) forbids deep imports but the enforcement lives in [INFRA_03](../index.html#INFRA_03) and [INFRA_06](../index.html#INFRA_06). Whether the rule is expressed as lint, as package `exports`, or both, is not settled here.
- No line-length, file-length or function-length limit is stated. Formatting is the formatter's job ([INFRA_05](../index.html#INFRA_05)), but "how long is too long" is currently a matter of review taste, which [GEN_06#R4](../index.html#GEN_06) says should not exist.

## Related

Requires [GEN_01](../index.html#GEN_01). See also [INFRA_05](../index.html#INFRA_05), [BE_24](../index.html#BE_24), [FE_22](../index.html#FE_22).

---

[← All conventions](../index.html)
