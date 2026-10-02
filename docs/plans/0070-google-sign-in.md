# #70 — Sign in and out with a real Google account

Status: planned · 2026-10-02 · kritpavin + Claude
Flow diagram: [`0070-google-sign-in-flow.md`](0070-google-sign-in-flow.md)

## Context

Better Auth is set up in the API with its tables and first migration (commit `680b62e`,
ADR 0025). No route is mounted yet. Sign-in on the web is still a mock:
`app/(public)/_lib/mock-session.service.ts` sets an unsigned cookie holding a sample email. This
plan replaces the mock with real Google sign-in through Better Auth.

## Acceptance criteria

From #70. This plan covers all of them except the personal-account refusal, which is the next
change and still part of #70 (Q3).

| # | Criterion | Here |
| --- | --- | --- |
| AC1 | A company Google account creates an Account on first sign-in and signs in after that | ✓ |
| AC2 | First sign-in lands on *Introduce yourself*, later ones on Home (`/home`) | ✓ |
| AC3 | The session survives a refresh; *Sign out* ends it and returns to `/login` | ✓ |
| AC4 | *Not you?* signs out | ✓ |
| AC5 | No mock data remains in sign-in | ✓ |
| AC6 | A personal Google account (no `hd`) is refused | next change |

#70's Definition of Done also asks for "working on the test site". Nothing is deployed yet
(`PROJECT.md` §5, open decision 3), so this plan checks against `localhost` only.

## Decisions

| # | Decision |
| --- | --- |
| Q1 | The browser only talks to the web origin. A Next rewrite forwards Google's callback to the API. |
| Q2 | "New" means Better Auth just created the Account (`newUserCallbackURL`), so new → `/register/introduce-yourself`, returning → `/home`. Someone who quits registration halfway lands on `/` next time with no Profile. That is accepted until #71 stores Profiles, when "new" becomes "has no Profile". |
| Q3 | Refusing personal Gmail (`hd`) is **deferred** to the next change, still within #70. It must refuse in a `databaseHooks.user.create.before` hook, so a refused account never leaves an Account row. |
| Q4 | The Google OAuth client exists; its id and secret go in `apps/api/.env`. Redirect URI: `http://localhost:3001/api/auth/callback/google`. Teammates get the values from the team's secret store, never from chat or git (`INFRA_07` R4). |
| Q5 | Sign out sits in the existing navbar. The signed-in Home is a new protected `/home` under that layout; `/` stays public, the future landing page (kritpavin, 2026-10-02). |
| Q6 / Q10 | Guards work on two levels: `proxy.ts` checks only that the cookie is present (`FE_19`), and each page then checks the real session. `/home` and `/register/*` need a session; `/login` sends a signed-in person to `/home`; `/` is public. |
| Q7 | Introduce yourself pre-fills **email and Full Name** from Google. Display name follows the first word. |
| Q9 | The web never calls Better Auth directly: **our own Nest endpoints** wrap it, so the web uses only the generated client (`FE_10` R1). |
| Q11 | Routes are one resource, `sessions`, under `/v1` (`BE_07` R1, R4). Sign-out is `DELETE` on the current session (`BE_07` R2). |
| Q12 | Two pull requests: the API and its contract first, then the web (`GEN_08` R8, `FE_10` R10). |
| Q13 | Q1, Q9 and the cookie name are stack decisions every later auth task inherits, so they are recorded as ADR 0026 in PR 1, before anything builds on them (`GEN_04` R9). |

## Conventions

- **Frontend:** `FE_01` (route-private `_lib`, R8 suffixes, no `../`), `FE_08` R5 (env and secrets
  stay out of the client graph), `FE_09` R2 (stated caching intent), R4/R5 (writes are server
  actions, and every action is treated as public), `FE_10` (generated client only, R4 built once
  from config, R6 view models, R8 credentials stay on the server, R10 regeneration alone),
  `FE_11` R9 (redirect on the server, early), `FE_14`.
- **Backend:** `BE_01`/`BE_02`/`BE_05` (an `identity` module with port, use cases and controller),
  `BE_03` R2 (barrel), `BE_07` R1/R2/R4/R10 and ADR 0005 (resource routes, `/v1`, 204 for state
  changes), `BE_08` (zod DTOs), `BE_10`, `BE_12` R1/R7 (adapter tested through its port against
  Postgres).
- **General:** `GEN_04` (this plan), `GEN_08` R6/R8 (correlation id, contract first), `GEN_09` R1,
  `GEN_13` (ADR 0026), `INFRA_07` R2/R4/R6/R9.
