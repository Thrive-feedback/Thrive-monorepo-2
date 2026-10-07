# 0029 — Every API route requires a session unless marked public

Status:   accepted
Date:     2026-10-04
Deciders: kritpavin

## Context

Task #71 adds `POST /v1/profiles`, the first API route that has to know who is calling. Until now
every route was open: `/v1/sessions/*` only ever touches the caller's own session, and `/health` is a
probe. Each later Task adds routes that must refuse a stranger, including #72 (Workspace) and #73
(Invitations). Whichever pattern this route sets is the one they copy.

`BE_21` says to deny by default (R6) and to check the credential at the boundary, turning
it into an actor before any handler runs (R2). ADR 0027 fixes the credential: the browser's `cookie`
header, forwarded by the web server.

## Decision

**Every API route requires a live session, unless it is marked `@Public()`.**

- `SignedInGuard` lives in Identity's presentation layer and is registered as the app's global
  guard (`APP_GUARD`). It reads the session through `IdentityPort`, so it never sees Better Auth.
- A caller without a live session is refused with `401 NOT_SIGNED_IN`. That is the new
  `unauthenticated` error category, mapped in `CodedErrorFilter` like the others.
- A caller with a session becomes an `Actor`: `{ accountId, email }`, plain data. Handlers read
  it with `@CurrentActor()`. `Actor`, `@Public()` and `@CurrentActor()` live in
  `shared/presentation/actor.ts`, because every module's controllers use them.
- `@Public()` is on `SessionController`, because signing in has to work while signed out, and on
  `HealthController`.
- Better Auth's callback, `/api/auth/callback/*`, is middleware rather than a route, so the guard
  does not reach it.

## Alternatives

- **A guard only on the routes that need one.** This is the smallest change. But a route whose
  author forgets the decorator ships open, and nothing fails to say so. Rejected (`BE_21` R6).
- **Each use case reads the session itself.** This puts the credential below the boundary and
  repeats the check in every Task. Rejected (`BE_21` R2).

## Consequences

- A new route is closed until someone writes `@Public()` on purpose, which shows up in review.
- Every guarded request reads the session once in the guard. A handler that also needs the session
  (none yet) reads it again. Passing the guard's read through the request context waits for
  `BE_20`'s context store.
- The actor is Account-level only. `BE_21` R3's tenant-scoped membership arrives with Workspaces
  (#72), as a second step after this guard rather than a change to it.
- The cookie header is declared on each route that reads it (`presentation/dto/cookie-header.dto.ts`), so
  the generated client can forward it.

Supersedes: —
Referenced by: `PROJECT.md` §4, `apps/api/src/modules/identity/presentation/signed-in.guard.ts`
