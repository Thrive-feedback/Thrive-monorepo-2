# syntax=docker/dockerfile:1.7
#
# The API's image. It builds only the API: the web app has its own Dockerfile, so a change
# to one never rebuilds or redeploys the other.
#
# Built from the repository root, because a workspace cannot be installed without the root
# manifest and the lockfile:
#
#   docker build -f apps/api/Dockerfile -t thrive-api .
#
# Size budget: 500 MB. It is high for what this serves, and the reason is in the
# runtime-deps stage: no Bun install layout both resolves completely and drops development
# dependencies, so roughly 150 MB of tooling survives that nothing imports. A change that
# pushes past 500 MB needs a reason stated in the pull request.

FROM oven/bun:1.3.14-alpine AS base

# Reduce the repository to the API's own subset — its workspace, the packages it depends
# on, and a lockfile pruned to match. A change anywhere else no longer invalidates the
# dependency layer below.
FROM base AS pruner
WORKDIR /repo
COPY . .
RUN bunx turbo@2.10.9 prune api --docker

# Manifests and the lockfile alone, so dependencies reinstall only when they change and
# not on every edit to a source file.
FROM base AS deps
WORKDIR /repo
COPY --from=pruner /repo/out/json/ ./
RUN bun install --frozen-lockfile

FROM deps AS builder
WORKDIR /repo
COPY --from=pruner /repo/out/full/ ./
# The Prisma client is generated output and is not in git, so the image generates its own
# against the schema it was built from — the two can never drift.
RUN bun run --cwd apps/api db:generate \
    && bun run --cwd apps/api build

# A second install for the runtime stage, hoisted into one flat tree.
#
# Neither of Bun's layouts gives a clean production tree on its own. The isolated default
# prunes correctly — only what production resolves is linked into the workspace — but it
# keeps every package in the lockfile in a store under `node_modules/.bun`, and the links
# point into it, so the runtime image would have to carry the store or carry nothing.
# Hoisting resolves completely but stops honouring `--production`, dragging the compiler
# and the migration tool along with it.
#
# Stripping `devDependencies` from the manifests first would fix that, and is what the
# lockfile forbids: it is the only source of versions here, and a deploy must never
# resolve one CI has not seen.
#
# So the tree is hoisted and then the toolchain is deleted by name. Nothing the
# application imports lives in these; the boot check in the plan is what proves it.
FROM base AS runtime-deps
WORKDIR /repo
COPY --from=pruner /repo/out/json/ ./
RUN bun install --frozen-lockfile --production --linker hoisted \
    && rm -rf \
        node_modules/typescript \
        node_modules/prisma \
        node_modules/@types \
        node_modules/@prisma/dev \
        node_modules/@prisma/studio-core \
        node_modules/@electric-sql \
        node_modules/.bin/tsc \
        node_modules/.bin/tsserver \
        node_modules/.bin/prisma

FROM base AS runner
WORKDIR /repo

# An unprivileged user, created here rather than reused from the base image, so the name
# is ours and the uid is stable across base-image updates.
RUN addgroup --system --gid 1001 thrive \
    && adduser --system --uid 1001 --ingroup thrive thrive

COPY --from=runtime-deps --chown=thrive:thrive /repo/node_modules ./node_modules
COPY --from=builder --chown=thrive:thrive /repo/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=thrive:thrive /repo/apps/api/package.json ./apps/api/package.json

# The compiler leaves `@app/*` in the emitted JavaScript, and the runtime resolves it from
# a tsconfig. On a developer's machine that mapping points at `src`, so running the build
# quietly loads TypeScript sources; this image has no sources, so the same alias has to
# point at the emitted output instead.
#
# The alias itself is declared in apps/api/tsconfig.json — change it there and here.
RUN printf '%s\n' \
    '{' \
    '  "compilerOptions": {' \
    '    "baseUrl": ".",' \
    '    "paths": { "@app/*": ["dist/*"] }' \
    '  }' \
    '}' > ./apps/api/tsconfig.json \
    && chown thrive:thrive ./apps/api/tsconfig.json

USER thrive

# Documentation for a reader; the platform maps whatever PORT it injects, and the
# application refuses to start if its configuration is missing or invalid.
EXPOSE 3000
ENV NODE_ENV=production

CMD ["bun", "apps/api/dist/main"]