- **Interpreted:**
  - `BE_21` (draft): R9 identity port introduced now. R2 and R3 want the credential turned into an
    actor, and then a tenant-scoped membership, before a use case runs. No Workspace or Member
    exists yet, and these three use cases act *on* the session itself. So they take the session
    cookie as an opaque `credential` string that only the adapter reads. The first endpoint that
    acts *as* someone adds the `@Actor()` boundary and the membership step R3 describes.
  - `BE_05` R7 and `BE_02` R7: the port returns the provider's `Set-Cookie` values as an opaque
    `sessionCookies: string[]`. The application layer passes them through without reading them,
    and the controller copies them onto the response. That is the narrowest way to hand a session
    to the browser without the application knowing HTTP.
  - `BE_07` R7: `GET /v1/sessions/current` answers `{ account: … | null }`. The resource is the
    current session, and `account` is its one field, not a `data` wrapper. A signed-out caller is
    a normal answer, not an error.
  - `BE_21` R6 (deny by default): no global guard exists yet. The three routes here are public on
    purpose, since signing in has to work signed out. The default-deny guard comes with the first
    protected endpoint.
  - `FE_19` (todo, index text binding): the proxy does the cheap cookie check and the page does the
    authoritative one. "Redirect-after-login" is not needed yet: the only protected pages are `/`
    and the register steps, and both are reached in order. Its `data-paths` glob still names
    `middleware.ts`; Next 16 calls the file `proxy.ts`. Raised, not edited (`AGENTS.md` §9).
- **Planned column (`PROJECT.md` §4):** nothing needed. No new dependency: `better-auth/node` and
  `server-only` are installed.

## PR 1 — ADR, API and contract

### ADR 0026

`docs/adr/0026-the-browser-reaches-auth-only-through-the-web-origin.md`. It records:

- **Q1:** one origin for the browser, and only Google's callback is rewritten to the API.
- **Q9:** Better Auth sits behind our own `/v1/sessions` endpoints.
- **Why:** the session cookie belongs to the web origin, so there is no CORS or third-party cookie.
- **The cookie name:** `thrive.session_token`, or `__Secure-thrive.session_token` on https.

### `apps/api`

- **Config.** `AuthConfig` gains `googleClientId` and `googleClientSecret` (env `GOOGLE_CLIENT_ID`
  and `GOOGLE_CLIENT_SECRET`, required, no default, `BE_10` R5). `environment.schema.spec.ts` gains
  a case for each missing value. `.env.example` gets placeholders. `BETTER_AUTH_URL` becomes
  `http://localhost:3001`, because Better Auth now lives behind the web origin, and its comment
  says so. The same line changes in each person's `.env`. No separate `webOrigin`:
  `BETTER_AUTH_URL` already is the web origin (`INFRA_07` R6).
- **`infrastructure/auth/auth.ts`.**
  - `socialProviders.google`: client id and secret, `prompt: 'select_account'` so a person can
    switch account after signing out.
  - `trustedOrigins: [config.baseUrl]`.
  - `advanced.cookiePrefix: 'thrive'`, which names the cookie `thrive.session_token`. Better Auth
    adds `__Secure-` in front of it when `baseURL` is https, which is why `proxy.ts` checks both
    names.
- **`AuthModule.configure()`** mounts Better Auth's handler for its callback only, as a GET
  middleware on `api/auth/callback/*provider`. It isn't in `main.ts`, because only a module file
  may import from `infrastructure/` (`BE_02` R2), which `check-arch` enforces. The callback is a
  GET with no body, so Nest's JSON parser doesn't get in the way. It is outside `/v1` because
  Better Auth owns its path.
