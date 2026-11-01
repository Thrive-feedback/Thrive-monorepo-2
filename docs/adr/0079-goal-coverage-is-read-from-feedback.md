# 0079 — Goal coverage is read from Feedback, which already depends on Workspace Goal, and counts only Everyone-visible Feedback

Status:   proposed
Date:     2026-10-31
Deciders: naroebordin

## Context

Brain `ADR-0051` decision 5 says an Insight built on Workspace Goal labels **counts only Feedback
whose Visibility is Everyone**. This record decides where that read lives and what it returns.

The data is split across two modules on purpose. Counts are in `feedback_workspace_goal`, owned by
Feedback. The list of active goals is in `workspace_goal`, owned by Workspace Goal (ADR 0052). `BE_03`
R7 and `AGENTS.md` §6 forbid a join or a shared transaction across them, and the schema already
encodes it — ids only, no cross-module foreign keys.

The product definition is strict. `glossary.md`: an **Insight** is "a total or rate about a Workspace
— never contains Feedback content, and never identifies one person." `domain-map.md` makes that
structural rather than a permission check: "the Admin Dashboard *cannot* show someone's Feedback…
because the Insights context never receives the content." brain `ADR-0033`: "An Admin reads Feedback exactly
as any Member does."

## Decision

**Feedback owns the route. It merges two reads in a use case, pages over the goal list rather than the
counts, and counts only Feedback whose Visibility is `EVERYONE`.**

### Why Feedback and not Workspace Goal

Feedback already depends on Workspace Goal, through `ActiveWorkspaceGoalPort`. The reverse edge —
`workspace-goal` importing `feedback` — is a **module cycle**, and `.dependency-cruiser.cjs` runs with
`tsPreCompilationDeps: true`, so even a type-only import trips `no-cycles` and fails CI. There is no
version of this that lives in Workspace Goal without inverting an existing dependency.

This is the worked case `BE_16`'s index entry describes: two reads, merged in the application layer,
never a join.

### The route

```
GET /v1/workspaces/{workspaceId}/insights/workspace-goal-coverage?from&to&cursor&limit
200 { items: [{ workspaceGoalId, name, feedbackCount }], nextCursor }
403 NOT_ALLOWED_TO_READ_WORKSPACE_INSIGHTS
```

- **`items` carries every active Workspace Goal, including those at `0`.** "Which goals has nobody
  mentioned" is the same question as "how much names each goal", so it is one route and one shape
  rather than two endpoints that could disagree.
- **Paging is over the goal list, not the counts.** A page of goals is read first, bounded by `limit`,
  and only those ids are counted. Ordered by case-folded `name` then `id` so the order is total and the
  cursor names exactly one position (ADR 0059), reusing `toCursor` from
  `shared/presentation/dto/page.dto.ts`.
- `from` and `to` are both required, ISO, UTC (`GEN_11`), `to` exclusive, span capped at 366 days. A
  required period keeps "all time" from becoming the accidental default as the table grows.
- Admin-only, through `WorkspaceMembershipPort.isAdminOf` in the use case, with the member guard
  already answering 404 to an outsider — the same shape `ListWorkspaceGoalsUseCase` uses.

### Only Everyone-visible Feedback is counted

Everyone-visible Feedback is already readable by every Member of the Workspace, on the feed. So an
Insight built only from it **reveals nothing a Member could not already see**, and `glossary.md`'s
"never identifies one person" holds at 20–50 people without depending on how many rows happen to
exist.

This matters because the obvious alternative fails quietly. Counting all Feedback would mean
`feedbackCount: 1` on a goal in a six-person Workspace — and the Admin, reading that beside an open
feed, can often name the person. The Insight would then contain no content and identify somebody
anyway, which is the definition failing on its own terms.

**It changes what the number means**, and every screen showing it must say so: this is *public*
feedback naming a goal, not all feedback.

### A migration that is easy to miss

`feedback_workspace_goal`'s primary key is `([feedbackId, workspaceGoalId])`, so filtering by
`workspaceGoalId` has no usable index. The coverage read does exactly that. Add
`@@index([workspaceGoalId])` with its migration, or the feature ships a sequential scan that grows with
every piece of Feedback ever written.

The count itself is a Prisma `groupBy` on `feedbackWorkspaceGoal` with a `where` reaching through its
own `feedback` relation — legal, because both tables are Feedback's.

### A test that asserts the privacy property

A shape-guard spec asserting the response DTO has no field that could carry text or name a person,
modelled on `visibility-agrees-with-the-list-reads.spec.ts`. The privacy guarantee is structural, so
it deserves a test that fails when somebody adds a helpful `lastMessage` field, rather than a comment
asking them not to.

## Consequences

- **The first real Insight exists**, and Epic #11's question — is feedback happening, and is it about
  what we said we cared about — gets a first answer with nobody reading anyone's words.
- **The number is narrower than it looks.** A founder will read "3" as "three people mentioned
  ownership" unless the screen says *public*. That wording is part of this change, not a follow-up.
- **Private feedback is invisible to Insights**, including Only-me requests, which are the majority
  today. Coverage will read low at first and that is correct, not a bug.
- **Feedback grows an `insights/` read surface**, which is a new kind of thing in that module. If a
  second Insight appears, a dedicated Insights module is the right next move — but one route does not
  pay for a bounded context.
- **One more published method on Workspace Goal**, `allActiveIn`, shared with ADR 0078's proposal route.
- **No AI is involved in this route at all.** It counts rows that `feedback_workspace_goal` already
  holds, whether the hashtag was typed by hand or confirmed from a proposal. It therefore ships and
  stands on its own if the model work never happens.
- **Rollback:** delete the route, the use case and the query; keep the index, which is useful anyway.

## Alternatives rejected

- **Owning the route in Workspace Goal.** The module cycle, above. It reads as the natural home right
  up until CI refuses it.
- **A cross-module join**, or a view over both tables. `BE_03` R7 and `AGENTS.md` §6 — and the schema
  has no foreign key to join on, deliberately.
- **Counting all Feedback and suppressing counts below k = 3.** This was the first answer. It is
  weaker: a threshold is a number somebody argues down next quarter, and it makes "no feedback yet"
  ambiguous with "not enough yet" — which breaks the half of the feature that finds invisible goals.
  Worth keeping in reserve if private Feedback is ever counted, where no scoping argument is available.
- **A second endpoint for goals with no feedback.** Two reads that can disagree about the same instant.
- **Paging over the counts.** The count result is dense and goal-shaped already; paging the counts
  would make "every active goal, including zeroes" unanswerable within a page.
- **An unbounded period.** It becomes the default, and the cost grows with the table forever.
- **Including the Giver or Receiver, even as ids.** `glossary.md` forbids it, and once a field exists
  somebody will render it.

## Links

- Brain `ADR-0051` decision 5 (Everyone-only counting), brain `ADR-0033` (an Admin reads Feedback as
  any Member does), brain `ADR-0036` (Workspace Goals), `glossary.md` (Insight), `domain-map.md` (the
  structural guarantee)
- ADR 0052 (Workspace Goal is its own module), ADR 0053 (bound in rows of its own), ADR 0059 (cursor
  paging), ADR 0044 (visibility filtered in the query)
- `BE_03` R7, `BE_16` (`todo`), `BE_21`, `GEN_11`; `AGENTS.md` §6
