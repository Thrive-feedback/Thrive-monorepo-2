# Technical design · FB-4 See the Feedback shared with me

**Ticket:** [#88](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/88) FB-0032
(see real feedback shared with me) · Epic [#7](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/7)
**Supersedes the mock card:** [#87](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/87) FB-0031
**Status:** draft, 2026-10-17 · **Author:** naroebordin (with Claude) · **Follows:**
`docs/design/0017-see-the-feedback-i-received.md`
**Read with:** `docs/design/0019-see-the-workspace-feed.md` (#90), which reuses §4.2 and §5 of this one

> **Since 2026-10-22:** Topic is retired (brain `ADR-0039`, ADR 0054). Read *Topic* below as the
> request's **Request message**, and *body* as the **Feedback message**. Feedback no longer holds
> or returns a Topic of its own. This record is left as it was decided.

---

## 1. Context

Visibility is now chosen and stored. #84 lets a Requester pick who else reads what a request
collects, #29 lets a Giver pick who else reads Feedback given unasked, and `ADR 0042` fixed where
that choice is enforced: in `GetFeedbackUseCase`, where **one piece** is opened, through
`Visibility.letsRead`.

What does not exist is the other half — **a list of what was shared with you**. A Member who was
selected on four pieces has no way to find them: they are not addressed to them, so *Feedback for
me* (#26) excludes them by construction, and nothing links to them. Home's *Shared with me* tab
shows `previewSharedWithMe()` from
`apps/web/app/(signed-in)/(member)/home/_lib/feed.mock.ts`, whose own comment says to delete it
once the endpoint exists.

| Card | What a Member can do afterwards |
| --- | --- |
| #88 | Open **Shared with me** and read exactly the Feedback they were selected for, newest first |

Why this card next, rather than #90 (the Workspace feed) or #92 (reactions):

- The rows exist and are unreachable as a set. Both write paths (#84, #29) have shipped.
- It needs **no new domain noun**: `Shared with me`, `Visibility` and `Selected people` are all
  rows in the brain's `glossary.md` already.
- It is the smaller of the two feed cards, and it establishes the read shape — the route family,
  the row type, the ADR — that #90 then reuses for one more query method.

**The mock card #87 is skipped**, as #15, #23, #17, #22 and #25 were (`GEN_04` R5): its sample list
is a file this work deletes. Close #87 as superseded when PR 2 merges, with a comment naming it —
not before, since until then #87 is the only board record that the screen is owed.

Scope facts from `ADR-0022`, through the Epic: Feedback **always shows the Giver's name**; a
Visibility is chosen when sending and **never changes**; Reactions are #92 and comments are not
planned.

## 2. Decisions

| # | Decision | Rejected | Why |
| --- | --- | --- | --- |
| D1 | A **new collection route**, `GET /v1/workspaces/{workspaceId}/shared-feedback` | `GET …/feedback?audience=SHARED_WITH_ME` | The response shape differs: a shared piece must name the **Receiver**, and `…/feedback` deliberately does not — its Receiver is always the caller (`0017` D3). A parameter whose value changes the response shape is the thing `BE_07` R7 refuses. Worse, `0017` D2 already reserved `?role=RECEIVED\|GIVEN` on that route for #27: two dimensions on one route is a six-way matrix nobody can type |
| D2 | Named `shared-feedback`, not `feedback/shared-with-me` | the nested path | `BE_07` R1 — a route is a noun; a verb or a phrase appears only as a sub-resource action on a state transition. `shared-feedback` is the Feedback shared with the caller, and the caller is the session's, never the path's |
| D3 | The **reader is an argument to the query**, from `@CurrentActor` | a Workspace-wide read filtered in the use case; an Admin or Owner override | Same construction as `receivedBy` and `sentInWorkspace`: a version of this that lists what *somebody else* was shared cannot be written by accident (`BE_21` R4). An Admin has no claim here — `ADR 0042` already settled that reading is the Visibility's to grant, not the Role's |
| D4 | **The list is filtered in the query; the value object stays the authority for one piece.** Recorded as `docs/adr/0044` | reading every piece of the Workspace and filtering with `Visibility.letsRead` in the use case | A list is paginated, and `total` has to be the count of what the caller may read — so the predicate has to be in the `WHERE`, not in TypeScript after `take`. Filtering 20 rows out of a page of 20 would also return short pages that look like the end of the list. The cost is one rule expressed twice; §7's agreement spec is what keeps the two readings honest |
| D5 | One new row type, **`FeedbackWithPeopleRow`**, shared with #90 | a `SharedFeedbackRow` per screen; reusing `FeedbackWithVisibilityRow` | Both feed reads need the same thing — a piece with **both** people named — and neither needs the Visibility back, because the query already applied it. Reusing the visibility row would hand the use case a field it must be trusted not to re-check |
| D6 | The query also filters `visibility: 'SELECTED_PEOPLE'`, although the join alone would do | matching on the join only | Redundant by construction — `Visibility.of` refuses selected people on any other value — and kept anyway: if a future write ever leaves a stray `feedback_selected_person` row behind, this filter makes it invisible rather than readable. Defense in depth, one indexed column, no measurable cost |
| D7 | **One index migration**: `@@index([accountId])` on `FeedbackSelectedPerson` | no index; a composite including `feedbackId` | The table's primary key is `(feedbackId, accountId)`, so a lookup **by `accountId`** has no usable prefix — this read's only access path is a full scan of the join table without it. Index-only, non-destructive (§6) |
| D8 | `AccountNamesService.namesOf([...givers, ...receivers])` — **one call per page** | a name per row; two calls, one per role | `BE_06` R9 and the service's own reason for existing. It de-duplicates, so a page costs one call however many people its rows name |
| D9 | `FeedItem`'s names become `string \| null`, and `FeedbackCard` falls back | mapping `null` to a name in the service | A Member who has not introduced themselves has no name, and the card is the one place that decides what to show instead — matching `ReceivedFeedbackListView`'s `?? 'a teammate'`. Doing it in the service would hard-code the copy in two services once #90 lands |
| D10 | **Two pull requests: API, then web** | one PR | `GEN_08` R8 — the contract ships before what consumes it. Precedent: `0017` D9 |

## 3. Domain model

**No change.** `Feedback`, `Visibility` and `FeedbackSelectedPerson` already hold everything this
reads; `Visibility.letsRead` already states the rule. #88 adds a read projection, one index and one
ADR — no entity, no value object, no repository method, no new table or column.

## 4. API

```
modules/feedback/
  application/
    query-port/feedback-request.query-port.ts     + sharedWith(), FeedbackWithPeopleRow, FeedbackWithPeoplePageRow
    types/feedback-request.types.ts               + SharedFeedbackListView (items: FeedbackView[])
    use-cases/list-shared-feedback.use-case.ts    NEW   #88
  infrastructure/
    query/prisma-feedback-request.query.ts        + sharedWith()
  presentation/
    shared-feedback.controller.ts                 NEW   (D1)
    dto/list-shared-feedback.dto.ts               NEW
  feedback.module.ts                              + the controller and the use case
prisma/
  schema.prisma                                   + @@index([accountId]) on FeedbackSelectedPerson
  migrations/<ts>_add_shared_feedback_index/      NEW
```

### 4.1 Route

Under `/v1/workspaces/:workspaceId/…` behind Feedback's own `WorkspaceMemberGuard` — a non-Member
is answered `404 WORKSPACE_NOT_FOUND` (`BE_21` R3, `ADR 0037`). The global `SignedInGuard` answers
`401 NOT_SIGNED_IN` first (`ADR 0029`). Who the caller is comes from `@CurrentActor`, never from the
query.

| Verb | Path | Result | Codes |
| --- | --- | --- | --- |
| `GET` | `…/shared-feedback?page&pageSize` | the Feedback the caller was **selected** to read, newest first: `id`, `origin`, `feedbackRequestId`, `topic`, `giver{accountId,name}`, `receiver{accountId,name}`, `body`, `createdAt` | `200`; `400 REQUEST_INVALID`; `401 NOT_SIGNED_IN`; `404 WORKSPACE_NOT_FOUND` |

`BE_07`: R1 a noun, R4 the version in the path, R5 the shared `pageQueryShape` / `pageResultShape`
from `shared/presentation/dto/page.dto.ts` (default 20, max 100), R6 no undeclared filter, R7 no
envelope, R9 the path identifies and the query shapes, R10 every type declared so it reaches the
generated contract.

**`giver` and `receiver` are nested objects**, exactly as `GetFeedbackResponseDto` has them — a
nullable name must sit below the response root or `@nestjs/swagger` reads nestjs-zod's
`type: ['string','null']` as *array of string* (`0016` §10). Do not flatten them to
`giverName` / `receiverName`.

**No new error codes.** Every refusal this route can make already has one.

### 4.2 Query port and read

```ts
/** One piece of Feedback with both of its people, for a read that already applied the Visibility. */
export interface FeedbackWithPeopleRow {
  readonly id: string;
  readonly origin: FeedbackOrigin;
  readonly feedbackRequestId: string | null;
  readonly topic: string;
  readonly giverAccountId: string;
  readonly receiverAccountId: string;
  readonly body: string;
  readonly createdAt: Date;
}

export interface FeedbackWithPeoplePageRow {
  readonly items: readonly FeedbackWithPeopleRow[];
  readonly total: number;
}

/**
 * The Feedback one Member was selected to read in one Workspace, newest first. The reader is a
 * required argument for the same reason the Workspace is: what one Member was shown is not
 * another's, and a read scoped to nobody cannot be written.
 */
abstract sharedWith(
  workspaceId: string,
  readerAccountId: string,
  page: PageRequest,
): Promise<FeedbackWithPeoplePageRow>;
```

The Prisma implementation, beside `receivedBy` and in its shape:

```ts
const where = {
  workspaceId,
  visibility: 'SELECTED_PEOPLE',                            // D6
  selectedPeople: { some: { accountId: readerAccountId } },
} as const;
// findMany: orderBy NEWEST_FIRST, skip skipFor(page), take page.pageSize
// count: the same where, in the same Promise.all
```

`NEWEST_FIRST` is the existing `[{ createdAt: 'desc' }, { id: 'desc' }]` — the id breaks the tie so
two pieces written in the same millisecond cannot swap places between page one and page two.

**The caller can never be the Giver or the Receiver of a row here:** `Feedback.offer` refuses
selecting either, and `#84`'s request path refuses selecting the Requester. So *Shared with me*
never repeats a piece that belongs on *Feedback for me*, and no `NOT IN` is needed to keep them
apart. §7 pins that with a scenario rather than a comment.

The port is now named for requests while serving Feedback rows too. Renaming it is not this
change's (`GEN_15` R2) — note it in the PR description.

### 4.3 Use case

`ListSharedFeedbackUseCase.execute({ workspaceId, readerAccountId, page })`, one public method
(`BE_05` R1), a query and not a command (R3), reading through the query contract and loading no
aggregate (R4), returning plain data (R7). It calls `sharedWith`, then `namesOf` once with both
id lists, and maps to `FeedbackView` — the view `GetFeedbackUseCase` already returns for one piece,
which carries both people and no Visibility. No workflow error: an empty list is `{ items: [], total: 0 }`.

It does **not** construct a `Visibility`. That is D4, and the ADR says so where a reader will look.

### 4.4 Controller

`SharedFeedbackController`, its own file beside `FeedbackController` — one controller per resource,
use cases injected and nothing else (`BE_07` R3). It reuses `WorkspacePathParamsDto` and the
`toFeedbackResponse` mapping shape already in `feedback.controller.ts`; lift that helper into
`presentation/dto/feedback-response.mapper.ts` only if #90 needs it a third time (`GEN_16` R5 —
extract at the second occurrence, and this is the second).

## 5. Web

```
app/(signed-in)/(member)/home/
  _lib/shared-feedback.service.ts        NEW   server-only read
  _lib/feed.mock.ts                      −     previewSharedWithMe() deleted; file survives for #90
  _components/shared-feedback-list.tsx   NEW   organism-level read, as ReceivedFeedbackList is
  _components/home-tab-panel.tsx         ~     case 'shared' renders the real list
lib/feedback/feed-item.type.ts           ~     giverName / receiverName become string | null
components/organisms/feedback-card.tsx   ~     falls back to 'A teammate'; initials(name ?? '')
```

- The read follows `received-feedback.service.ts` exactly: `'server-only'`, `cache()` so the two
  layouts Home draws share one call, `cache: 'no-store'`, and `ONE_PAGE = { page: 1, pageSize: 100 }`
  — one page covers a Workspace of 20–50 people (`FE_09` R1, R2, R10).
- Reading happens in the component that renders the data, at organism level (`FE_09` R1, `FE_02` R5),
  inside the `<Suspense>` boundary `HomeTabPanel` already sits in (`FE_09` R7).
- `reactions` stays `{}` until #92. `ReactionBar` already renders the four emoji with no names from
  an empty map, and its state is client-side only — nothing to change.
- The preview banner goes with the data: `isPreviewData` is no longer passed for this tab. The prop
  itself survives until #90 removes the last caller (`GEN_16`).
- Empty copy stays as the mock had it: *Nobody has shared Feedback with you yet.*
- No new route and no navigation change — the tab exists.

## 6. Schema and migration

```prisma
model FeedbackSelectedPerson {
  // unchanged columns
  /// For "Shared with me" (#88): the read starts at the reader, which the primary key's
  /// (feedbackId, accountId) order cannot serve.
  @@index([accountId])
}
```

`bun run --cwd apps/api db:migrate:dev --name add_shared_feedback_index` →
`prisma/migrations/<ts>_add_shared_feedback_index/migration.sql`, one `CREATE INDEX`.

- One tool owns the schema, one module's tables (`BE_15` R1, R2), derived from the read the domain
  needs (R3).
- **Existing rows:** untouched. No column added, nothing rewritten, no default backfilled (R8).
- **Rollback**, in the migration's description (R6): `DROP INDEX "feedback_request_selected_person..."`
  — safe at any time, the read degrades to a scan.
- No expand/migrate/contract: a reader on the old code tolerates an extra index (R5).
- **Cost:** one btree, maintained on every `feedback_selected_person` insert. Accepted: that table is
  written once per selected person per piece, and read on every open of this screen.
- `#119` (prove the migration path against a real Postgres in CI) is still open, so after the deploy
  check the schema yourself: `cd apps/api && bunx --bun prisma migrate status`. Railway's rollback
  never rolls back schema (`ADR 0033`) — an index-only migration is the cheapest possible case of
  that risk, not an exception to it.

## 7. Tests

**API unit** (`bun test`, `BE_11` — named for the actor, the action and the outcome; ports
substituted, real domain objects):

- `list-shared-feedback.use-case.spec.ts`
  - a Member reads what they were selected for, newest first, both people named
  - a Giver with no Profile reads as `null`, and so does a Receiver with none
  - every person on the page is named in **one** `summariesOf` call — asserted on the fake's call
    count, as `list-sent-feedback-requests.use-case.spec.ts` does
  - nothing shared → `{ items: [], total: 0 }`
  - `total` comes from the query, not from `items.length`
- `visibility-agrees-with-the-shared-read.spec.ts` — **the D4 guard.** A table of
  (visibility, selected, reader, giver, receiver) asserted against both `Visibility.letsRead` and a
  pure predicate that mirrors the query's `where`. It fails the day one of the two readings drifts,
  which is the whole risk the ADR accepts.

**API integration** (`*.integration.spec.ts`, real Postgres, `BE_12`) — this one is written, unlike
`0017`'s, because the behaviour **is** the query:

- a selected Member sees the piece; a Member who was not selected does not
- `ONLY_ME` and `EVERYONE` pieces never appear
- another Workspace's piece never appears
- paging: `total` counts only what the caller may read; page 2 continues page 1

**Gherkin** (`@api`, `GEN_10`): new `features/shared-feedback.feature` — one file per capability —
steps in `apps/api/test/steps/shared-feedback.steps.ts`, reusing the Background and wording of
`offered-feedback.feature` exactly (R6):

- Requested Feedback shared with Cara is in Cara's *Shared with me*
- Offered Feedback shared with Cara is in it too
- Dan, not selected, has nothing shared with him
- a piece set to *Only me* is in nobody's *Shared with me*
- Ben, the Giver, does not find his own piece here — it is not *shared with* him

**Web** (Vitest + Testing Library + MSW, `FE_14` — by role and accessible name, network mocked at
MSW and nothing below it):

- `shared-feedback.service.test.ts` — maps the contract to `FeedItem`, keeps order, passes the
  cookie, asks for one page
- `shared-feedback-list.test.tsx` — cards show both names, the Topic, the day, the body; the empty
  state; a nameless Giver renders the fallback
- `feedback-card.test.tsx` — extended for the `null` name case

**Seed** (`apps/api/scripts/seed-local.ts`): the script seeds **two** Members, and a piece shared
with Ann cannot be given by Ann or to Ann (§4.2). So PR 2 adds a **third** Member — `signIn('cara',
'Cara Diaz')`, a `member.create` beside Ben's, and one `POST …/feedback` from Ben to Cara with
`visibility: 'SELECTED_PEOPLE'`, `selectedAccountIds: [owner.accountId]` — plus a line in the
printed summary and the `?tab=shared` address. Without that third person the PM walk has nothing to
look at.

## 8. `todo` convention entries interpreted

`AGENTS.md`: while an entry is `todo` its document does not exist and **the index entry is the
binding text**. Four bind this change, none in conflict, so "stop and ask" does not fire.

| Entry | Its binding text | How this change reads it |
| --- | --- | --- |
| `BE_14` Transactions and unit of work | `todo`; `ADR 0031` is the interim | Not engaged — this writes nothing and opens no transaction. The read still goes through `PrismaTransactionContext.client`, as every query here does |
| `BE_16` Inter-module communication | index summary only | Unchanged: Identity's `AccountSummaryPort` stays the only way Feedback learns a name (`ADR 0037`) |
| `BE_22` Application security hardening | index summary only | Read as: the authorization decision is in the `WHERE`, and the route takes no parameter naming a person (D3) |
| `FE_18` Error handling and UI states | map backend codes; mandatory loading / empty / error states | `<Suspense>` for loading, the empty state in §5, the root error boundary for the rest. No code table: the screen only reads, and its one failure is the Workspace guard |

`FE_16` is not engaged (no form). `FE_07` R7 (a story per state) still does not apply — Storybook is
#136, `Backlog`.

## 9. Execution plan

```
Ticket:      #88 FB-0032 — a Member reads exactly the Feedback they were selected for
Conventions: GEN_04, GEN_08, GEN_10, GEN_14, GEN_16, GEN_17, BE_03, BE_05, BE_06, BE_07,
             BE_08, BE_09, BE_11, BE_12, BE_13, BE_15, BE_21, FE_02, FE_08, FE_09, FE_14
Files:       §4 and §5
Needs:       nothing from PROJECT.md "planned"
Decisions:   ADR 0044 (D4) — written in PR 1, before the code that relies on it
Checkpoints: the seam in §4.1 approved before PR 1; the PM walk after PR 2
Not doing:   the Workspace feed (#90), reactions (#92), photos on feed cards, cursor paging,
             Giver or Topic filters, telling anybody they were shared something (Epic #13)
```

Two pull requests, each green on all five required CI checks before the next starts. Branch from an
up-to-date `main` (`git fetch && git switch -c …`), never commit on `main`.

| PR | Branch | Contents |
| --- | --- | --- |
| 1 | `feat/88-api-shared-feedback` | `docs/adr/0044-*`; the index migration; `sharedWith()` + the row types; `ListSharedFeedbackUseCase`; `SharedFeedbackController` + its DTO; module wiring; unit + agreement + integration specs; `features/shared-feedback.feature` and its steps; regenerated `packages/api` |
| 2 | `feat/88-web-shared-with-me` | the service, the list organism, the tab wiring, the `FeedItem` / `FeedbackCard` change, deletion of `previewSharedWithMe`, web tests, the third seeded Member |

Per PR, in this order:

```bash
bun install                                   # only if the lockfile moved
turbo run check-types
bun run check:contract                        # PR 1 — regenerates packages/api; commit the diff
bun run lint && bun run format
turbo run test --filter=api                   # PR 1
turbo run test --filter=web                   # PR 2
bun run --cwd apps/api check-arch             # the BE_* specifier rules
```

PR 1 additionally, by hand — CI runs the integration suite on nobody's machine (`PROJECT.md` §4):

```bash
docker compose up -d
bun run --cwd apps/api db:migrate:deploy
bun run --cwd apps/api test:integration
bun run --cwd apps/api test:bdd               # also runs in CI's Scenarios job
```

The PM walk, after PR 2:

```bash
bun run dev
bun run --cwd apps/api db:seed                # prints the cookie and the addresses
```

Signed in as Ann, `/home?tab=shared` shows **one** piece — what Ben wrote to Cara and chose to show
Ann — and *Feedback for me* still shows the two that are hers. Seeing both tabs side by side is the
point of the walk: the same screen, two different reasons to be on it.

Board and brain, as the work lands:

- **#87 closed as superseded** by #88 when PR 2 merges, with a comment naming it.
- **#88 → `Testing`** on PR 2, by hand — the board automation does not move cards
  (`STATE.md`, *Known incomplete*).
- **No glossary change.** `Shared with me`, `Visibility` and `Selected people` are rows already.
- **One ADR, `docs/adr/0044`:** *A Visibility-scoped list is filtered in the query; the value object
  stays the authority where one piece is opened.* It will be read again by #90 and #92.
- `STATE.md` gets the screen once #88 is walked; the brain's, not this repository's.

## 10. Risks and sequencing

| Risk | Handling |
| --- | --- |
| **The rule now lives in two places** (D4) — SQL for a list, the value object for one piece | The agreement spec in §7 fails on drift, and `ADR 0044` names the pair so the next person changing `Visibility` knows a query mirrors it. The alternative — filtering after `take` — is a correctness bug, not a trade-off |
| **#138 (`FD-0017`) is open** and will set one convention for calling the API | PR 1 is API-only. PR 2 copies `received-feedback.service.ts`, which is what #138 ratifies; if #138 lands first, follow it instead. Either way the rewrite is one file |
| **#92 (reactions) reshapes `FeedItem`** | Additive: `reactions` is already on the type and already rendered. This change touches the names only |
| **Offset paging under a live list** | Accepted. `total` is exact at read time; a piece shared mid-read can shift page boundaries. One page of 100 covers a 20–50 person Workspace, and `NEWEST_FIRST` breaks ties by id so the order is stable |
| **#90 lands on the same files** | By design: #90 adds one query method, one index and one service, and reuses `FeedbackWithPeopleRow`, the controller shape and ADR 0044. Do #88 first; `docs/design/0019` assumes it |
| Nobody is told they were shared something | Out of scope and owed: *Shared with me* is the only way to find out, which is the same hole `ADR-0006` accepted for Asks. Epic #13 |