- **New module `src/modules/identity/`** (`BE_01`). The brain's `domain-map.md` names the Identity
  context, owning Account and Profile. Registered in `app.module.ts`.
  - `application/port/identity.port.ts`: an abstract `IdentityPort` with three methods.
    - `currentAccount(credential)` → `{ email, name } | null`
    - `startGoogleSignIn()` → `{ url, sessionCookies }`
    - `signOut(credential)` → `{ sessionCookies }`
  - `infrastructure/adapter/better-auth-identity.adapter.ts`: implements the port with
    `auth.api.getSession`, `auth.api.signInSocial` and `auth.api.signOut`. It passes
    `callbackURL: '/home?signedIn=1'`, `newUserCallbackURL: '/register/introduce-yourself?signedIn=1'`,
    `errorCallbackURL: '/login'` and `returnHeaders: true`, and reads `getSetCookie()` from the
    returned headers. No Better Auth type leaves this file (`BE_02` R7).
  - `application/use-cases/`: `GetCurrentAccountUseCase`, `StartGoogleSignInUseCase` and
    `SignOutUseCase`, one file each (`BE_05` R1).
  - `presentation/session.controller.ts`, `@Controller('v1/sessions')`, with zod DTOs in
    `presentation/dto/`. Every route declares its request, response and status codes for OpenAPI
    (`BE_07` R10). The controller reads the `cookie` header and passes it as `credential`, and it
    appends `sessionCookies` as `Set-Cookie`.

    | Endpoint | Used for | Returns |
    | --- | --- | --- |
    | `POST /v1/sessions/google` | Start Google sign-in | `200 { url }` + state cookie on `Set-Cookie`. An action that produces a result of its own (`BE_07` R2) |
    | `GET /v1/sessions/current` | Who is signed in | `200 { account: { email, name } \| null }` |
    | `DELETE /v1/sessions/current` | End the session | `204` + cookie-clearing `Set-Cookie` (ADR 0005). Repeatable: with no session it still answers `204` |

    The version lives in the controller path, not in `main.ts`, because
    `scripts/emit-openapi.ts` builds the app without `main.ts`. A global versioning mechanism is
    for when a second controller needs one.
  - `identity.module.ts` binds `IdentityPort` to the adapter (`BE_02` R8). `index.ts` exports
    only `IdentityModule` (`BE_03` R2, R3).
- **Contract.** `turbo run contract:generate --filter=api` regenerates `openapi.json` and
  `packages/api/src/generated/schema.ts`. They go in their own commit, with only the fixes they
  force.

### Checkpoint 1

Before PR 2 starts:

- PR 1 is merged.
- The contract on `main` has the three routes.
- `curl` against the running API shows `{ "account": null }` for `GET /v1/sessions/current`.

## PR 2 — `apps/web`

- **`next.config.js`.** Rewrite `/api/auth/callback/:path*` to `${API_BASE_URL}/api/auth/callback/:path*`,
  so only Google's redirect passes through. It throws at startup if `API_BASE_URL` is missing,
  naming the variable (`INFRA_07` R9).
- **`.env.example`** (new): `API_BASE_URL=http://localhost:3000`, with a comment that it is
  server-only and never `NEXT_PUBLIC_` (`INFRA_07` R8).
- **`app/(public)/_lib/`.**
  - `api-client.service.ts` (`server-only`): builds `createApiClient` once from `API_BASE_URL`, and
    throws naming the variable when it is missing (`FE_10` R4). Correlation ids come from the
    client's default (`GEN_08` R6).
  - `set-cookie.util.ts`: parses an API response's `Set-Cookie` values and writes each onto Next's
    `cookies()`, keeping `Path`, `Max-Age`/`Expires`, `HttpOnly`, `Secure` and `SameSite`. It
    **decodes the value first**: Better Auth's signed values are URL-encoded and Next's
    `cookies().set` encodes again, which would break the signature. It has unit tests.
  - `session.transform.ts`: wire → view model `{ email, name }` (`FE_10` R6).
  - `session.service.ts` (`server-only`): `readSession()`. It calls `GET /v1/sessions/current`
    with the request's cookie and `cache: 'no-store'` (`FE_09` R2), and is wrapped in React
    `cache()`. The navbar and the page both read it, so one request makes one API call, and the
    cache never outlives the request (`FE_09` R10).
  - `session-actions.service.ts` (`'use server'`): only the two actions. Readers stay out of this
    file because every export of a `'use server'` file can be called from the browser (`FE_09` R5).
    - `signIn()`: calls `POST /v1/sessions/google`, copies the state cookie, then `redirect(url)`.
    - `signOut()`: calls `DELETE /v1/sessions/current` with the cookie, copies the cleared cookie,
      then `redirect('/login')`. It needs no authorization: it can only end the caller's own
      session.
- **Delete** `mock-session.service.ts`, its test and `sample-accounts.constant.ts`, which removes
  every #70 TODO. Update the call sites and their tests:
  - `login/_components/sign-in-prompt.tsx`
  - the three `register/*` pages
  - the *Not you?* link in `introduce-yourself-card.tsx` (AC4)
