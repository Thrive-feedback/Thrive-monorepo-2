---
title: "GEN_09 · Security & privacy baseline for developers"
id: "GEN_09"
area: "GEN"
tier: "P1"
status: "stable"
updated: "2026-08-15"
requires: [GEN_01]
see_also: [BE_10, BE_22, INFRA_15]
---

[Conventions](../index.html) / General / GEN_09

# [General] Security & privacy baseline for developers

`P1` · `GEN_09` · `stable` · `updated 2026-08-15`

**Open when:** you touch secrets, credentials, personal data, or logs.

The five hard rules at the top of the index, expanded: secret handling, PII classification and redaction, OWASP Top 10 as a review lens, and responsible disclosure.

## The rules

If you read nothing else:

1. <a id="R1"></a>No secret in source, in a commit, in a URL, in a log line, or in an error message.
2. <a id="R2"></a>A leaked secret is rotated first and removed second. Deleting it from git does not un-leak it.
3. <a id="R3"></a>Classify data before you store it, and write the classification down next to the field.
4. <a id="R4"></a>Log the identifier, never the personal data behind it.
5. <a id="R5"></a>Collect the least you can, and be able to state when it is deleted.
6. <a id="R6"></a>Validate at the boundary; encode at the sink. Neither substitutes for the other.
7. <a id="R7"></a>Deny by default. A new endpoint, field or route is closed until someone opens it on purpose.
8. <a id="R8"></a>Treat every value from outside as hostile — including one your own system produced earlier.
9. <a id="R9"></a>Run the OWASP Top 10 as a lens over any change that touches a boundary.
10. <a id="R10"></a>Report a suspected vulnerability privately. Never in a public issue, branch name, or pull request title.

## Why

Almost every breach that reaches the news is one of a small number of ordinary mistakes made by someone competent in a hurry: a credential committed, a log line with a token in it, an endpoint that forgot to check who was asking. None of them require an attacker to be clever. They require only that nobody was looking at the moment the code was written.

Privacy fails more quietly. Personal data is rarely leaked; it is copied — into a log, a cache, an analytics payload, a support ticket, a test fixture — until nobody can answer where it is or when it goes away. The rules below are mostly about not making that copy.

## Rule detail

### [R1](#R1) Where a secret may not be

