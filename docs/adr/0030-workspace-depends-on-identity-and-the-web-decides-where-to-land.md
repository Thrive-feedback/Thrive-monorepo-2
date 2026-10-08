# 0030 — Workspace depends on Identity, and the web decides where a person lands

Status:   accepted
Date:     2026-10-08
Deciders: kritpavin

## Context

Task #72 adds the Workspace module, which owns Workspace and Member (`domain-map.md` in the brain).
Two needs pull the two modules toward each other:

- Creating a Workspace must be refused to someone who has not introduced themselves. Profile is
  Identity's.
- Where a signed-in person lands depends on both modules. With no Profile they go to *Introduce
  yourself*, with no Workspace to *Create a Workspace*, and as a Member to Home. #72 asks for this
  rule to be decided in one place, and #75 will add a branch to it.

The obvious way to meet the second need is to add the person's membership to
`GET /v1/sessions/current`. That makes Identity ask Workspace. Together with the first need, the two
modules would then depend on each other: a cycle, which `no-cycles` forbids (`INFRA_03` R1). It also
points the wrong way, because Identity is a generic context and Workspace a supporting one.

## Decision

**Workspace depends on Identity, never the other way round. The web reads the session and the
person's memberships in parallel and decides where to land.**

- Identity publishes `HasProfilePort` (`hasProfile(accountId)`) from its barrel. Workspace's
  `CreateWorkspaceUseCase` asks it and refuses with `409 PROFILE_REQUIRED`.
- `GET /v1/sessions/current` is unchanged. Workspace adds `GET /v1/members/mine`, the caller's
  memberships as a paged list. It is a list although one Workspace per person is the rule today:
  that rule belongs to this release (ADR-0020 in the brain), not to the contract.
- The web reads both with `Promise.all`, so a page still waits for one round trip.
  `landingFor(account, membership)` in `apps/web/lib/session/session.service.ts` is the only place the
  rule lives. Every guard (`requireMember`, `requireAccountToIntroduce`,
  `requireAccountToCreateWorkspace`) redirects to whatever it answers.
- `cookie-header.dto.ts` moves from Identity to `shared/presentation/dto/`, now that a second module
  declares the header (`BE_01` R8).

## Alternatives

- **Membership in `sessions/current`, with the Profile check left to the web.** This keeps one API
  call, but the API would then create a Workspace for an Account with no Profile, and Identity
  would still know Workspace. Rejected.
- **The API answers a `nextStep`.** The API would then know the order of the web's screens, which
  #125 is removing. Rejected.
- **Pass `hasProfile` on the `Actor` from the global guard.** This avoids the import, but it costs a
  Profile query on every guarded request and leaves Identity's guard serving Workspace's rule.
  Rejected.

## Consequences

- Every signed-in page makes two API calls, in parallel. If that ever shows in latency, the fix is a
  read model on the web side, not an Identity → Workspace dependency.
- A new step in sign-up, such as #75's *You were invited*, is one branch in `landingFor` and one
  guard.
- The Profile check happens outside the Workspace transaction (ADR 0031), because no transaction
  spans two modules (`BE_03` R7). Since a Profile is never deleted, a check that passed stays true.
- `BE_21` R3 (resolve the actor to a tenant-scoped membership) is still not built. No route acts
  inside a Workspace yet. The first one that does adds it.
- ADR 0029 names the cookie header's old path. The file now lives in `shared/presentation/dto/`.

Supersedes: —
Referenced by: `PROJECT.md` §4, `apps/api/src/modules/workspace/workspace.module.ts`,
`apps/web/lib/session/session.service.ts`
