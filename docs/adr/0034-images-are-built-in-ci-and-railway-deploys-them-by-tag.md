# 0034 — Images are built in CI and Railway deploys them by tag

- **Status:** accepted
- **Date:** 2026-10-10
- **Deciders:** naroebordin.w
- **Supersedes:** ADR 0033, decision 5 and its two `INFRA_10` departures only. Everything
  else in 0033 — Railway, the two services, no public domain for the API, Supabase through
  the session pooler, one environment, how a deploy is started, the migration gate — stands.

## Context

ADR 0033 had the workflow upload the repository with `railway up` and let Railway build it.
Two deploys were attempted on 2026-10-10 and both failed in the same place: Railway never
found `apps/api/railway.json`, fell back to its own builder, auto-detected a Bun workspace,
found no start command at the repository root, and refused.

```
↳ Found workspace with 8 packages
✖ No start command detected
Deploy failed: Railpack failed to prepare the build.
```

Railway reads `railway.json` from the root of what it is given. The per-service "config as
code" path was set and did not change the outcome for an uploaded archive. The remaining
fixes were all the same shape: move the build's configuration — builder, Dockerfile path,
health check path, restart policy — out of this repository and into service settings in a
dashboard. ADR 0033 rejected exactly that shape for the migration gate, on the grounds that
the decision would then live outside review.

The migration gate itself passed in both runs: Supabase is reachable through the session
pooler and the schema applied. Only the build was ever wrong.

## Decision

1. **CI builds the images and pushes them to GHCR**, one per deployable, each tagged
   `sha-<commit>` and nothing else. `latest` is never a deployment target (`INFRA_10` R8).
2. **Railway builds nothing.** Each service's source is an image, and a deploy is
   `railway service source connect --image …:sha-<commit>`, which starts the deployment.
3. **The commit is resolved once**, in the first job, and every later job uses it. On a
   `pull_request` event `github.sha` is the event's own merge commit, which is not what
   `main` points at after a rebase merge (ADR 0018), so building and deploying from it
   would ship a commit that does not exist on `main`.
4. **A deployment is waited for**, by `scripts/await-railway-deployment.sh`. Pointing a
   service at a tag returns as soon as Railway accepts it, long before a container runs, so
   without this a crash loop would read as a green deploy.
5. **`apps/*/railway.json` and `.railwayignore` are deleted.** Railway no longer builds, so
   they configured nothing and would mislead the next reader.

## Why not the alternatives

- **Set the builder, Dockerfile path and health check in Railway's dashboard.** Two
  minutes of clicking, and the first deploy would have worked. Rejected: four settings per
  service that no pull request can review, no history explains, and nothing restores if a
  service is recreated — the objection 0033 already made about the migration gate.
- **A moving tag such as `:production`, repointed each deploy.** Avoids changing the
  service's source. Rejected: deploying a tag that moves is `latest` wearing another name,
  and it takes the commit out of what is deployed, which is the whole gain here.

## Consequences

- **The `INFRA_10` R8 departure in 0033 is closed.** Every image carries the commit it was
  built from, in the tag, in the registry.
- **Rollback stops being a dashboard step.** Every image ever deployed is still in GHCR
  under its own commit, so rolling back is this workflow run from an older commit, or the
  same `source connect` with an older tag. The schema still never rolls back.
- **The GHCR packages must be readable by Railway.** The simplest answer for a repository
  that is already public is to make the two packages public; the alternative is registry
  credentials held in Railway. Nothing secret is baked into either image — the only build
  argument is `API_BASE_URL`, a private hostname (`INFRA_07` R5).
- **Health checks are no longer declared in this repository.** `railway.json` carried them
  and it is gone, so until the service settings carry a health check path, "the deployment
  succeeded" means the container started, not that it answers. The smoke test on the public
  address is what still proves the web app works end to end.
- **Builds moved onto GitHub's runners**, with a build cache per app. A deploy now costs two
  image builds in CI rather than two in Railway.
- **The `INFRA_10` R2/R4 departure stands unchanged** — roughly 150 MB of tooling still
  survives into the API image, for the reasons 0033 gives.

## What would reverse this

Railway gaining a way to pick a Dockerfile from the uploaded context that is declared in
this repository; or GHCR's pull limits or availability making the registry hop the thing
that breaks deploys.
