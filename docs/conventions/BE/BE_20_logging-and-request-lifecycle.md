---
title: "BE_20 · Logging, tracing & the request lifecycle"
id: "BE_20"
area: "BE"
tier: "P2"
status: "draft"
updated: "2026-09-27"
requires: [BE_09, INFRA_14]
see_also: [GEN_09, BE_02]
---

[Conventions](../index.html) / Backend / BE_20

# [BE] Logging, tracing & the request lifecycle

`P2` · `BE_20` · `draft` · `updated 2026-09-27`

**Open when:** you are adding a middleware, guard, interceptor, pipe or filter — or a log line.

The order those run in, request-context propagation, correlation ids, log levels, and what must never be logged.

## The rules

If you read nothing else:

1. <a id="R1"></a>Know the lifecycle order before you add a piece to it, and put each piece at the earliest point that can do its job.
2. <a id="R2"></a>A lifecycle piece decides, records or transforms. It holds no business rule.
3. <a id="R3"></a>Every request carries a correlation id from its first middleware, and every log line for that request includes it.
4. <a id="R4"></a>Propagate request context through a context store, never by adding a parameter to a domain or application signature.
5. <a id="R5"></a>A log line is structured data with a stable event name, not a sentence with values interpolated into it.
6. <a id="R6"></a>Use the level that matches who must act: `error` someone, `warn` maybe, `info` nobody, `debug` only you.
7. <a id="R7"></a>Log a failure once, where it is handled. Never at every layer it passes through.
8. <a id="R8"></a>Never log a credential, a token, a personal identifier, or the content a person entrusted to the product.
9. <a id="R9"></a>Log the boundaries of a request and the decisions inside it, never the payloads either way.

## Why

