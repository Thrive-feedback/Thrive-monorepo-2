# 0045 — The founder is the plugin's `admin`, and Owner is gone

Status:   accepted
Date:     2026-10-16
Deciders: kritpavin

## Context

The brain's `ADR-0033` retires Owner. Thrive now has two Roles, Admin and Member, and whoever creates
a Workspace becomes its first Admin. Every Admin has the same powers, and a Workspace always keeps
at least one Admin. #189 removes Owner from the product.

ADR 0032 has Better Auth's organization plugin store Members, with the founder stored under the
plugin's creator Role, `owner`. This record replaces that one bullet. The rest of 0032 stands.

## Decision

**The plugin's creator Role is `admin`. Every stored `owner` becomes `admin`, and `MemberRole` knows
only `ADMIN` and `MEMBER`.**

- `creatorRole: 'admin'` in `apps/api/src/infrastructure/auth/auth.ts`.
- The plugin gives its creator Role extra standing: only a holder may grant that Role, and its last
  holder may not give it up. This is exactly what an Admin is, so it does not need a Role of its own.
- The migration `members_owner_becomes_admin` turns every stored `owner` into `admin`. It is the
  empty migration Prisma creates, plus that one `UPDATE`.
- The contract's `role` is `ADMIN | MEMBER`, and no message, test or screen says Owner.

## Consequences

- Founders from before this change become Admins in every environment once the migration runs.
- Removing `OWNER` from the contract narrows it (`GEN_08` R7). The web app is its only consumer, and
  it changes in the same pull request. Before 1.0 there is no other client to break.
- The deploy migrates before it starts the new API (`.github/workflows/deploy.yml`). The code
  already running reads a migrated `admin` correctly, because `ADMIN` already existed, and so does
  a rolled-back API. The new code would fail on an `owner` row, but none is left by the time it
  starts.

## Alternatives rejected

- **Keep `owner` as a hidden creator Role.** Brain `ADR-0033` rejects any Role nobody sees. The plugin
  would also refuse an Admin who tried to change the founder's Role.
- **Map `owner` to `ADMIN` when reading, and leave the data alone.** No migration would be needed,
  but #189 requires that no Owner remains in the data. Every reader would also need to know the
  alias.
