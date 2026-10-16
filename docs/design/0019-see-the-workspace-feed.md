# Technical design · FB-4 See the Workspace feed

**Ticket:** [#90](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/90) FB-0034
(see real public feedback in the Workspace feed) · Epic [#7](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/7)
**Supersedes the mock card:** [#89](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/89) FB-0033
**Status:** draft, 2026-10-17 · **Author:** naroebordin (with Claude) · **Follows:**
`docs/design/0018-see-feedback-shared-with-me.md` (#88), which this one depends on

---

## 1. Context

#88 built the first Visibility-scoped list: *Shared with me*, the pieces a Member was **selected**
for. This is the other value of the same enum — `EVERYONE` — and the last preview data in the
signed-in product. When it merges, `apps/web/app/(signed-in)/(member)/home/_lib/feed.mock.ts` is
deleted and nothing a signed-in Member sees is made up any more.

| Card | What a Member can do afterwards |
| --- | --- |
| #90 | Open **Home** and read every piece of Feedback in their Workspace set to *Everyone*, newest first |

It is also the **first screen where Feedback is read by people it is not about** at Workspace scale.
Two things follow, and they are the whole reason this card is `M` and not `S`:

- the writing guidance (#40) matters more here than anywhere else — noted, not built;
- the Workspace guard is the *only* thing between a stranger and a Workspace's whole public
  history (§4.4). Every other Feedback read is additionally scoped to a person; this one is not.

**#88 first.** This design assumes `FeedbackWithPeopleRow`, the controller shape, the
`FeedItem` nullable-name change and `ADR 0044` already exist. On its own, #90 would have to
introduce all four.

**The mock card #89 is skipped** (`GEN_04` R5) — its sample list is the file this work deletes.
Close #89 as superseded when PR 2 merges, with a comment naming it.

Scope facts from `ADR-0022`: Reactions are #92, comments are **not planned**, and a Visibility is
fixed when sending — so nothing can be removed from this feed, which is itself worth the PM knowing
before it is shown to anyone outside the team.

## 2. Decisions

| # | Decision | Rejected | Why |
| --- | --- | --- | --- |
| D1 | The route is `GET /v1/workspaces/{workspaceId}/feed` | `…/public-feedback`; `…/feedback?audience=EVERYONE` | The glossary's own noun is **Workspace feed** (`WorkspaceFeed` in code), and the path already names the Workspace, so `feed` reads as that Workspace's feed. The query parameter is rejected for the reasons in `0018` D1 — a value that changes the response shape. **This is the one place this design reads a convention generously:** `BE_07` R1 wants a plural noun, and `feed` is a collection noun instead. `…/public-feedback` is the literal-R1 alternative and is a one-line change if review prefers it (`GEN_01` R10 — bend it in the open) |
| D2 | One more query method, `publicIn(workspaceId, page)`, returning `FeedbackWithPeoplePageRow` from `0018` D5 | a feed-specific row type; a `visibility` parameter on `sharedWith` | Same projection, different predicate. A shared `visibility` parameter would make one method mean two audiences and hand the caller the choice of which rule to apply — the opposite of what `ADR 0044` fixes |
| D3 | **No reader argument at all.** The read is scoped to the Workspace and to `visibility: 'EVERYONE'`, and nothing else | passing the reader for symmetry with `sharedWith` | `Visibility.letsRead` returns `true` for every Member when the value is Everyone, so a reader argument would be a parameter the query must ignore — and a parameter that is ignored is one somebody later believes. Membership is proven **before** the use case runs, by the guard, which is what lets Everyone mean every Member (`ADR 0042`, the value object's own note) |
| D4 | **One index migration**: `@@index([workspaceId, visibility, createdAt])` on `Feedback` | relying on `@@index([workspaceId, receiverAccountId, createdAt])`; no index | Neither existing index leads with a column this read filters on, so both degrade to a scan plus a sort. This is also the only Feedback read whose row count grows with the **whole Workspace's** activity and has no per-person predicate to narrow it (§6) |
| D5 | A request set to *Everyone* reaches the feed **only once answered** | listing requests with no answers as "pending" cards | The feed lists `feedback` rows; a request with no answer has produced none. Nothing to decide and nothing to build — but it is #90's walk step 3, so §7 pins it with a scenario rather than leaving it to be rediscovered when #31 lands several Asks per request |
| D6 | Both call sites switch together, and `cache()` keeps it to one API call | reading in `page.tsx` and passing items down to the tab | Home draws the narrow and the wide layout and lets CSS show one (`page.tsx`'s own note), so the feed is rendered twice per request. React's `cache` already deduplicates the other reads; the feed joins that pattern instead of inventing a prop drill |
| D7 | `feed.mock.ts` and the `isPreviewData` prop are **deleted**, not left behind | keeping the preview flag "for the next unfinished screen" | `GEN_16` — delete what you replaced. The prop's three consumers are the mock's two call sites and the component itself; after this card there are none. A future unfinished feed can re-add six lines |

## 3. Domain model

**No change**, for the same reasons as `0018` §3. One read projection, one index, no ADR of its own
— it cites `ADR 0044`.

## 4. API

```
modules/feedback/
  application/
    query-port/feedback-request.query-port.ts     + publicIn()
    types/feedback-request.types.ts               + WorkspaceFeedView (items: FeedbackView[])
    use-cases/list-workspace-feed.use-case.ts     NEW   #90
  infrastructure/
    query/prisma-feedback-request.query.ts        + publicIn()
  presentation/
    workspace-feed.controller.ts                  NEW   (D1)
    dto/list-workspace-feed.dto.ts                NEW
  feedback.module.ts                              + the controller and the use case
prisma/
  schema.prisma                                   + @@index([workspaceId, visibility, createdAt]) on Feedback
  migrations/<ts>_add_workspace_feed_index/       NEW
```

### 4.1 Route

| Verb | Path | Result | Codes |
| --- | --- | --- | --- |
| `GET` | `…/feed?page&pageSize` | every piece in the Workspace whose Visibility is *Everyone*, newest first: `id`, `origin`, `feedbackRequestId`, `topic`, `giver{accountId,name}`, `receiver{accountId,name}`, `body`, `createdAt` | `200`; `400 REQUEST_INVALID`; `401 NOT_SIGNED_IN`; `404 WORKSPACE_NOT_FOUND` |

Same `BE_07` reading as `0018` §4.1, same nested `giver` / `receiver` objects for the same
generator reason (`0016` §10), same `pageQueryShape` / `pageResultShape`. **No new error codes.**

### 4.2 Query port and read

```ts
/**
 * The Feedback of one Workspace that every Member may read, newest first. No reader argument:
 * Everyone means every Member, and membership is proven before this runs (ADR 0042).
 */
abstract publicIn(
  workspaceId: string,
  page: PageRequest,
): Promise<FeedbackWithPeoplePageRow>;
```

```ts
const where = { workspaceId, visibility: 'EVERYONE' } as const;
// findMany: orderBy NEWEST_FIRST, skip skipFor(page), take page.pageSize
// count: the same where, in the same Promise.all
```

Cross-Workspace exclusion is structural — `workspaceId` is a required argument, not a filter the
caller may omit. There is no code path that reads the feed of a Workspace the caller is not in.

### 4.3 Use case

`ListWorkspaceFeedUseCase.execute({ workspaceId, page })`. Calls `publicIn`, then
`AccountNamesService.namesOf([...givers, ...receivers])` once (`BE_06` R9), maps to `FeedbackView`.
No `Visibility` constructed — `ADR 0044`.

Its input has **no account id**, which is unique in this module and is the thing to check in review:
the use case is safe only because the controller's guard ran. That sentence belongs in its doc
comment, not only here.

### 4.4 Authorization — the part to read twice

`WorkspaceMemberGuard` resolves the caller to a membership of `:workspaceId` and answers
`404 WORKSPACE_NOT_FOUND` to anyone else (`BE_21` R3, `ADR 0037`); the global `SignedInGuard`
answers `401 NOT_SIGNED_IN` before that (`ADR 0029`).

For every other Feedback read, the guard is the **first** of two defences — the second being the
account id the query is scoped by. Here it is the only one. So:

- the guard's existing spec (`presentation/workspace-member.guard.spec.ts`) is referenced in the PR
  description, not re-implemented;
- the controller declares the guard at class level, as the others do, so a route added later cannot
  forget it;
- **"a Member of another Workspace sees none of it" is an `@api` scenario**, not a unit test (§7).
  It is #90's walk step 5 and the one failure mode that leaks a Workspace's whole feed.

## 5. Web

```
app/(signed-in)/(member)/home/
  _lib/workspace-feed.service.ts         NEW   server-only read, cache(), no-store, ONE_PAGE
  _lib/feed.mock.ts                      DEL   the last preview data in the signed-in product
  _components/workspace-feed.tsx         NEW   organism-level read
  _components/home-tab-panel.tsx         ~     case 'workspace' renders the real feed
  page.tsx                               ~     the wide-screen workspaceFeed prop renders it too
components/organisms/feedback-feed.tsx   ~     isPreviewData removed (D7)
```

Same conventions as `0018` §5. Two notes specific to this card:

- **Both call sites change in the same commit.** `HomeTabPanel`'s `'workspace'` case and
  `page.tsx`'s `workspaceFeed` prop both render the feed; leaving one on the mock would show a
  Member real data on a phone and invented data on a laptop. A web test asserts the service is
  called once when both layouts render (D6).
- The empty copy stays *Nothing has been shared with everyone yet.* — it already says how Feedback
  gets here, which is #89's acceptance criterion.

## 6. Schema and migration

```prisma
model Feedback {
  // unchanged columns
  /// For the Workspace feed (#90): every piece set to Everyone, newest first. The two existing
  /// indexes lead with a person, which this read does not filter on.
  @@index([workspaceId, visibility, createdAt])
}
```

`bun run --cwd apps/api db:migrate:dev --name add_workspace_feed_index`, one `CREATE INDEX`.

- `BE_15` R1–R3 as in `0018` §6. **Existing rows:** untouched. **Rollback** in the description:
  `DROP INDEX`. No expand/contract (R5).
- **Cost:** one btree on `feedback`, maintained on every write — every answer and every offered
  piece, not only public ones. Accepted: a feed read with no narrowing predicate is the one access
  path here that cannot stay a scan as a Workspace accumulates a year of Feedback.
- **Measurement, honestly:** there is no production data to profile — the table has tens of rows.
  This index is derived from the query's shape, not from a measured regression, which is the same
  basis as the two indexes already on the table (their comments name #18 and #26). If you want the
  stricter reading — no index until something is slow — say so and the migration drops out of PR 1;
  the read is correct either way.
- `#119` is open, so after the deploy check the schema yourself:
  `cd apps/api && bunx --bun prisma migrate status`.

## 7. Tests

**API unit** (`bun test`, `BE_11`):

- `list-workspace-feed.use-case.spec.ts` — maps rows and names, keeps order, one `summariesOf` call
  per page, empty feed → `{ items: [], total: 0 }`, `total` from the query
- the agreement spec from `0018` §7 gains the `EVERYONE` rows: the query's predicate and
  `Visibility.letsRead` must still answer the same for every combination

**API integration** (real Postgres, `BE_12`):

- an `EVERYONE` piece appears; `ONLY_ME` and `SELECTED_PEOPLE` pieces never do
- another Workspace's `EVERYONE` piece never appears
- paging and `total` across two pages

**Gherkin** (`@api`, `GEN_10`): new `features/workspace-feed.feature`, steps in
`apps/api/test/steps/workspace-feed.steps.ts`, reusing `offered-feedback.feature`'s Background and
wording (R6). One scenario per rule (R8):

- Feedback given to everyone is in every Member's feed — including a Member who is neither its Giver
  nor its Receiver
- a request set to everyone reaches the feed once it is answered, and not before (D5)
- Scenario Outline: a piece set to *nobody else* or to *Cara* is in nobody's feed
- **a Member of another Workspace sees none of it** (§4.4)
- newest first

**Web** (Vitest + MSW, `FE_14`):

- `workspace-feed.service.test.ts` — contract → `FeedItem`, order, cookie, one page
- `workspace-feed.test.tsx` — cards, empty state, **no preview banner**
- `page.test.tsx` — the wide-screen column holds the real feed and nothing says *Preview data*

**Corrected 2026-10-17, having been wrong when this design was written:** no unit test can assert
D6's "one call for two call sites". React's `cache` deduplicates within a render scope, and outside
one it does not — a probe that called the read twice in Vitest made two requests. A test with the
read mocked would assert the mock, and a test calling it twice would assert the opposite of the
truth. **It is verified by measurement instead**: with a counting proxy between the web app and the
API, one render of `/home` makes exactly one `GET …/feed` (and one `…/shared-feedback`, one
`…/members`, one `/v1/members/mine`), with both layouts drawn. Re-measure that way if the call
sites change.
- `feedback-feed.test.tsx` — updated for the removed prop

**Seed** (`seed-local.ts`): one `POST …/feedback` from Ben to Cara (the third Member #88's PR 2
added) with `visibility: 'EVERYONE'`, plus the line in the printed summary. Ann is then neither its
Giver nor its Receiver, which is exactly the case the feed exists for.

## 8. `todo` convention entries interpreted

As `0018` §8, with one addition:

| Entry | Its binding text | How this change reads it |
| --- | --- | --- |
| `BE_25` Performance and resilience | `todo`, P3; index summary only | Read as: name the access path and index it, and say in the PR what was not measured (§6). No cache, no Redis — `BE_19` is `todo` and nothing is installed (`PROJECT.md` §4) |

## 9. Execution plan

```
Ticket:      #90 FB-0034 — the feed lists every piece set to Everyone in my Workspace, and nothing else
Conventions: GEN_04, GEN_08, GEN_10, GEN_14, GEN_16, GEN_17, BE_03, BE_05, BE_06, BE_07,
             BE_08, BE_09, BE_11, BE_12, BE_13, BE_15, BE_21, BE_25, FE_02, FE_08, FE_09, FE_14
Files:       §4 and §5
Needs:       nothing from PROJECT.md "planned"
Decisions:   none new — cites ADR 0044 from #88. D1's route name is review's to overturn
Checkpoints: the route name in D1 and the seam in §4.1 approved before PR 1; the PM walk after PR 2
Not doing:   reactions (#92), comments (never — ADR-0022), writing guidance (#40), photos on
             feed cards, cursor paging, notifying anybody that they were posted about (Epic #13)
```

Two pull requests, after #88's two have merged. Branch from an up-to-date `main`.

| PR | Branch | Contents |
| --- | --- | --- |
| 1 | `feat/90-api-workspace-feed` | the index migration; `publicIn()`; `ListWorkspaceFeedUseCase`; `WorkspaceFeedController` + its DTO; module wiring; unit + integration specs; the agreement spec extended; `features/workspace-feed.feature` and its steps; regenerated `packages/api` |
| 2 | `feat/90-web-workspace-feed` | the service, the feed organism, both call sites, deletion of `feed.mock.ts` and `isPreviewData`, web tests, the public seeded piece |

Commands per PR: as `0018` §9, unchanged.

The PM walk, after PR 2:

```bash
bun run dev
bun run --cwd apps/api db:seed
```

Signed in as Ann, Home's feed shows **one** piece — Ben to Cara, set to everyone — which Ann neither
wrote nor received. On a laptop it sits in the right-hand column and in the *Workspace* tab, and it
is the same single read. Nothing says *Preview data* anywhere in the product any more; that
disappearance is the thing to check.

Board and brain:

- **#89 closed as superseded** by #90 when PR 2 merges, with a comment naming it.
- **#90 → `Testing`** on PR 2, by hand.
- **No glossary change** — `Workspace feed` is a row already (`WorkspaceFeed`).
- **No new ADR.** `ADR 0044` covers the rule; D1's route naming goes in the PR description, not an
  ADR, because it is cheap to reverse before anything consumes it.
- `STATE.md` gets the screen once #90 is walked, together with the sentence that no preview data
  remains in the signed-in product.

## 10. Risks and sequencing

| Risk | Handling |
| --- | --- |
| **The guard is the only defence** (§4.4) | Class-level guard, an `@api` scenario for the cross-Workspace case, and the use case's doc comment saying why it takes no account id. This is the review's first question, not its last |
| **A Workspace's whole public history is one request** | Paginated at 100 (`MAX_PAGE_SIZE`), as every collection here is. A Member may read all of it — that is what *Everyone* means, chosen piece by piece and never changeable (`ADR-0022`), which is the product decision behind this card and not a leak |
| **The index is not justified by a measurement** (§6) | Stated as such, with the alternative (drop it) named. The access path is unambiguous; the cost is one btree |
| **#40 (writing guidance) is not built** and this is where it matters | Named in #89's own notes and here. The feed shows real names on both sides, so the first awkward public piece is a product risk the PM should see during the walk, before anybody outside the team is invited |
| **#92 (reactions) is next on this screen** | `ReactionBar` already renders from a map and keeps its state client-side; #92 replaces the empty map with real data and adds a write. No shape change here |
| **#88 not merged** | This design does not build standalone: `FeedbackWithPeopleRow`, the controller shape, `ADR 0044` and the `FeedItem` change all arrive with #88. Do them in order |