Logs are the only free view of a running system, and worth exactly what the discipline behind them is worth. A log nobody can search is a log nobody reads, which is why [R5](#R5) insists on structure: `resource.update.rejected` with fields can be counted, alerted on and correlated; "Failed to process request for user 42" can only be grepped by someone who already suspects the problem.

The rules about what not to log do more work than they look like. A product storing something on a person's behalf has usually promised who may read it, and a log line printing that content defeats the promise from the side: the architecture is intact, the data sits in a searchable index with a different audience, and no design review would catch it ([R8](#R8)).

The cost: structured logging is more work per line, and a context store is indirection. Both are cheap now and expensive to retrofit.

## Rule detail

### [R1](#R1) Learn the order, then choose the earliest useful point

The framework runs lifecycle pieces in a fixed sequence: middleware, guards, inbound interceptors, pipes, the handler, outbound interceptors, then filters on a thrown error. Each sees a different amount of the request, which is the basis for choosing: put a piece at the earliest point that can do its job. A correlation id has no dependencies, so it goes in the first middleware ([R3](#R3)); authorization needs the route's metadata, so it cannot be middleware. Getting this wrong rarely throws — it produces a check that silently never runs.

**Enforcement:** review.

### [R2](#R2) A lifecycle piece is not a place for business rules

Guards, pipes, interceptors and filters are transport machinery: they decide whether a request proceeds, record it, or reshape what crosses the boundary. A rule about what the product means belongs in a use case, testable without a request ([BE_02](../index.html#BE_02) R5).

The tell is a lifecycle piece reading the database to make a judgement. The same rule then lives in two places — the piece, and the use case that cannot assume the piece ran — and they drift. [BE_02](../index.html#BE_02) R9 keeps these files in `presentation/` or `shared/`.

**Enforcement:** partly automated — the architecture check sees a lifecycle file importing a repository; it cannot see a rule reimplemented inline.

### [R3](#R3) One correlation id, from first middleware to last log line

The first middleware establishes a correlation id: the caller's if it sent one, a fresh one otherwise. Every line emitted while handling that request carries it, and it returns on the response so a person can quote it. [GEN_08](../index.html#GEN_08) R6 owns that wire contract; this rule owns what happens inside. [BE_09](../index.html#BE_09) R9 depends on it — its generic error response is useful only because the id in it leads somewhere.

**Enforcement:** review — that the id exists is testable; that every line carries it depends on binding it to the logger once, which is the reason to bind it once.

### [R4](#R4) Context propagates, it is not passed

A use case should not take a correlation id or a locale as parameters purely so something deeper can log them. That threads transport concerns through every signature between boundary and leaf, and the domain ends up naming things it has no opinion about.

Instead the boundary puts request context into a context store and whatever needs it reads there. An invisible value is harder to trace than a parameter; the alternative is worse. What is *not* context: anything a business rule branches on — if a use case behaves differently, that difference is an argument.

**Enforcement:** review — the architecture check can flag a domain signature naming a transport concern.

### [R5](#R5) A log line is data

Every line has a stable event name and fields beside it, not values interpolated into prose. The name is what you search, count and alert on, so it survives rewording; the fields are what you filter by. A line assembled as a sentence can only be found by someone who guesses the wording.

The message is not where the values go. `request rejected` with `reason` and `route` as fields beats `Rejected POST /x because the token expired`, even though the second reads better in a terminal.

**Enforcement:** unenforced — see [Open questions](#open-questions).

### [R6](#R6) Levels mean who must act

`error` — a person must look, and something broken will not fix itself. `warn` — unexpected, but handled; worth a pattern, not a page. `info` — notable, nobody need act. `debug` — for the author, off in production.

The failure is inflation: when expected conditions log at `error`, the level stops meaning anything and real errors drown. A failed sign-in attempt is not an `error` — it is the system working. [BE_09](../index.html#BE_09) R1's three kinds map cleanly: a domain error is usually `info` or `warn`, an infrastructure failure `error`.

**Enforcement:** review.

### [R7](#R7) Log a failure once

A failure logged and rethrown at three layers produces three lines for one event, and the reader cannot tell whether one thing failed or three did. Log where it is handled — the filter that turns it into a response ([BE_09](../index.html#BE_09) R8), or the use case that recovers. This is [BE_09](../index.html#BE_09) R10's other half: rethrowing is not the moment to log. Where a layer knows something the handler will not, it attaches that to the error, not to a second line.

**Enforcement:** review.

### [R8](#R8) Some values never reach a log

Never log: passwords or any secret, tokens and session identifiers, whole bodies, personal identifiers beyond what an operator needs, and **the content a person entrusted to the product**.

That last class is the one forgotten, because it is not a secret in the security sense and a debugging session is exactly when someone wants it. Log identifiers instead: an id plus a correlation id is enough to investigate. [GEN_09](../index.html#GEN_09) owns the wider privacy baseline.

**Enforcement:** review — a field-name denylist would catch the obvious cases and is a candidate guardrail.

### [R9](#R9) Log boundaries and decisions, not payloads

Two lines per request at the edge: one that it arrived, one that it completed with outcome and duration. Between them, log decisions — what was refused and why, which branch was taken, which external call answered how. Payloads are large, contain everything [R8](#R8) forbids, and answer a question you rarely have; the shape of a failing request is almost always recoverable from its identifiers.

**Enforcement:** review.

## Worked example

A request arrives to change something a person owns, and fails because they no longer may.

The first middleware mints a correlation id and puts it on the request and the response header ([R3](#R3)). It has no dependencies, so it runs earliest ([R1](#R1)), and it also puts the id and the resolved actor into the context store so nothing below needs them as parameters ([R4](#R4)).

An inbound interceptor logs `http.request.started` with route and method — a boundary line, no body ([R9](#R9)), at `info` ([R6](#R6)).

A guard establishes who is calling; a pipe validates the payload; the handler calls a use case, which throws a domain error carrying a code ([BE_09](../index.html#BE_09) R2). The use case does **not** log it — it is not handling it ([R7](#R7)).

The exception filter turns the error into a response ([BE_09](../index.html#BE_09) R8) and logs it once, at `warn`: event `authorization.refused`, with fields for the code, the route, the actor's identifier and the correlation id. Not the payload, not the actor's name, not what they were trying to write ([R8](#R8)).

The outbound interceptor logs `http.request.completed` with status and duration. Three lines, one correlation id, nothing an operator should not read.

Had the database refused a connection instead, one thing changes: the filter logs at `error`, and the response carries a generic error plus the correlation id ([BE_09](../index.html#BE_09) R9).

## Checklist

- The new lifecycle piece is at the earliest point that can do its job, and the order was checked ([R1](#R1)).
- It decides, records or transforms — no business rule, no repository ([R2](#R2)).
- A correlation id exists from the first middleware and appears on every line for the request ([R3](#R3)).
- No transport concern was added to a domain or application signature ([R4](#R4)).
- Every new line has a stable event name and fields, not an interpolated sentence ([R5](#R5)).
- Each level matches who must act, and no expected condition logs at `error` ([R6](#R6)).
- Each failure is logged once, where it is handled ([R7](#R7)).
- No credential, token, body, or entrusted content is logged — identifiers only ([R8](#R8), [R9](#R9)).

## Open questions

- [R5](#R5) is unenforced. A lint rule requiring a literal event name as the logger's first argument would catch most of it, and cannot tell a good name from a bad one.
- [R8](#R8) has no denylist. A field-name check catches `password` and `token` and misses everything domain-specific, which is the class that matters most. A redacting serialiser is the stronger answer and needs the logger chosen first.
- The event-name vocabulary is undefined; `area.thing.happened` is the shape implied above.
- `INFRA_14` is `todo`, so where logs are shipped, how long they are kept, and whether traces exist alongside them are open. This document assumes only that a line leaves the process and is searchable by field — where that does not hold, none of it is enforceable.

## Related

Requires [BE_09](../index.html#BE_09), [INFRA_14](../index.html#INFRA_14). See also [GEN_09](../index.html#GEN_09), [BE_02](../index.html#BE_02), [GEN_08](../index.html#GEN_08).
