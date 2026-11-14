# 0087 — A feature flag is an API read of a deployment variable

Status:   accepted
Date:     2026-11-14
Deciders: kritpavin

## Context

Your dashboard is merged and reachable at `/dashboard`, but production should not show it yet, and
whether it does should change without a code change. Thrive is pre-launch with one environment
(`PROJECT.md`), so nothing calls for per-Workspace or per-person rollout. `INFRA_16` is still `todo`;
its summary binds us to a flag lifecycle that ends in removal.

The web could read a variable of its own, but the next flag will be wanted by more than one page,
and possibly by a client other than this web app. The API is where the contract lives (`GEN_08`).

## Decision

**`GET /v1/feature-flags`** answers every flag a deployment has set, as one object:

```json
{ "USER_DASHBOARD_FLAG": "true" }
```

- **The value is a variable of `thrive-api`.** `USER_DASHBOARD_FLAG` is parsed at boot into
  `FeatureFlagsConfig.showsDashboard`, a boolean. Changing it is applying the staged variable on
  Railway, which redeploys the API without a rebuild.
- **Left out, it is off.** A forgotten flag hides an unfinished page rather than showing one.
  Anything but exactly `true` or `false` refuses the boot.
- **The wire carries the variable's name and its string value**, as the owner asked. The schema is
  `z.enum(['true', 'false'])`, so the generated client types it as that union. Inside the API it is
  a boolean.
- **The route is `@Public()`.** It says the same thing to everybody, and a page outside sign-in may
  need it.
- **The web reads it on the server, uncached** (`no-store`), and treats a failed read as off.
  When it is off the menu has no link to the dashboard, and `/dashboard` answers a real 404: the
  check sits in the dashboard's own layout and its metadata, above the boundary `loading.tsx` draws,
  so nothing of the page streams first.
- **`feature-flags` is a module, not a bounded context.** It owns no data and no domain term, so it
  is not in brain `domain-map.md`; it is a module because a route needs a use case (`BE_07` R3).

### Departures from the conventions, named

- `GEN_07` R2 (`camelCase` values) and `INFRA_07` R7 (a variable is prefixed by its concern) — the
  key `USER_DASHBOARD_FLAG` on the wire and in the environment, the owner's choice.
- Brain glossary rule 5 (`User` is banned in code) — that key only. Every name inside the code says
  `showsDashboard`.
- `BE_10` R10 (configuration does not travel) — only a curated capability is returned, never the
  config object, a hostname or an identifier. `FeatureFlagsConfig` holds nothing else, so the class
  is the curation.
- `INFRA_07` R9 (a missing variable stops the boot) — left out is off, as above. `BE_10` R5 holds:
  the fallback hides, it does not weaken.
- `GEN_08` R8 (contract before consumer, never together) — the route and its reader ship in one
  pull request. The harm R8 guards against is a browser loaded during the deploy; here only the web
  server calls the route, the route is new (`GEN_08` R7), and `deploy.yml` deploys the API and waits
  for it before deploying the web. An API rolled back alone fails closed: the web reads a 404 as off.

## Consequences

- A flag changes on an API redeploy, so turning it takes about a minute. The dashboard follows on
  its next request; a menu already on screen keeps the old answer until the next full page load,
  because the sidebar's layout is not rendered again on client navigation.
- **A typo takes the API down.** `True`, `1` or an empty value refuses the boot — sign-in, Feedback
  and Kudos with it — on a variable meant to be flipped by hand on Railway, where no CI runs. Every
  later deploy fails at "Deploy the API" until the value is fixed. This is the opposite trade to ADR
  0085, which kept one optional feature from refusing the whole API's boot; here a value that is
  neither answer is treated as a mistake worth stopping for.
- The route lists flags by their variable names, so renaming a variable is a breaking contract
  change (`GEN_08` R7).
- Two code paths exist for every flagged page. Both are tested, and both go when the flag does.
- **Removal is two deploys:** once the dashboard is on in production for good, the web stops reading
  the flag; then the API drops the key, and the variable leaves every environment and
  `.env.example` (`INFRA_07` R10). The other order hides a launched dashboard while the old web
  reads a missing key as off. The route stays while any flag does.

## Alternatives rejected

- **A variable read by `thrive-web` alone.** Fewer moving parts today. Rejected: every later flag
  would need its own web variable, and nothing but this web app could read one.
- **A hosted flag service (GrowthBook, PostHog, Flagsmith).** Per-person rollout and a dashboard.
  Rejected for now: a new dependency and vendor for one global switch, before there is anybody to
  roll out to. Revisit with `INFRA_16`.
- **`{ "showsDashboard": true }`.** Matches the conventions. Not chosen: the owner named the shape
  the wire carries.
- **Any other value reads as off.** No outage on a typo. Not chosen: a flag meant to be on that
  silently reads as off is a launch that quietly did not happen.

## Links

- ADR 0085 (the opposite trade: an absent provider does not refuse the boot)
- ADR 0088 (the UI showcase allow-list, which follows the same shape)
- `INFRA_16` (`todo`: flag lifecycle and removal)
