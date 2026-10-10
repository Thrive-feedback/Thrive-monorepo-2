# 0032 — Reads render on the server, and writes are server actions

Status:   accepted
Date:     2026-10-08
Deciders: kritpavin

## Context

Task #138 asks for one rule that tells a developer adding a screen where each API call is made,
how the session cookie and the correlation id reach the API on that path, and how an API error
reaches the screen. Before now the answer was spread across three documents. `FE_09` R1 and R4 put
reads on the server and writes in server actions. `FE_10` R8 described a "browser's client" that
nothing builds. `FE_09` R9 allowed a client query library without saying how it would reach the API.

Three things are fixed already:

- **ADR 0027:** the browser only ever talks to the web origin. The session cookie is first-party
  there, and the web server forwards it to the API.
- **ADR 0029:** every API route requires that cookie unless it is `@Public()`.
- **`FE_10` R1:** the generated client is the only way the web app talks to the API.

Every call in the web app today follows the split below:

- `GET /v1/sessions/current` and `GET /v1/members/mine` are read in server components, through
  `lib/session/session.service.ts`.
- `signIn`, `refreshSession`, `signOut`, `saveProfile` and `createWorkspace` are server actions.

That is a habit, not a rule. The first screen that lists the feedback requested of a person, or
asks a teammate for feedback, would have to choose again.

## Decision

**The HTTP method decides where a call is made.**

- **`GET`: a read, on the server.** A server component reads during render, in the component that
  shows the data. A server action never fetches data for a screen to display. A read that
  authorizes or validates the action's own write, such as checking the session, is part of that
  write and is allowed.
- **`POST`, `PUT`, `PATCH`, `DELETE`: a write, invoked from the browser.** The browser invokes a
  server action, and the action calls the API. Usually a person triggers it by submitting a form or
  pressing a button. An effect may trigger it only when the browser itself must receive the result,
  as with the session refresh's renewed cookie (ADR 0027). A write is never made during render.
- **The browser never sends a request to the API**, directly or through a route handler that
  forwards to it.

The method wins over how sensitive the data is. A write that carries sensitive content, such as the
text of a piece of feedback, is still a server action. That is safe because the action, not the
browser, calls the API. What the browser must not receive is the API's response, so an action
returns only the view model the screen needs.

| The screen needs to… | Call it from | The cookie and the correlation id | An API error reaches the screen as |
| --- | --- | --- | --- |
| read data | the server component that renders it | `headers()` forwards the browser's cookie; the client adds the id | a redirect, `notFound()` or the error boundary, chosen by catalogue code |
| save a form, or run a command | a server action, invoked by a form, a handler, or (for a result only the browser can receive) an effect | the action forwards the cookie; the client adds the id; a returned `Set-Cookie` is copied back (ADR 0027) | the action's returned state, mapped from the catalogue code to copy |
| change without a navigation (live) | not allowed yet | — | — |

The form that triggers a write may be a server component (`<form action={signOut}>`) or a client
component (`useActionState`). Which one it is follows `FE_08`, not this ADR.

## Alternatives

- **The browser calls the API directly.** This needs CORS with credentials, and a cookie that
  belongs to a parent domain the web and the API share. ADR 0027 rejected it for the same reasons.
  It would also tie the web app to the hosting decision, which is still open. Rejected.
- **The browser calls a Next.js route handler that forwards to the API.** This is the path a client
  query library would use. But a route handler gets no CSRF check of its own, so every handler has
  to check the `Origin` header by hand. It is also a second way to reach the API, and no screen
  needs it yet. Rejected for now. The first live-updating screen writes the ADR that opens it.
- **Decide by sensitivity first.** Any call carrying sensitive data would stay on the server, and
  only other writes would go through the browser. Every write already reaches the API from the
  server, so sensitivity only governs what an action returns. The split by method is simpler to
  check. Rejected.

## Consequences

- No credential, token or API base URL is in the browser bundle. `lib/api-client.service.ts`
  imports `server-only` (listed in `PROJECT.md` §4), so a client component that imports the API
  client fails the build. That is the automated half of the enforcement.
- Every write gets the framework's own CSRF check: Next.js compares a server action's `Origin` with
  its host.
- The web app's architecture check (`apps/web/scripts/check-architecture.mjs`, run by the required
  *Architecture* job) reads each module's directive. It fails a pull request when:
  - a client module calls `fetch`, or imports a value from `@repo/api`
  - a server action calls `.GET(`
  - anything other than an action calls `.POST(`, `.PUT(`, `.PATCH(` or `.DELETE(`

  What it cannot see stays with review: a read for display, or a write during render, that goes
  through a helper instead of calling the client directly.
- A screen that has to change without a navigation (polling, live updates, infinite lists) cannot
  be built until a later ADR opens a browser path. This is deliberate.
- An action's return value crosses to the browser. An action that returns the raw API response
  leaks every field in it.

Supersedes: —
Referenced by: `FE_09`, `FE_08`, `FE_10`
