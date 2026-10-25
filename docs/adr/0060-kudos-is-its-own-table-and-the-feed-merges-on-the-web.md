# 0060 — Kudos is its own aggregate in Feedback, and the Workspace feed merges it on the web

Status:   accepted
Date:     2026-10-24
Deciders: kritpavin

## Context

The brain's `ADR-0043` (proposed, 2026-10-24) decides what a Kudos is: one message of at most 280
characters, for every active Member it @mentions, read by every Member of the Workspace, with no
Visibility. Home needs to send one and to show it in the Workspace feed among Feedback.

Three code questions follow. Where does it live and in what shape? How does the feed show two kinds
of thing in one list? And how does the new list page, now that ADR 0059 has said every collection
pages by cursor but no route does yet?

## Decision

**Kudos is a third aggregate root of the Feedback module**, beside Feedback Request and Feedback. It
needs Feedback's tag binding (`TagsService`), its people lookup (`PeopleService`) and its membership
guard, and it is the same bounded context in the domain map. Four tables, one migration
(`20261024160021_add_kudos`), all Feedback's:

- `kudos` — id, Workspace, Giver, message; indexed `(workspaceId, createdAt, id)` for the feed.
- `kudos_recipient` — one row per Member it is for; indexed by `accountId` for a later "Kudos for me".
- `kudos_workspace_goal`, `kudos_mention` — what the message was bound to, shaped as Feedback's.

Who it is for is **not sent**. `POST /v1/workspaces/{workspaceId}/kudos` takes `{ message }` only;
`Kudos.give` reads the recipients out of the bound Mentions, less the Giver, and refuses none
(`KUDOS_NEEDS_A_RECIPIENT`). Binding already admits only active Members of the Workspace, so a slug
naming a stranger gives nobody Kudos. A recipient is therefore always a Mention, and both are stored:
the mention rows keep the name for display; the recipient rows are the domain fact.

**`GET /v1/workspaces/{workspaceId}/kudos` is the first route to page by cursor** in ADR 0059's
shape — `?cursor&limit` → `{ items, nextCursor }`. The shape lives in `shared/presentation/dto/page.dto.ts`
(`cursorQueryShape`, `cursorResultShape`, `toCursor`) beside the offset one, so the next route reuses
it rather than copying it (`BE_07` R5). An undecodable cursor is `REQUEST_INVALID`.

**The web merges the feed.** Home reads the Feedback feed and the Kudos list in parallel and
interleaves them by date (`FeedbackFeed`'s `kudos` prop). The Feedback feed's route and contract are
unchanged.

## Consequences

- The contract change is additive: two new operations, nothing existing changes (`GEN_08` R7).
- With more than one page of either, the merged list is only exact for the first page of each — the
  web reads one page of 100 of each today, as it reads every list. When the feed scrolls (ADR 0059's
  next step), merging moves to whichever side owns the scroll; a single API feed would then be worth
  its cost.
- Giving Kudos takes no idempotency key, for the reason ADR 0058 gives for Feedback.
- Nobody is notified of a Kudos; `PersonNotifierPort` has no Kudos message yet.
- Rollback: drop the four `kudos*` tables. Nothing else references them.

## Alternatives rejected

- **A Kudos as Offered Feedback with an origin `KUDOS`, one row per recipient.** It reuses every read,
  but one Kudos to three people becomes three rows and three cards, and Feedback's single-Receiver
  invariant would carry a second meaning.
- **A `UNION` of Feedback and Kudos behind the existing feed route.** One list in the API, but the
  feed's response would change shape for every consumer, and an offset `UNION` across two tables is the
  paging ADR 0059 is leaving behind.
- **A new `kudos` module.** It would have to reach Feedback's tag binding and people lookup through new
  published ports for no boundary the domain map draws.

## Links

- Brain `ADR-0043`, `ADR-0038`; ADR 0058, 0059; `BE_01` R7, `BE_07` R5, `GEN_08` R7