- **`proxy.ts`** (web root, Next 16's name for middleware): for `/home` and `/register/:path*`, no
  `thrive.session_token` and no `__Secure-thrive.session_token` cookie means redirect to `/login`
  (`FE_11` R9).
- **Pages.**
  - New `app/(public)/home/page.tsx`, the signed-in Home, under the navbar layout. Its content
    is the old placeholder. It calls `readSession()` and sends a signed-out person to `/login`.
    `app/page.tsx` stays as it is: public, and the future landing page. Finishing or skipping
    Invite teammates goes to `/home`.
  - `/login`: a signed-in person goes to `/home`. Arriving with `?error=…` from Better Auth raises an
    error toast, "Sign-in didn't finish. Try again."
  - `/home` and Introduce yourself, reached with `?signedIn=1` after Google, raise a success toast,
    "Signed in as <email>". `OneTimeToast` in `(public)/_components/` raises either toast once
    and drops the query, so a refresh shows nothing.
  - Introduce yourself passes `name` into the form as the Full Name default, and Display name
    starts as its first word.
- **Navbar.** `SiteNavbar` becomes async, reads the session, and shows a *Sign out* button
  (a form with the `signOut` action, using the existing `Button`) on the right only when signed in.

## Documents this change updates

| Document | Change | PR |
| --- | --- | --- |
| `docs/adr/0026-…` | New (Q13) | 1 |
| `PROJECT.md` §4, *Auth provider* | "No route is mounted yet" → the callback and `/v1/sessions` are mounted; Google is the one provider | 1 |
| `PROJECT.md` §4, *Vitest* | Unchanged: the web tests mock the generated client, so still no MSW server | — |
| `docs/adr/0025` | `Referenced by:` gains ADR 0026 | 1 |
| `INFRA_02` onboarding / `README` | How to get the Google OAuth values, and the `BETTER_AUTH_URL` change | 1 |
| `0070-google-sign-in-flow.md` | Route names | 1 |
| Brain `glossary.md` | Nothing new: Account, Sign in / Sign out, Display name are already there | — |

## Not doing

- Refusing personal Gmail accounts (`hd`): next change, still #70 (AC6, Q3).
- Keeping a registered person out of `/register/*`. Any signed-in person can still open those
  pages, because nothing records who has finished registering until Profiles (#71) and
  Workspaces (#62) are stored. Left for now (kritpavin, 2026-10-02).
- Profile storage (#71), account linking, and the CSRF or rate-limit hardening of `BE_22`.
- A global default-deny guard and the `@Actor()` boundary (`BE_21` R2, R6): with the first
  protected endpoint.
- Redirect-after-login (`FE_19`): no deep protected page exists yet.
- Renaming the `(public)` route group, although it now holds signed-in pages too (`FE_11` R2). It
  is noted for the first change that adds a second layout.
- Tightening `app.enableCors()` in `main.ts`: the browser no longer calls the API, but that is
  `BE_22`'s.

## Verification

### API (PR 1)

- **Unit:** the three use cases with a fake `IdentityPort`. They pass the credential through and
  return plain data.
- **Integration**, against compose Postgres, through the port (`BE_12` R5, R7). Sessions are made
  the way `auth.integration.spec.ts` already does, with `internalAdapter.createSession`, and the
  cookie is signed with `BETTER_AUTH_SECRET`.
  - Success:
    - `currentAccount` returns the Account for a valid session cookie.
    - `signOut` deletes the session row and returns a clearing cookie.
    - `startGoogleSignIn` returns a Google URL carrying `state` and `code_challenge`, plus a state
      cookie.
  - Refusals (`BE_21` R10): `currentAccount` returns `null` for each of these:
    - no cookie
    - a tampered signature
    - an expired session
    - a signed-out session
- **Config:** a missing `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` fails at boot.

### Web (PR 2)

- `set-cookie.util`: attributes are kept, and an encoded signed value comes out unchanged.
- `session.transform` and `session.service`, with the client mocked: an account maps to the view
  model, and `null` means signed out.
- `proxy.ts`: no cookie → `/login`, either cookie name → passes, `/login` is never redirected.
- `/` and `/login` redirects, the navbar (Sign out only when signed in), the pre-filled form, and
  *Not you?* signing out.

### Commands, on each PR

- `bun run lint`
- `bun run test`
- `turbo run check-types build check-arch`
- PR 1 only: `turbo run test:integration --filter=api`

### Manual, with a real Google key

After PR 2, following #70's *How to check* steps 1–4:

1. Signed out, *Continue with Google* lands on Introduce yourself with email and name filled.
2. Sign out returns to `/login`.
3. Signing in again lands on `/home`.
4. A refresh keeps the session.
5. Opening `/home` signed out goes to `/login`; `/` stays public.
6. Cancelling at Google returns to `/login` with the message.
