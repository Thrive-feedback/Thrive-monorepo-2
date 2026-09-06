---
title: "INFRA_10 · Docker images & local compose"
id: "INFRA_10"
area: "INFRA"
tier: "P1"
status: "draft"
updated: "2026-09-06"
requires: [INFRA_02]
see_also: [INFRA_11, INFRA_12]
---

[Conventions](../index.html) / Infrastructure / INFRA_10

# [Infra] Docker images & local compose

`P1` · `INFRA_10` · `draft` · `updated 2026-09-06`

**Open when:** you are changing a Dockerfile or the local service stack.

Multi-stage Dockerfiles for a Bun monorepo, compose for local backing services, image tagging and size budgets, dev/prod parity, and the non-root runtime rule.

## The rules

If you read nothing else:

1. <a id="R1"></a>One image per deployable. Never one image that can be several things.
2. <a id="R2"></a>Build in stages, and ship a runtime stage that carries no toolchain and no sources.
3. <a id="R3"></a>Copy manifests and the lockfile, install, then copy source — in that order.
4. <a id="R4"></a>Install from the lockfile in frozen mode, and prune to runtime dependencies for the final stage.
5. <a id="R5"></a>Run as a non-root user, on a read-only filesystem wherever the process allows it.
6. <a id="R6"></a>No secret in a build argument, an image layer, or the image at all.
7. <a id="R7"></a>Maintain an ignore file so the build context carries no dependencies, history, build output or environment files.
8. <a id="R8"></a>Tag every image with the commit it was built from. `latest` is never a deployment target.
9. <a id="R9"></a>Use compose for local backing services, at the versions the deployed environments run. Never to build the app.
10. <a id="R10"></a>Give the runtime image a size budget, and say why when a change exceeds it.

## Why

An image is the unit that actually runs, so everything vague about the build becomes concrete here: what is installed, what user it runs as, what it can write, and what it accidentally carries. The failure modes are all quiet. A toolchain left in the runtime stage triples the attack surface and nobody notices until a scanner reports it. A secret passed as a build argument sits in a layer forever, readable by anyone who pulls the image, even after the line that used it was deleted.

