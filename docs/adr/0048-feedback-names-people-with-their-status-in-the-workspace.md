# 0048 — Feedback names every person with their status in the Workspace, asked of Workspace once per page

Status:   accepted
Date:     2026-10-17
Deciders: kritpavin

## Context

#193 shows a Deactivated person's name in grey followed by "(inactive)" everywhere in the Workspace —
on Feedback, the Workspace feed, Asks and Members (brain `ADR-0034` decision 13). #194 lets an Admin
Reactivate them, and the name then shows normally again.

Members already says who is Deactivated (`GET …/members?status=DEACTIVATED`, ADR 0047). Feedback does
not: it names people through Identity's `AccountSummaryPort`, and the only fact Workspace publishes to
it, `WorkspaceMembershipPort`, answers for active Members only, which is what ADR 0047 decided every
membership read should do.

## Decision

**Every person a Feedback read names carries a `status`, `ACTIVE` or `DEACTIVATED`, worked out by the
API. Feedback asks Workspace once per page which of the people named are Deactivated.**

- `WorkspaceMembershipPort` publishes `deactivatedAmong({ workspaceId, accountIds })`: which of these
  Accounts were Members of this Workspace and are Deactivated there. It is the published counterpart of
  `membersAmong`, and like it costs one read however many are named. It answers about one Workspace and
  never says where else a person belongs (brain `ADR-0034` decision 12).
- Feedback's `PeopleService` replaces `AccountNamesService`. It asks Identity for names and Workspace
  for the Deactivated, in parallel, once per page, and each use case reads a name and a status per
  person from it.
- On the wire, a flat name gains a flat status beside it (`giverName`, `giverStatus`), and a nested
  person gains `status` (`giver: { accountId, name, status }`). The values are the ones the Members
  route filters by.
- The web draws the grey and the "(inactive)". The API sends the fact only.

## Consequences

- Every Feedback read that names people makes one more query per page, run alongside the names.
- A person missing from Identity (their Account deleted mid-read) has no name, is not in Workspace
  either, and reads as `ACTIVE`, so the screen shows the usual "a teammate".
- Adding a field changes no existing consumer. A person who is Reactivated reads as `ACTIVE` on the next
  request, with nothing cached to clear.

## Alternatives rejected

- **The web reads `GET …/members?status=DEACTIVATED` and matches ids.** That list is paged, so past
  one page it misses people, and it is one more call on every Home render, in every place a name is
  drawn.
- **A boolean `inactive`.** It names the look, not the state, and it would not match the Members
  route's `status`.
- **Workspace publishes each person's status as a map.** It would carry Workspace's status type across
  the boundary for no gain over a list of ids, which is what `membersAmong` already returns.
