# 0035 — The deploy holds a workspace-scoped Railway token

- **Status:** accepted
- **Date:** 2026-10-10
- **Deciders:** naroebordin.w
- **Amends:** ADR 0034. Its decision stands; this records what making it work actually costs.

## Context

The first run of the workflow ADR 0034 describes built and pushed both images and passed
the migration gate, then failed on the step that points a service at its new tag:

```
Unauthorized. Please check that your RAILWAY_TOKEN is valid and has access to the resource
```

`railway run --service thrive-api` had succeeded two steps earlier with the same token, so
the credential was valid and did reach the project. A Railway **project token** deploys and
reads variables; changing a service's source is a management operation, and a project token
is not allowed to make one. ADR 0034 assumed the narrow token would suffice and did not
check.

## Decision

The repository's secret is a **workspace-scoped** token, held as **`RAILWAY_API_TOKEN`**,
and every Railway command in the workflow names `--project` and `--environment` explicitly,
because such a token belongs to no project in particular. The project id is written in the
workflow: it identifies, it does not authorise.

The variable's name is load-bearing. The CLI reads project tokens from `RAILWAY_TOKEN` and
account- or workspace-scoped tokens from `RAILWAY_API_TOKEN`, so putting the right token
under the wrong name authenticates as nothing at all.

Workspace rather than account: Railway offers four scopes — account (every workspace you can
reach), workspace, project (one environment), and OAuth. A workspace token is the narrowest
one that may change a service's source, and unlike an account token it is not tied to one
person's identity.

## Why not the alternative

**A tag that moves — `:production` — repointed and redeployed each time.** A project token
can redeploy, so the narrow credential would have been enough, and the service's source
would be set once by hand and never again.

Rejected because what deploys would stop being identified by its commit. The immutable
`sha-<commit>` tags would still exist in the registry, but the thing Railway actually runs
would be whatever a moving label pointed at when it last pulled — which is the property
ADR 0034 was written to get, and the only reason that ADR exists.

## Consequences

- **The secret can act on every project in the workspace**, not only `thrive-prod`. That is
  strictly more privilege than the project token it replaces, held by a workflow any merge to
  `main` can reach. It is acceptable today because the workspace holds one project.
- **It stops being acceptable** the moment the workspace holds a project this repository has
  no business touching. At that point either the workspace splits, or the deploy moves back
  to a project token and gives up commit-identified deploys.
- A leaked token is worse than it was. Rotating it is the workspace's token settings, then
  the repository secret; nothing in this repository holds a copy.
- Anyone reproducing the deploy locally needs their own token and the two flags;
  `railway link` is the alternative for interactive use.

## What would reverse this

Railway scoping project tokens to allow a service's source to change; or a second project in
the workspace that makes the blast radius of this secret unacceptable.
