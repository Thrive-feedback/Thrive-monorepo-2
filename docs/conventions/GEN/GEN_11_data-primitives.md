---
title: "GEN_11 · Data primitives — ids, dates, money & units"
id: "GEN_11"
area: "GEN"
tier: "P1"
status: "stable"
updated: "2026-08-15"
requires: [GEN_07]
see_also: [BE_04, BE_08]
---

[Conventions](../index.html) / General / GEN_11

# [General] Data primitives — ids, dates, money & units

`P1` · `GEN_11` · `stable` · `updated 2026-08-15`

**Open when:** you are modelling an id, a timestamp, an amount of money, or a quantity.

UUIDv7 for public ids, UTC everywhere with the timezone applied at the edge, money as integer minor units, and the ban on floating-point currency and locale-dependent parsing.

## The rules

If you read nothing else:

1. <a id="R1"></a>Public identifiers are UUIDv7. Never expose a sequential database id.
2. <a id="R2"></a>Store and transmit instants in UTC. Apply a timezone only where a human reads it.
3. <a id="R3"></a>Instants on the wire are RFC 3339 with an explicit offset.
4. <a id="R4"></a>A calendar date is a date. Do not store it as midnight in some timezone.
5. <a id="R5"></a>Money is an integer of minor units plus a currency code. Never a float, never a bare number.
6. <a id="R6"></a>Never add amounts in different currencies, and never round inside the domain.
7. <a id="R7"></a>A quantity carries its unit in the type or, failing that, in the name.
8. <a id="R8"></a>Parse and format with an explicit locale and timezone. Never rely on the ambient one.
9. <a id="R9"></a>Enumerations are string unions. The wire value never changes once shipped.
10. <a id="R10"></a>A value with rules gets a type, not a `string`.

## Why

These four kinds of value cause a disproportionate share of production bugs, and all of them for the same reason: each has an obvious representation that is wrong in a way that does not show up until a specific customer, currency, timezone or scale meets it. A float holding money is correct for months, and then a total is off by one cent and nobody can say which addition did it.

Deciding these once, repository-wide, is also what makes them safe to hand to an agent. Left unspecified, every model will produce a locally reasonable and globally inconsistent answer — `number` for money here, a formatted string there, a Date parsed in whatever timezone the server happened to run in.

## Rule detail

### [R1](#R1) Identifiers

