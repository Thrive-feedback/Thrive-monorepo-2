# 0088 — The UI showcase is open only to an allow-list of emails

Status:   accepted
Date:     2026-11-14
Deciders: kritpavin

## Context

`/ui-showcase` and every page under it are public: anybody with the address sees every component,
card and token, unreleased ones included. Only `noindex` keeps search engines away. It should be
open to the team and nobody else.

Thrive already signs people in with Google (ADR 0026), and an Account's email is fixed when it is
made, so who someone is is a solved problem. What is missing is a list of who may look, and a check
that cannot be skipped.

Next 16's own guidance (`authentication.md`, "Layouts and auth checks") rules out the obvious place
for that check: a layout shared between routes does not render again on client navigation, and it
does not keep a page's segment out of the RSC payload. Proxy is for optimistic checks, not fetching.

## Decision

- **The list is a variable of `thrive-api`**: `UI_SHOWCASE_ALLOWED_EMAILS`, comma-separated
  addresses, lower-cased at boot into `UiShowcaseConfig.allowedEmails`. **Left out or empty, nobody
  may open the showcase**, locally too. An address that does not parse refuses the boot.
- **`GET /v1/ui-showcase-access/mine`** answers `{ "isAllowed": boolean }` for the signed-in
  caller. It is not `@Public()`: signed out is `401 NOT_SIGNED_IN` from the global guard. It never
  returns the list, and nothing logs an address.
- **The web checks in every page, and in the metadata of a page that names what it shows.** Each
  `page.tsx` under `app/ui-showcase/` calls `requireUiShowcaseAccess()` first: no session goes to
  sign in; not allowed, or an API that cannot say, is not found. A test fails when a page there does
  not call it first.
- **The proxy matches `/ui-showcase` and `/ui-showcase/:path*`**, so a visitor with no session
  cookie goes straight to sign in carrying `next`, as every signed-in route does. A cookie that has
  lapsed reaches the page, which sends its owner to sign in without `next`, as every page here does.
- **`ui-showcase-access` is a module, not a bounded context.** It owns no data and no domain term;
  it is a module because a route needs a use case (`BE_07` R3).

### Departures from the conventions, named

- `INFRA_07` R9 (a missing variable stops the boot) — left out is an empty list. `BE_10` R5 holds:
  the fallback closes the showcase, it does not open it.
- `GEN_08` R8 (contract before consumer, never together) — one pull request, for the reasons ADR
  0087 gives: only the web server calls the route, the route is new, `deploy.yml` deploys the API
  first, and an API rolled back alone fails closed.

## Consequences

- Every showcase page now renders per request instead of being prerendered, since it reads the
  session. It is an internal page; the cost is a session read and one API call per visit, made
  together.
- Adding someone is editing the variable and applying it on Railway, which redeploys the API. **Set
  it before the first deploy of this change**, or the team is locked out until someone does.
- **A typo takes the API down**: one address that does not parse refuses the boot, with the same
  trade as ADR 0087.
- **Rolling `thrive-web` back alone to an image from before this change reopens the showcase** to
  anybody, since that image does not check.
- A teammate who has not put their own address in their local `apps/api/.env` sees not found.
- The showcase renders only sample data; this protects unreleased design, not personal data.
  Component names still ship in the client bundle to everyone.

## Alternatives rejected

- **The list as a variable of `thrive-web`.** No contract change. Rejected: flags and who may see
  what already live on the API (ADR 0087), and the web would hold a list of addresses it has no
  other use for.
- **The check in the showcase layout.** One line. Rejected for the reason Next gives above.
- **The whole check in the proxy.** One place that sees every request. Rejected: an API call before
  every showcase request in code Next says is not for fetching, and a break from the pattern every
  other signed-in page here follows.
- **Allowing an email domain.** Rejected for now: anyone handed an address there would be in.
- **A 403 page.** Rejected: not found says nothing about what is behind the address.

## Links

- ADR 0026 (Google sign-in through Better Auth)
- ADR 0087 (feature flags, the same shape)
- `apps/web/node_modules/next/dist/docs/01-app/02-guides/authentication.md` ("Layouts and auth checks")