The layer order is the other reason this document is short and specific. Dependencies change rarely and source changes constantly, so installing before copying source means the expensive layer is reused on almost every build. Getting that backwards makes every build a full install — which is a slow pipeline, which is a pipeline people work around ([INFRA_09](../index.html#INFRA_09)).

Compose earns its place for one job: making a developer's backing services identical to the deployed ones ([INFRA_02#R4](../index.html#INFRA_02)). It is not a build system, and using it as one produces a second way to build the app that drifts from the real one.

## Rule detail

### [R1](#R1) and [R2](#R2) One image per deployable, built in stages

Each app in the repository that deploys gets its own image, containing only what that app needs. One image that runs the API or the worker depending on a flag ships both dependency trees everywhere and makes "what is running" a runtime question.

Stages separate the toolchain from the result. A build stage installs everything and produces the artifact; the runtime stage starts from a minimal base and copies in only the artifact and the runtime dependencies. Nothing else — no compiler, no test runner, no source, no development dependency. If the runtime stage can run the tests, it is carrying things it does not need.

**Enforcement:** review — a single-stage Dockerfile is visible in the diff; image scanning catches some of what it carries ([INFRA_15](../index.html#INFRA_15)).

### [R3](#R3) and [R4](#R4) Layer order, frozen installs, pruned runtime

The order is fixed by how often each input changes:

**Do**

```
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY packages/*/package.json packages/
RUN bun install --frozen-lockfile      # cached until a manifest changes

COPY . .                                # changes on every commit
RUN bun run build --filter=api
```

**Don't**

```
COPY . .                                # any source change...
RUN bun install                         # ...reinstalls everything, unpinned
```

In a monorepo the manifest copy is the fiddly part — every workspace's manifest must be present for the install to resolve the graph, without copying the sources that would defeat the cache. Hand-listing them is the version that rots: a new workspace is added, its manifest is not copied, and the image breaks in a way that only appears in a container build.

Use the task runner's own pruning instead. It computes the subset of the monorepo one app actually needs and emits it in two parts — the manifests plus lockfile, and the full sources — which is exactly the split the layer order wants:

```
FROM base AS pruner
COPY . .
RUN <task-runner> prune api --docker      # → out/json (manifests), out/full (sources)

FROM base AS deps
COPY --from=pruner /app/out/json/ .        # cached until a manifest changes
RUN <install> --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/ .
COPY --from=pruner /app/out/full/ .        # changes on every commit
RUN <build> --filter=api
```

The pruned subset is also smaller: an image for one app never sees the other app's sources, which is [R1](#R1) enforced by the build rather than by discipline.

Frozen installs matter here for the same reason they matter in the pipeline: an image that resolves its own versions is not the thing that was tested ([INFRA_04#R2](../index.html#INFRA_04)). The final stage carries runtime dependencies only.

**Enforcement:** review.

### [R5](#R5) and [R6](#R6) Least privilege, and nothing secret

The process runs as a non-root user created in the image, owning only what it must write. Root in a container is root in the kernel for a whole class of escapes, and almost no application server needs it. Where the process can run with a read-only filesystem and a writable temporary directory, it should.

Secrets never enter the image. Not as build arguments — those persist in layer metadata and survive the line that used them — not as copied files, and not baked into a configuration. Configuration arrives at run time from the platform ([INFRA_07#R4](../index.html#INFRA_07)). Where a build genuinely needs a credential, use the builder's secret mounting so it never lands in a layer.

**Enforcement:** partly automated — image scanning detects a root user and many embedded credentials, where it runs ([INFRA_15](../index.html#INFRA_15)); the build-argument path is review.

### [R7](#R7) The build context

An ignore file excludes installed dependencies, version-control history, build outputs, environment files, test artifacts and documentation. Without it, the context is the whole working tree: slow to send, and the mechanism by which a local environment file ends up in an image.

This is one of the few rules where the failure is silent and total — nothing warns you that `.env` was copied in, and `COPY . .` copies whatever is there.

**Enforcement:** review — the presence of the ignore file and its key entries are checkable ([INFRA_06](../index.html#INFRA_06)).

### [R8](#R8) Tags identify a commit

Every image is tagged with the commit it was built from, so a running container can be traced back to source. A moving tag may exist as a convenience pointer, but it is never what a deployment references: deploying "latest" means nobody can say what is running, and a rollback has nothing to roll back to ([INFRA_11](../index.html#INFRA_11)).

**Enforcement:** review.

### [R9](#R9) and [R10](#R10) Compose for services; a budget for size

Compose defines the backing services a developer needs — the database, the cache, the broker — pinned to the versions the deployed environments run ([INFRA_12](../index.html#INFRA_12)), with data in named volumes so a restart does not wipe local state. It is started by the setup path ([INFRA_02](../index.html#INFRA_02)).

Every service declares a health check, and anything that depends on it waits for healthy rather than for started. Without that, the setup path races: the database's port is open seconds before it accepts queries, so migrations fail on a fast machine and pass on a slow one, and the first thing a new developer sees is an error that disappears when they retry ([INFRA_02#R9](../index.html#INFRA_02)). A service whose image has no usable probe gets a small sidecar that can answer for it — that is a real cost, and it is smaller than an intermittent onboarding failure.

What it does not do is build the application. Running the app from source with the normal development task is faster and matches how everyone actually works; a compose file that also builds the app becomes a second build definition that drifts from the real one.

Finally, the runtime image has a stated size budget. Images grow silently — a dependency here, a copied directory there — and size is latency at every pull and every scale-up. A change that exceeds the budget is not forbidden; it needs a sentence saying what was added and why.

**Enforcement:** review — a size check against a stated budget is straightforward in the pipeline and is a candidate guardrail ([INFRA_06](../index.html#INFRA_06)).

## Worked example

Containerizing the API app.

The Dockerfile has three stages. A base stage pins the runtime version — the same one the repository declares, so the image and a developer's machine agree ([INFRA_02](../index.html#INFRA_02)). A build stage copies every workspace manifest and the lockfile, installs frozen, then copies the sources and builds only the API's task graph ([R3](#R3), [R4](#R4)). A runtime stage starts from the minimal base, creates a non-root user, and copies in the build output plus runtime dependencies ([R2](#R2), [R5](#R5)).

The ignore file keeps installed dependencies, git history, build outputs and environment files out of the context ([R7](#R7)). The image contains no configuration: the database URL and every secret arrive at run time from the platform ([R6](#R6), [INFRA_07](../index.html#INFRA_07)).

It is tagged with the commit hash by the pipeline ([R8](#R8), [INFRA_09](../index.html#INFRA_09)), and a size check compares it against the stated budget.

Locally, compose runs only the database and the cache, pinned to the deployed versions, with named volumes and health checks so migrations do not race the database's first ready moment ([R9](#R9)). The API itself runs from source in watch mode — nobody rebuilds an image to see a change.

Then the size budget is exceeded. The cause is that the build stage's pruning missed a workspace, so development dependencies came along. The fix is in the build, not the budget ([R10](#R10)) — and the budget is what made a silent regression visible, which is the only reason to have one.

## Checklist

- One image per deployable ([R1](#R1)), built in stages with no toolchain in the runtime ([R2](#R2)).
- The build prunes to the app's subset; manifests precede source; the install is frozen and pruned ([R3](#R3), [R4](#R4)).
- The process runs as a non-root user ([R5](#R5)).
- No secret in a build argument, a layer, or the image ([R6](#R6)).
- The ignore file excludes dependencies, history, build output and environment files ([R7](#R7)).
- The image is tagged with its commit; no deployment references a moving tag ([R8](#R8)).
- Compose defines services only, at deployed versions, each with a health check ([R9](#R9)).
- The image stays within its size budget, or the change says why not ([R10](#R10)).

## Open questions

- The size budget in [R10](#R10) has no number, because a meaningful one depends on the base image and the framework. It should be set from the first real image and then held.
- Nothing here covers the health and readiness endpoints an orchestrator needs, or how a container should behave on a termination signal. Both belong with [INFRA_11](../index.html#INFRA_11) and are needed before the first deployment, not after.
- Whether images are built once and promoted across environments, or rebuilt per environment, is an [INFRA_11](../index.html#INFRA_11) decision that changes what [R8](#R8) means in practice.

## Related

Requires [INFRA_02](../index.html#INFRA_02). See also [INFRA_11](../index.html#INFRA_11), [INFRA_12](../index.html#INFRA_12).

---

[← All conventions](../index.html)
