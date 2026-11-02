# 0081 — Given reads Feedback and Kudos as one list

Status:   accepted
Date:     2026-11-02
Deciders: kritpavin

## Context

The Given page at `/brand-new-given` shows what one Member wrote, newest first, scrolling without
end, as a grid of the real cards or as a list of Home's cards. It is Received seen from the other
side, so it needs ADR 0080's list with the person on the other end of the read.

Three things differ from Received. A Member who gave a Kudos for the whole Workspace wrote it, though
it names nobody. A Giver is not told the Visibility of an answer or who else a request asked, which
brain `ADR-0022` and `ADR-0046` keep to Everyone; kritpavin decided that a Giver sees all of that on
what they wrote. And a Giver may not read another Giver's answer under Only me, or under Selected
people unless they were chosen, so a list that draws everyone asked cannot simply carry every answer.

## Decision

**`GET /v1/workspaces/{workspaceId}/given-items` is one read over both tables, in ADR 0080's shape and
under ADR 0077's cursor.** Whose list it is comes from the session and is an argument to the reads.

- **An item is a `received-items` item.** The same Feedback, with its Visibility and its card, and the
  same Kudos, so one set of cards draws both pages.
- **Feedback is given by its Giver**: Offered Feedback and answers alike, at every Visibility.
- **A Kudos is given by whoever wrote it, whether it names anybody or not.** ADR 0080 leaves a
  whole-Workspace Kudos out of Received because it would land in every Member's list. Here it lands in
  one, and it is theirs.
- **Requests are not given.** What a Member asked for is in My requests. An answer they wrote to one
  is in Given.
- **Every Asked person is listed with where they stand. What another Giver wrote comes only if the
  caller may read it**, by `Visibility.letsRead`, the rule that opens a postcard (ADR 0072). Otherwise
  that Ask is `ANSWERED` with `answer: null`, so what is hidden never leaves the API.

## Alternatives

- **A `side` choice on `received-items`.** One route, but ADR 0080's whole authorization rule is that
  the route can only ever read the caller's Received, and a Given read needs a different answer rule.
- **Hide who else was asked unless the Visibility is Everyone.** Keeps `ADR-0046` as it stands.
  Rejected by kritpavin: a Giver sees everything about what they wrote.
- **Let a Giver read every answer on the request.** Rejected: another Giver's words are theirs, and
  the postcard's own read refuses them, so the list and the card would disagree.
- **Leave out whole-Workspace Kudos, as Received does.** Rejected above: the Giver could not find
  something they wrote.

## Consequences

- A page after the first costs the same two position lookups as Received.
- `answer: null` no longer means Pending. Web code must read `status` to tell them apart.
- Brain `ADR-0022` and `ADR-0046` no longer describe what a Giver can see on Given. That needs its own
  ADR in the brain, a product decision this file does not stand in for.
- The two lists share what they read and how they merge, in one application service.

Supersedes: —
Referenced by: `list-given-items.use-case.ts`, `given-items.controller.ts`,
`features/given-items.feature`
