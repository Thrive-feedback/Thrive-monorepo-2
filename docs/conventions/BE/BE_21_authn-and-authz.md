---
title: "BE_21 · Authentication & authorization"
id: "BE_21"
area: "BE"
tier: "P2"
status: "draft"
updated: "2026-09-27"
requires: [BE_20]
see_also: [FE_19, GEN_09]
---

[Conventions](../index.html) / Backend / BE_21

# [BE] Authentication & authorization

`P2` · `BE_21` · `draft` · `updated 2026-09-27`

**Open when:** an endpoint must know who is calling, or refuse them.

Token/session strategy, guards and decorators, where RBAC/ABAC policy lives, propagating the current actor into the domain, and how permissions are tested.

## The rules

If you read nothing else:

1. <a id="R1"></a>Authentication answers who is calling. Authorization answers what they may do. Never let one file answer both.
2. <a id="R2"></a>Verify the caller's credential at the boundary, and turn it into an actor before any handler runs.
3. <a id="R3"></a>Resolve the actor to a tenant-scoped membership before a use case runs, and pass that membership, not the credential.
4. <a id="R4"></a>Enforce tenant scope where it cannot be forgotten, not in each endpoint that remembers to.
5. <a id="R5"></a>Decide authorization in the application layer. Transport may refuse early, but it is never the only check.
6. <a id="R6"></a>Deny by default. An endpoint with no stated rule is closed, not open.
7. <a id="R7"></a>Keep coarse capability checks and per-resource rules apart: capability in the use case's guard clause, resource rules in the aggregate.
8. <a id="R8"></a>The actor reaches the domain as plain data — identifiers and capabilities, never a framework object.
9. <a id="R9"></a>Depend on an abstract identity port, so the provider can be replaced without touching a use case.
10. <a id="R10"></a>Every rule ships with a test that proves the refusal, not only the success.

## Why

