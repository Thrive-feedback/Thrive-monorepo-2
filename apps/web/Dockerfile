# syntax=docker/dockerfile:1.7
#
# The web app's image. Next.js is not supported on Bun in production, so the runtime here
# is Node while Bun stays the package manager — the same split the repository runs locally.
#
# Built from the repository root:
#
#   docker build -f apps/web/Dockerfile --build-arg API_BASE_URL=http://localhost:3000 -t thrive-web .
#
# Size budget: 360 MB. Most of it is the Node base image; the application's own traced
# server and static assets are about 65 MB. A change past 360 MB needs a reason stated in
# the pull request.

FROM node:26.9.0-alpine AS base
# Bun installs; Node runs. Pinned to the version the repository declares, so a build here
# resolves exactly what a laptop resolves.
RUN npm install --global bun@1.3.14

# The web app's subset of the repository, with a lockfile pruned to match.
FROM base AS pruner
WORKDIR /repo
COPY . .
RUN bunx turbo@2.10.9 prune web --docker

FROM base AS deps
WORKDIR /repo
COPY --from=pruner /repo/out/json/ ./
RUN bun install --frozen-lockfile

FROM deps AS builder
WORKDIR /repo
COPY --from=pruner /repo/out/full/ ./

# Where this build's web server will reach the API. It is written into the callback
# rewrite at build time, so an image is bound to one environment's API address. Not a
# secret: it names a private host that no browser can resolve.
ARG API_BASE_URL
ENV API_BASE_URL=${API_BASE_URL}

ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run --cwd apps/web build

# Not `base`: that stage carries Bun so it can install, and a package manager has no place
# in a runtime image. Node alone runs the standalone server.
FROM node:26.9.0-alpine AS runner
WORKDIR /repo

RUN addgroup --system --gid 1001 thrive \
    && adduser --system --uid 1001 --ingroup thrive thrive

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Standalone output carries its own traced dependencies, so no install runs in this stage
# and no package manager survives into it. Static assets and public files sit outside that
# bundle and are copied beside it, at the paths the server expects.
COPY --from=builder --chown=thrive:thrive /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=thrive:thrive /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=thrive:thrive /repo/apps/web/public ./apps/web/public

USER thrive

EXPOSE 3001
# The standalone server reads PORT and HOSTNAME. Binding to every interface is what lets
# the platform's router reach the container at all.
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/web/server.js"]
