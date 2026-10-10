# 0033 — The API and the web app run on Railway, deployed by GitHub Actions

- **Status:** accepted
- **Date:** 2026-10-10
- **Deciders:** naroebordin.w
- **Supersedes:** nothing. Settles `PROJECT.md` §5 decision 3.

## Context

`PROJECT.md` §5 decision 3 has been open since 2026-09-27: where the API runs and how it
gets there. Railway was an assumption inherited from the retired repository, never chosen.
`INFRA_11` is `todo`, no workflow deployed anything, and no Dockerfile existed.

Meanwhile the product became deployable: real Google sign-in (0026, 0027), a saved Profile,
and a Workspace (0030, 0032). There is nowhere to put it.

## Decision

1. **Both apps run on Railway**, as two services in one project (`thrive-prod`): `thrive-api`
   and `thrive-web`. One platform, one bill, and a private network between them.
2. **The API has no public domain.** The browser reaches only the web origin (0027), and
   Google's callback arrives through the web app's rewrite, so the API is reachable only at
   `thrive-api.railway.internal` from inside the project. The OpenAPI document and the
   Scalar reference are not on the public internet as a result.
3. **The database stays Supabase** (0020), Postgres 17.11 in `ap-southeast-1`, reached
   through the session pooler. The direct connection host publishes only an AAAA record and
   the transaction pooler breaks the `@prisma/adapter-pg` connection pool; the session
   pooler is the one that works from Railway.
4. **One environment: production.** No staging, no per-pull-request environment.
5. **GitHub Actions deploys, Railway's GitHub integration does not.** `.github/workflows/deploy.yml`
   does the work: migrate, deploy the API, deploy the web app, smoke-test. Railway's own
   repository connection is disconnected deliberately.
6. **A merge does not deploy by itself.** Merging and releasing are separate decisions, so
   there are two ways to start one: by hand from Actions, or on merge when the pull request
   carries the **`deploy`** label. The label is opt-in per change — its absence is the
   default, and the deploy then waits for someone to press the button. Either way the
   workflow runs on `main` only and refuses every other branch, and either way it deploys
   `main` as it stands when the job starts, which can carry someone else's merge along.
7. **Migrations run before either service deploys**, from the workflow, through
   `railway run` so the connection string stays in Railway's store and never becomes a
   repository secret. **Migrations are forward-only**: a rollback returns the code and never
   the schema, so every migration must be readable by the code already running — expand in
   one release, contract in a later one.

## Why not the alternatives

- **Vercel for the web app.** Native Next.js hosting, free preview deploys. Rejected: it
  splits the stack across two platforms and two secret stores, and the web-to-API hop would
  leave the private network for the public internet, which would in turn force the API to
  have a public domain — undoing decision 2.
- **Railway's own Postgres.** One platform, private networking to the database. Rejected to
  honour 0020, whose Singapore region is the one closest to the people Thrive is sold to.
- **Railway's GitHub integration deploying on push.** Zero workflow code. Rejected: the
  migration gate would become a dashboard setting, so the step that decides whether the
  schema is ready would live outside review and outside this repository.
- **Staging as well as production.** Rehearses the migration gate. Rejected for now at zero
  users, where the cost is a second set of infrastructure, secrets and Google OAuth clients
  for a product nobody is using yet.

## Consequences

- `apps/api/Dockerfile`, `apps/web/Dockerfile`, `.dockerignore`, `.railwayignore`,
  `apps/*/railway.json` and `.github/workflows/deploy.yml` are added.
- `apps/web` builds with `output: 'standalone'`, traced from the repository root.
- The web image is bound at build time to one `API_BASE_URL`, because the callback rewrite
  is written into the build.
- No new environment variable. Production differs from local only in values (`INFRA_07` R6).
- **A departure from `INFRA_10` R8**: `railway up` builds the image inside Railway, so it
  carries no tag naming the commit it was built from — Railway's deployment metadata carries
  that instead. Building in CI and pushing to a registry would honour R8 and give tag-level
  rollback; it is not worth the registry plumbing at one environment.
- **A departure from `INFRA_10` R2 and R4**: about 150 MB of development tooling survives
  into the API's runtime image. Bun's isolated layout prunes development dependencies but
  keeps every package in a store the links point into; the hoisted layout resolves completely
  but ignores `--production` and `--omit=dev`. Stripping `devDependencies` from the manifests
  is what the frozen lockfile forbids. The image deletes the largest offenders by name and
  accepts the rest.
- **The `deploy` label has to exist in the repository.** A label that is not there cannot be
  added to a pull request, and the opt-in would then look like a deploy that silently never
  happens.
- **Rollback is a human step.** The Railway CLI can redeploy a service but cannot name a
  previous deployment, so the choice is made in the dashboard. The workflow prints the
  instructions when it fails.
- **No version or changelog yet**, which `INFRA_11` asks for. At one environment the commit
  on the deployment is the version.
- **Google's consent screen stays in testing** while the web app is on a
  `*.up.railway.app` address, because the authorised domain cannot be verified. Sign-in is
  therefore limited to listed test accounts, which does not match `ADR-0028` in the brain
  ("any Google account can sign in this iteration"). The code matches the brain; the
  platform is what limits it. Registering a domain removes the limit.

## What would reverse this

Railway's pricing or reliability at real traffic; a need for preview environments that
Railway makes awkward; or the API needing a public domain after all, which would make the
Vercel split cost nothing.