A sequential id leaks how many you have and how fast you are growing, and it invites enumeration — the caller who can read order 41 will try 42 ([GEN_09#R8](../index.html#GEN_09)). UUIDv7 is the default because it is random enough to be safe to expose while remaining time-ordered, which keeps index locality that UUIDv4 destroys. Generate ids in the domain, not in the database: an entity that is not valid until it has been saved cannot be tested without one.

**Enforcement:** review — [BE_04](../index.html#BE_04) owns where the id is created.

### [R2](#R2) Time

One rule, applied without exception: instants are UTC everywhere inside the system, and a timezone is applied exactly once, at the surface a person reads. The bugs come from converting in the middle — a value stored in local time is ambiguous for one hour every year, and a value converted twice is wrong for everyone. When the user's timezone matters to the business (a daily cutoff, a report boundary), store the timezone as data alongside the instant; do not encode it by shifting the instant.

**Do**

```
archivedAt: "2026-08-15T09:12:04Z"   // stored, sent
formatInTimeZone(archivedAt, user.timeZone, "PPp")
```

**Don't**

```
archivedAt: "2026-08-15 16:12:04"  // whose clock?
new Date(dateString)              // parses in the
                                  // server's zone
```

**Enforcement:** partly automated — a lint rule can ban bare `new Date(string)`; the rest is review.

### [R4](#R4) Dates are not instants

A birthday, an invoice date and a public holiday are calendar dates: they have no time and no timezone, and storing them as midnight makes them shift a day for half the world. Keep them as `YYYY-MM-DD` and type them as something other than an instant, so the compiler stops the two being mixed. The reverse mistake matters too — an event that happened at a moment is an instant, even if the UI only shows the day.

**Enforcement:** review — the type makes it visible if [R10](#R10) is followed.

### [R5](#R5) Money

Binary floating point cannot represent 0.1, so every currency amount held in a `number` is slightly wrong and the error compounds across additions. Store the smallest unit as an integer and carry the currency with it, always — an amount without a currency is not an amount, and the field that "is always EUR" stops being so the week you take a second market. Note that minor units are not always hundredths: JPY has none, and some currencies have three.

**Do**

```
type Money = { amountMinor: number; currency: CurrencyCode };
const total: Money = { amountMinor: 1999, currency: "EUR" };
```

**Don't**

```
const total = 19.99;            // 19.989999999999998
const shown = `€${total.toFixed(2)}`;  // and now it is
                                       // a string too
```

**Enforcement:** review — a lint rule cannot tell which `number` is money. See [Open questions](#open-questions).

### [R8](#R8) Never rely on the ambient locale

The locale and timezone of the process are accidents of where it runs — a developer's laptop, a container in one region, a browser in another. Anything that parses or formats takes both explicitly. This is also why parsing user input with a permissive date parser is a bug waiting for a customer in a country that writes the day first.

**Enforcement:** partly automated — lint rules exist for the common offenders ([INFRA_05](../index.html#INFRA_05)).

### [R9](#R9) Enumerations

String unions, not numeric enums: the value is readable in a log, a database row and a network trace, and reordering the definition cannot silently change what a stored 2 means. Once a value has been on the wire it is frozen, because something has stored it ([GEN_08#R7](../index.html#GEN_08)). Changing the label a person sees is a display concern and does not touch the value.

**Enforcement:** automated — a lint rule against numeric enums ([INFRA_05](../index.html#INFRA_05)).

### [R10](#R10) Give constrained values a type

An email, a currency code, an order id and a slug are all `string`, which means the compiler will happily let you pass any of them where another was expected. Give each a distinct type, validated once where it is created, and the whole class of argument-order bugs disappears — along with the defensive checks that would otherwise be scattered through the code. This is [GEN_07#R5](../index.html#GEN_07) applied to the primitives everything else is built from.

**Do**

```
type OrderId = string & { readonly __brand: "OrderId" };
function archive(id: OrderId, actor: CustomerId): void;
```

**Don't**

```
function archive(id: string, actor: string): void;
archive(customerId, orderId);   // compiles fine
```

**Enforcement:** partly automated — the compiler enforces it everywhere the branded type is used; nothing forces a new field to use one.

## Worked example

```
type OrderId    = string & { readonly __brand: "OrderId" };
type CustomerId = string & { readonly __brand: "CustomerId" };

type Order = {
  id: OrderId;
  customerId: CustomerId;
  total: Money;              // minor units + currency  (R5)
  placedAt: Instant;         // UTC                     (R2)
  deliverBy: CalendarDate;   // no time, no zone        (R4)
  status: "placed" | "shipped" | "archived";  //         (R9)
};
```

Six fields, and every one of them is unmixable with the others. The two ids cannot be swapped at a call site, the total cannot be added to a different currency by accident, and `placedAt` cannot be compared to `deliverBy` without someone deciding what that means — which is the point, because that comparison is where the timezone bug would have been.

## Checklist

- Public ids are UUIDv7; no sequential id is exposed ([R1](#R1)).
- Instants are UTC in storage and on the wire ([R2](#R2), [R3](#R3)).
- Calendar dates are not stored as instants ([R4](#R4)).
- Money is integer minor units with a currency ([R5](#R5)).
- No cross-currency arithmetic; no rounding inside the domain ([R6](#R6)).
- Quantities carry their unit ([R7](#R7)).
- Every parse and format passes an explicit locale and timezone ([R8](#R8)).
- Enumerations are string unions; no shipped value was changed ([R9](#R9)).
- Constrained values have their own type ([R10](#R10)).

## Open questions

- No library is named for money, time or branded types. Each is a real choice with real trade-offs and belongs in an ADR ([GEN_13](../index.html#GEN_13)); the rules above hold whichever way it goes.
- [R5](#R5) uses `number` for minor units, which is exact only below 2^53. That is far beyond any amount this kind of system handles, but it is a stated limit rather than an absent one — a project handling large sums must revisit it.
- [R10](#R10)'s branding is a convention, not a language feature, so it can be cast away. Whether to adopt a runtime-validated wrapper instead is undecided and depends on the schema library chosen at the contract seam ([GEN_08](../index.html#GEN_08)).

## Related

Requires [GEN_07](../index.html#GEN_07). See also [BE_04](../index.html#BE_04), [BE_08](../index.html#BE_08).

---

[← All conventions](../index.html)
