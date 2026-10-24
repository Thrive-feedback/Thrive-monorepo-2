# 0057 — The current Workspace belongs to the session, not the Account

Status:   accepted
Date:     2026-10-24
Deciders: kritpavin

## Context

ADR 0049 made the current Workspace the caller's active membership with the latest
`member.lastUsedAt`, so every device opened the same one, as the brain's `ADR-0034` decision 2 asks.
It rejected `session.activeOrganizationId` because a second device would land somewhere else.

Commit `9b73927` (2026-10-18) then moved the current Workspace onto the session, and `PROJECT.md`
was updated to match. No ADR recorded the change, so 0049 still described behaviour the code no
longer had. This record is written after the code it describes, which `GEN_13` R4 warns against. It
exists so that the decision can be found from the code.

## Decision

**The Workspace a person is in is the organization plugin's `session.activeOrganizationId`: one per
sign-in, per device.**

- It is read and set through the Workspace module's `SessionWorkspace` port, on the caller's own
  session.
- Three things put the session in a Workspace: `POST /v1/workspaces/{workspaceId}/switch`, creating
  a Workspace, and accepting an Invitation.
- `GET /v1/members/mine/current` answers the session's Workspace while the caller is active there.
  Otherwise it answers the only Workspace they are active in, if there is exactly one. Otherwise it
  answers `null`, and the web asks them to choose. That happens after signing in, or once the
  Workspace they were in Deactivated them.
- `member.lastUsedAt` stays. It is stamped by the same three actions and only orders
  `GET /v1/members/mine`, used last first.
- Reads never write. A session that has not chosen stays that way until it does.

This supersedes ADR 0049's Decision. Its ordering of `members/mine` and its serializing of
accepting on `workspace-roles:<workspaceId>` stand.

## Consequences

- Someone in two or more Workspaces chooses again after signing in on a new device. This departs
  from the brain's `ADR-0034` decision 2 ("every device opens the same Workspace … there is no
  page asking them to choose"). **No brain ADR records the departure yet.** The product
  owner decided it on 2026-10-24, and the brain needs a superseding ADR at its next session.
- Two tabs on one device share a session, so switching in one moves the other. ADR 0051 is what
  stops a stale tab acting on the Workspace it no longer shows.
- Someone in exactly one Workspace never chooses, on any device.
- Signing out and back in on the same device loses the choice, because the session that held it is
  gone.

## Alternatives rejected

- **The active membership used last, stamped on `member` (ADR 0049).** It gives every device the
  same Workspace, and it was built first. It also means that switching on one device moves every
  other device the next time it reads. The reason for replacing it in `9b73927` was not written
  down at the time, and this record does not invent one.
- **A cookie per device.** It behaves like the session, but it is one more thing to keep in step
  with Deactivate, and the plugin already stores the session's choice.

## Links

- ADR 0049 (superseded), ADR 0032 (the organization plugin), ADR 0051 (stale tabs)
- Brain `ADR-0034` decision 2
- `GEN_13` R4, R7