Not in source, because source is copied everywhere. Not in a commit, because history is forever. Not in a URL, because URLs land in browser history, proxy logs, referrer headers and error reports. Not in a log or an error message, because those are the two places we deliberately keep and forward. Secrets reach the process through configuration, and only through the typed config layer ([BE_10](../index.html#BE_10), [INFRA_07](../index.html#INFRA_07)).

**Do**

```
const token = config.provider.apiToken;
logger.info({ providerCall: "charge", orderId });
```

**Don't**

```
const token = "sk_live_9f2c…";
logger.info(`calling ${url}?api_key=${token}`);
throw new Error(`auth failed for token ${token}`);
```

**Enforcement:** automated — secret scanning ([INFRA_15](../index.html#INFRA_15)), plus review.

### [R2](#R2) Rotate first

The instinct on discovering a committed credential is to remove the commit. That is the second step and it is the less important one — by the time you noticed, the value has been on a laptop, in CI, in a fork, and possibly in a scraper's index. Rotate it, confirm the old value is dead, then clean the history. If the secret was ever pushed to a shared remote, assume it is public and say so in the incident note rather than hoping.

**Enforcement:** review — and the scanner that found it should stay noisy until the rotation is confirmed.

### [R3](#R3) Classify before you store

Four classes are enough. Write the class where the field is defined, so the next person does not have to guess whether a column is safe to log, export or copy into a fixture.

| Class | Examples | Rule |
| --- | --- | --- |
| **public** | product names, public ids | No restriction. |
| **internal** | internal ids, counts, statuses | Not exposed outside the system without a reason. |
| **personal** | name, email, address, IP | Never logged; minimized; deletable. |
| **sensitive** | credentials, tokens, health, financial, government ids | Never logged, never cached, encrypted at rest, access recorded. |

**Enforcement:** review — a lint rule cannot see what a string means.

### [R4](#R4) Log the pointer, not the value

A log line with an id is as useful for debugging as one with an email address, and it does not turn the logging system into a second copy of the user database with different access controls and a different retention policy. This applies equally to traces, metric labels, analytics events, and the error messages that reach a bug tracker. When something must be shown, redact at the point of writing, not at the point of reading.

**Do**

```
logger.warn({ customerId, reason: "card_declined" });
```

**Don't**

```
logger.warn(`declined for ${email} card ${last4}`);
logger.debug({ request: req.body }); // whatever it held
```

**Enforcement:** partly automated — a redacting serializer in the logger ([BE_20](../index.html#BE_20)); otherwise review.

### [R6](#R6) Validate at the boundary, encode at the sink

These are different jobs and neither one covers the other. Validation says a value is acceptable to this system; it happens once, where the value enters ([BE_08](../index.html#BE_08)). Encoding says a value is safe for the place it is about to go — parameterized for SQL, escaped for HTML, quoted for a shell — and it happens every time, at each sink, because the same validated string is dangerous in different ways depending on where it lands.

**Enforcement:** partly automated — lint rules catch obvious injection sinks; [BE_22](../index.html#BE_22) owns the mechanics.

### [R8](#R8) Including values you produced

The subtle half of the rule. A signed token, a redirect target, a filename, an id that came back from a client — all of them left your system and can return changed. The common bug is an id from the request used to look something up without checking the requester is allowed to see it, which reads as ordinary code and is the most-exploited flaw in web applications. Ownership is checked where the object is loaded, not where the route is declared.

**Do**

```
const order = await orders.findForCustomer(
  orderId, actor.customerId);
if (!order) throw new OrderNotFound(orderId);
```

**Don't**

```
// authenticated, so the id must be theirs
const order = await orders.findById(orderId);
```

**Enforcement:** review — checklist item in [GEN_06](../index.html#GEN_06); [BE_21](../index.html#BE_21) owns authorization.

### [R10](#R10) Disclosure

A public issue describing an unfixed vulnerability is a set of instructions. Report it through a private channel, keep the branch name and the pull request title uninformative until it is deployed, and write the real description afterwards. This is the one case where [GEN_06#R3](../index.html#GEN_06)'s "explain why" is deliberately deferred.

**Enforcement:** unenforced — no private channel is defined. See [Open questions](#open-questions).

## Worked example

A support-facing endpoint that returns a customer's recent orders. What the lens catches:

1. **R7** — the route is new, so it is closed until a policy opens it to the support role.
2. **R8** — it takes a `customerId` from the caller. The check is that the actor may view that customer, performed where the data is loaded.
3. **R3**, **R4** — the response carries name and email, both **personal**. The audit log records the actor, the customer id, and the time; not the payload.
4. **R5** — "recent" is defined as a bounded window, not "all", so the endpoint cannot become an export tool.
5. **R9** — broken access control and excessive data exposure are the two Top 10 entries this shape attracts; both are covered above, and saying so in the pull request is the review artifact.

## Checklist

- No secret in code, history, URL, log or error ([R1](#R1)).
- Any exposed secret was rotated before it was removed ([R2](#R2)).
- New stored fields carry a classification ([R3](#R3)).
- Logs, traces and analytics carry ids, not personal data ([R4](#R4)).
- Nothing is collected that the feature does not need; retention can be stated ([R5](#R5)).
- Input validated at the boundary and encoded at each sink ([R6](#R6)).
- New surface is closed by default ([R7](#R7)).
- Every externally supplied identifier is authorized where it is loaded ([R8](#R8)).
- The Top 10 entries this change attracts are named in the pull request ([R9](#R9)).
- Nothing about an unfixed vulnerability was made public ([R10](#R10)).

## Open questions

- [R10](#R10) names no private channel and no response expectation. A boilerplate cannot invent one, but a project using it must, and nothing currently prompts that at initialization ([GEN_03](../index.html#GEN_03)).
- [R5](#R5) requires a stateable retention period; nothing in the document set owns where retention is recorded, so today it lives only in the field's classification comment.
- [R3](#R3)'s classes are unenforced and always will be by tooling. A candidate guardrail is requiring the classification comment on new persisted fields ([INFRA_06](../index.html#INFRA_06)), which catches the omission but not a wrong answer.

## Related

Requires [GEN_01](../index.html#GEN_01). See also [BE_10](../index.html#BE_10), [BE_22](../index.html#BE_22), [INFRA_15](../index.html#INFRA_15).

---

[← All conventions](../index.html)