An authorization bug does not look like a bug. It returns `200`, the shape is right, and the only thing wrong is *whose* data is in it. No type system, happy-path test or correctness review catches that — which is why [R10](#R10) wants the refusal test and [R4](#R4) puts tenant scope somewhere it cannot be omitted. The cost is indirection and a negative test per rule, cheap now and not retrofittable.

Authorization is also usually modelled one level too shallow: "is the caller an admin?" is a question about a person, where an endpoint's real question is "may *this* caller do *this* to *this* thing, in *this* tenant?" — a membership, not an account. Conflating them gives one tenant's administrator every tenant, from a single missing predicate ([R3](#R3)).

Third, identity providers get replaced. The provider decides how a credential is proved and nothing else; every rule about who may do what belongs to the product, in its own tables, keyed by an identifier the provider hands over ([R9](#R9)). A codebase that spreads provider types through its use cases has chosen its provider permanently.

## Rule detail

### [R1](#R1) Two questions, two places

Authentication proves a credential and produces an actor; authorization decides what that actor may do. They fail differently — an unauthenticated caller should retry with a credential, an unauthorized one should not retry at all — and a file doing both hides which of the two refused, which is exactly what a caller needs to know.

**Enforcement:** review.

### [R2](#R2) Verify once, at the boundary

The credential is verified at the edge: signature or session validated, expiry checked, identifier extracted. Below that point code assumes an authenticated actor or none, never an unverified one. Verifying again deeper means something upstream is not trusted, and the fix is the boundary, not a second check. The actor holds the provider's opaque identifier and nothing it asserts about permissions ([R9](#R9)).

**Enforcement:** review — that a route is behind the boundary is checkable once a default-deny mechanism exists ([R6](#R6)).

### [R3](#R3) An actor is not yet a membership

An authenticated actor is a person; every use case's question is about a *membership* — that person's standing inside one tenant, and the capabilities it carries. One actor may hold memberships in several tenants, with different capabilities in each.

So resolution happens once, before the use case: take the actor and the tenant concerned, load the membership, refuse if there is none. The use case receives the membership and never sees the credential. Skipping this is how "is the caller an admin?" becomes "may administer every tenant" — one missing predicate, no visible symptom.

**Enforcement:** review — a use case accepting a raw credential or an unscoped actor is checkable by the architecture check.

### [R4](#R4) Tenant scope belongs somewhere it cannot be forgotten

Every read and write is scoped to one tenant. Per-endpoint enforcement holds until the endpoint someone wrote in a hurry, which returns other tenants' rows with a `200`. So put it where omission is impossible: the repository takes the tenant as a required argument, not an optional filter. The test is not "do our endpoints scope correctly" but "can one be written that does not".

**Enforcement:** partly automated — a required parameter makes the omission a type error, which is the strongest available guarantee. Nothing checks a query written around it.

### [R5](#R5) The decision lives in the application layer

[BE_02](../index.html#BE_02) R5 says presentation handles transport only. A guard may refuse early — cheap, and it keeps obvious rejections out of the application — but never as the only check: a use case that assumes a guard ran is wrong when called from a job, a command, or a second transport. State the rule in the use case, testable without a request ([BE_11](../index.html#BE_11)). Where a guard duplicates it, the duplication is deliberate and the use case stays authoritative.

**Enforcement:** review.

### [R6](#R6) Closed unless opened

An endpoint with no stated authorization rule is refused, not allowed. The alternative makes every new endpoint public until someone remembers, invisibly, because a working endpoint looks like success. So opening a route is explicit: a marker for genuinely public ones, a stated rule for the rest — and a missing rule becomes a refusal in development rather than an exposure in production.

**Enforcement:** partly automated — a global default-deny makes the absence of a rule fail closed. That a route was deliberately opened is review.

### [R7](#R7) Capability and resource are different questions

Two rules hide under "authorization". *May this membership do this kind of thing at all?* is a capability check — coarse, answerable from the membership alone, refused before anything loads, and it belongs in the use case's guard clause. *May it do this to this particular thing?* is a resource rule: it needs the thing loaded and belongs to the aggregate that owns it ([BE_04](../index.html#BE_04)), because "only the author may withdraw this" is a sentence about the aggregate.

**Enforcement:** review.

### [R8](#R8) The domain receives data, not framework objects

The domain takes the membership's identifier and capabilities as plain values, never a request, session, token or provider user object. [BE_02](../index.html#BE_02) R3 forbids the domain importing anything outside itself, and a provider type in a domain signature breaks that as surely as an HTTP import. Neither kind of use case takes an object that exists only because a request happened — which is what lets both be called from a job.

**Enforcement:** partly automated — the architecture check sees a framework or provider import in `domain/`.

### [R9](#R9) The provider sits behind a port

Whatever proves credentials sits behind an abstract port, implemented in `infrastructure/` ([BE_02](../index.html#BE_02) R6). The port speaks in the product's terms — verify this credential, return this identifier — and provider types stop at the adapter ([BE_02](../index.html#BE_02) R7). Membership and capabilities stay in the product's own tables, keyed by that identifier, so swapping provider touches the adapter and `PROJECT.md` and no use case. A provider's own organization or team feature is the thing to refuse: adopting it hands a core part of the model to something you do not control and cannot query alongside your own data.

**Enforcement:** review — a provider package imported outside `infrastructure/` is checkable.

### [R10](#R10) Test the refusal

For every rule, a test that the wrong caller is refused. The success test proves the feature works; only the refusal test proves the rule exists, and a rule with no negative test is indistinguishable from one someone deleted. Minimum per protected use case: the right membership succeeds, one in another tenant is refused, one without the capability is refused, no actor is refused ([BE_11](../index.html#BE_11)).

**Enforcement:** review — coverage tools count the line; nothing verifies a negative case exists. See [Open questions](#open-questions).

## Worked example

An endpoint archives a record belonging to one tenant, and only certain memberships may archive.

The boundary verifies the credential and produces an actor holding one opaque identifier ([R2](#R2)). Because the route states a rule, default-deny lets it through to a resolution step, which takes the actor plus the tenant concerned and loads the membership, refusing if there is none ([R3](#R3), [R6](#R6)). The handler calls the use case with the membership and the record's identifier — not the credential, not the request ([R8](#R8)).

The use case asks two questions in order. Does this membership carry the capability to archive at all? A guard clause, refused before anything loads ([R7](#R7)). Then it loads the record through a repository requiring the tenant as an argument, so another tenant's record cannot be returned ([R4](#R4)) — omission would be a type error, not a review miss.

Finally the aggregate decides whether *this* record may be archived, returning a domain error with a code ([BE_09](../index.html#BE_09) R2) that is logged once, without the payload ([BE_20](../index.html#BE_20) R7, R8).

Four tests, not one ([R10](#R10)): the right membership archives; one in another tenant is refused; one without the capability is refused; no actor is refused. None needs a running server.

## Checklist

- Authentication and authorization are decided in different places, and refusals are distinguishable ([R1](#R1)).
- The credential is verified once, at the boundary, and nothing below re-verifies it ([R2](#R2)).
- The actor is resolved to a tenant-scoped membership before the use case, which never sees the credential ([R3](#R3)).
- Tenant scope is structural — a required argument, not an optional filter ([R4](#R4)).
- The authoritative decision is in the use case; any guard is an early exit, not the only check ([R5](#R5)).
- The route states its rule, and an endpoint without one is refused ([R6](#R6)).
- Capability checks are guard clauses; per-resource rules are on the aggregate ([R7](#R7)).
- No framework or provider type appears in a domain signature ([R8](#R8)).
- The provider is behind a port; membership and capabilities are in the product's own tables ([R9](#R9)).
- Every rule has a test proving the refusal, including the other-tenant case ([R10](#R10)).

## Open questions

- [R10](#R10) is unenforced by tooling. Coverage counts a line; nothing asserts a negative case exists. A convention that every protected use case's spec file contains a refusal case is checkable by name and is the strongest candidate guardrail here.
- Whether [R3](#R3)'s resolution step is a guard, an interceptor or an explicit call. The rule fixes *when*, not the mechanism, because [BE_20](../index.html#BE_20) R1's ordering may decide it.
- How capabilities are named, and whether a membership carries a role name or a capability list, is unresolved — it belongs with the first module having more than one role.
- Nothing describes how a membership is revoked mid-session, which matters as soon as credentials outlive a request.

## Related

Requires [BE_20](../index.html#BE_20). See also [FE_19](../index.html#FE_19), [GEN_09](../index.html#GEN_09), [BE_02](../index.html#BE_02), [BE_04](../index.html#BE_04), [BE_11](../index.html#BE_11), [BE_09](../index.html#BE_09).
