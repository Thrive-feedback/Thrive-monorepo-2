# 0026 — The browser reaches auth only through the web origin

Status:   accepted
Date:     2026-10-02
Deciders: kritpavin

## Context

ADR 0025 runs Better Auth inside the API (`:3000`), but people use the web app (`:3001`).
Task #70 needs the browser to sign in with Google, hold a session, and sign out. Three things are
fixed already:

- **`FE_10` R1:** the web app talks to the API only through the generated client.
- **`FE_10` R8:** credentials stay on the server.
- **Google** sends the browser back to one registered redirect URI.

Every later auth task inherits how the session cookie reaches the browser and what it is called.
The decision is recorded before anything builds on it (`GEN_04`).

## Decision

**The browser only ever talks to the web origin.**

- **The callback.** Google's redirect URI is `<web origin>/api/auth/callback/google`. A Next.js
  rewrite forwards exactly that path, `/api/auth/callback/*`, to the API, where Better Auth's own
  handler serves it. No other Better Auth route is exposed.
- **Everything else.** Signing in, reading the session and signing out go through Thrive's own
  endpoints:
  - `POST /v1/sessions/google`
  - `GET /v1/sessions/current`
  - `DELETE /v1/sessions/current`

  They are in the OpenAPI contract. The web server calls them through the generated client,
  forwards the browser's `cookie` header in, and copies `Set-Cookie` back out.
- **`BETTER_AUTH_URL` is the web origin**, because Better Auth builds the redirect URI and every
  post-sign-in redirect from it.
- **The session cookie is `thrive.session_token`** (`advanced.cookiePrefix: 'thrive'`). Better
  Auth names it `__Secure-thrive.session_token` on https. Code outside the auth adapter only checks
  that the cookie is present, and only to skip a pointless API call. The API's answer is the check
  that counts.

## Alternatives

- **The browser calls the API directly** (`:3000/api/auth/*`). This needs CORS with credentials.
  On real domains the cookie would belong to the API's host, so the web app's pages would never
  receive it without a shared parent domain or third-party cookies. Rejected.
- **The web app uses Better Auth's client** (`better-auth/react`) through a full `/api/auth/*`
  proxy. This is less code, but it is a second, hand-wired way to call the backend, against
  `FE_10` R1. Rejected.

## Consequences

- The session cookie is first-party on the web origin. There is no CORS, and Google's tokens never
  reach the browser: the backend-for-frontend shape that OAuth guidance for browser apps
  recommends.
- Because the API answers the web *server*, the web server has to copy `Set-Cookie` onto its own
  response exactly, without re-encoding signed values.
- The callback route is the one Better Auth endpoint outside the contract. Changing its path means
  changing the rewrite, Google Console and this ADR together.
- Requests reach the API from the web server, so the IP address Better Auth stores on a session is
  the web server's until forwarded headers are trusted.
- Each Google OAuth client registers `<web origin>/api/auth/callback/google`, one per environment.

Supersedes: —
Referenced by: `PROJECT.md` §4, ADR 0025
