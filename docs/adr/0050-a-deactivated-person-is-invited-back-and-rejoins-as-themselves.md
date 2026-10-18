# 0050 — A Deactivated person is invited back, and accepting reactivates their kept membership

Status:   accepted
Date:     2026-10-18
Deciders: kritpavin
Replaces: ADR 0047's refusal of an Invitation into a Workspace where the person is Deactivated
          (`DEACTIVATED_IN_WORKSPACE`); the rest of 0047 stands

## Context

The brain's `ADR-0034` decision 8 says that when a Workspace invites back someone it Deactivated,
their old membership returns, with the Role on the new Invitation. No second Member is made, and
their old Feedback is readable again (#209).

A Deactivated person keeps their `member` row (ADR 0047). Better Auth's organization plugin counts
that row as a Member. So its `createInvitation` refuses them with "already a member", and its
`acceptInvitation` would add a second row and fail on the unique index.

Which addresses belong to whom is Identity's. The Workspace module may not read Identity's `user`
table (`BE_03` R1).

## Decision

**The Workspace module decides who is being invited back. It stores their Invitation through the
plugin's own adapter, and accepting it reactivates the kept row.**

- Identity publishes `AccountByEmailPort.accountsWithEmails`, which matches addresses to Accounts in
  one call, whatever the case.
- `ReturningMembers`, an application service in Workspace, asks that port and then
  `MembershipQuery.deactivatedAmong`. Sending and resending use it inside their per-Workspace lock.
  For a returning address they call `WorkspaceInviting.inviteBack` or `reissueBack`, and
  `invite` or `reissue` for everyone else.
- `inviteBack` and `reissueBack` write the `invitation` table through the plugin's adapter, which
  owns it, as `markSent` already does (ADR 0032). They make the one check the route would have:
  that no Invitation is Pending for the address. Permission was checked by the use case
  (`mayInvite`).
- Accepting, for someone Deactivated in the Workspace, goes through `MemberRejoining`. It settles the
  Invitation as accepted and clears `deactivatedAt` on the kept row, giving it the Invitation's Role.
  Both writes happen in the use case's unit of work, under `workspace-roles:<workspaceId>`.
- Someone already active there — an Admin Reactivated them after inviting them — has the Invitation
  settled by `InvitationSettling`, without anyone being added. `GET /v1/invitations/mine` leaves out
  Invitations to a Workspace the caller is already active in, so Home offers no notice for one.

## Consequences

- `DEACTIVATED_IN_WORKSPACE` is gone from the catalogue.
- Better Auth's `invitation` table is written by name outside the plugin's routes in two more
  places. An upgrade that changes the plugin's adapter must keep that working. The inviting
  adapter's integration spec covers it.
- Each send costs one Identity read and one membership read more, batched across the addresses.

## Alternatives rejected

- **Reading `user` from the Workspace adapter.** The quickest route, but it is Identity's table
  (`BE_03` R1).
- **A fresh Member on rejoining.** `ADR-0034` rejected it: the same person would appear twice in
  the Workspace's history, and lose their old Feedback.
- **Leaving the plugin's refusal and asking Admins to Reactivate instead.** `ADR-0034` decision 8
  makes the Invitation itself the way back.
