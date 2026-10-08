# 0032 — Workspace and Member are stored by Better Auth's organization plugin

Status:   accepted
Date:     2026-10-08
Deciders: kritpavin

## Context

ADR 0026 chose Better Auth and did not adopt its organization plugin, following constraint 2 of
the brain's `auth-decision-brief.md`: a provider's organization feature would take the Workspace
context away from Thrive. #72 then built Workspace and Member by hand, in the Workspace module's
own `workspace` and `member` tables.

kritpavin has decided that the plugin should manage Workspaces and their Members instead, so that
the invitation, role and membership machinery it already has is available to the cards that
follow. This record replaces one consequence of ADR 0026, "the organization plugin is not
adopted". The rest of ADR 0026 stands.

## Decision

**Better Auth's organization plugin stores Workspace and Member and holds the membership rules
it already has. The Workspace module stays the only way in, and keeps the rules that need another
module.**

- The plugin is configured in `apps/api/src/infrastructure/auth/auth.ts`, mapped onto the
  glossary's names: its `organization` model is the `workspace` table, `organizationId` is
  `workspaceId`, and the founder's role is `owner`. Team size is an additional field.
- One Workspace per person (ADR-0020) is the plugin's `organizationLimit: 1`. The adapter reports
  the plugin's refusal as `ALREADY_IN_A_WORKSPACE`.
- The Workspace module calls the plugin from one adapter,
  `BetterAuthWorkspaceFoundingAdapter`, behind its own `WorkspaceFounding` port. It calls
  `createOrganization` with the caller's own `cookie` header, as the plugin expects, so the
  plugin applies its limit, makes the caller `owner` and sets the new Workspace as the session's
  active one.
- Only Google's callback is mounted (ADR 0027), so none of the plugin's endpoints are reachable
  from the browser. `POST /v1/workspaces` is the only way to create a Workspace.
- The use case keeps `PROFILE_REQUIRED`, which needs Identity and so cannot live in the plugin's
  options without `infrastructure/auth` depending on a module. It also holds the per-Account
  advisory lock (ADR 0031): the plugin checks its limit and then writes, so the lock is what stops
  two tabs from both passing that check. `POST /v1/workspaces` and `GET /v1/members/mine` keep
  their contract.
- Reads still go straight to the Workspace module's tables through `PrismaMembershipQuery`. The
  stored `owner` is answered as `OWNER`.
- The slug the plugin requires is an opaque UUIDv7. Thrive shows no slug.

## Alternatives

- **Keep Workspace and Member hand-built (ADR 0026 as written).** Every rule stays plain domain
  code inside one transaction. Invitations, role changes and leaving would all still have to be
  built. Rejected by kritpavin in favour of the plugin's machinery.
- **The web calls the plugin directly through `organizationClient`.** Less API code, but it drops
  the `/v1` routes and their error codes and puts the plugin's endpoints in the browser against
  ADR 0027. Rejected.
- **Call the plugin as the server, naming the founder by `userId`, with
  `allowUserToCreateOrganization: false`.** That skips the plugin's own session handling, never
  sets the active Workspace, and leaves the plugin as a bare store with every rule duplicated
  beside it. Rejected.
- **The Profile check in `allowUserToCreateOrganization`.** It would put the whole create rule in
  the plugin, but the auth instance would have to reach Identity's Profile, and Identity already
  depends on the auth instance. Rejected.
- **The plugin's default table names.** The simplest configuration, but it puts `organization` in
  the database, against the glossary. Rejected.

## Consequences

- The plugin writes the Workspace and its first Member as two separate statements, outside the
  use case's transaction. If the second fails, a Workspace with no Owner is left behind. The
  advisory lock still serializes two tabs, because the plugin's writes commit before it is
  released.
- `member.userId` and `invitation.inviterId` now have foreign keys into Identity's `user` table.
  That departs from ADR 0030's "no foreign key into Identity's tables" and from `BE_03` R7. The
  plugin defines those relations and the generator writes them.
- `session.activeOrganizationId` is added to Identity's `session` table and set when a Workspace
  is created. Nothing reads it yet. A Workspace switcher (parked in ADR-0020 in the brain) would
  use it.
- An `invitation` table exists that no route writes yet.
- The plugin has no Deactivate: its `removeMember` deletes the row. Deactivate (glossary) will need
  an additional field and a use case of our own.
- Role is stored as a string, not an enum. The `MemberRole` value object is what refuses an unknown
  one.
- `BE_21` R9's detail changes in the same pull request: a provider's organization feature may store
  membership and hold its own membership rules while it writes our database and sits behind the
  module's port; a rule that needs another module stays in a use case.
- The brain's `auth-decision-brief.md` (constraint 2) records the opposite decision and needs the
  same correction there.
