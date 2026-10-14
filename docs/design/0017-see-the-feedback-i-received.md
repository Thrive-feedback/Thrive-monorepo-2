# Technical design · FB-4 See the Feedback I received

**Ticket:** [#26](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/26) FB-0011
(see my real received Feedback) · Epic [#7](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/7)
**Supersedes the mock card:** [#25](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/25) FB-0010
**Status:** draft, 2026-10-13 · **Author:** naroebordin (with Claude) · **Follows:**
`docs/design/0016-see-and-answer-feedback.md`

---

## 1. Context

`0016` closed the loop: a Giver answers an Ask, and the Requester reads that answer **on the request
they already had** — `GET /v1/workspaces/{workspaceId}/feedback-requests/{requestId}`, one request at
a time. Merged 2026-10-13 (PRs #162, #171); #16, #18 and #24 are `Testing`, PM walk owed.

So the `feedback` table has rows and there is **no screen that lists them**. A person who has
collected feedback from four teammates over three requests has to remember which requests those
were and open each one. #26 gives that person one page: everything anybody has written to them,
newest first.

| Card | What a person can do afterwards |
| --- | --- |
| #26 | Open **Feedback for me** and read every piece of Feedback addressed to me, newest first |

Why this card next, rather than #31 (several Givers per request) or #29 (offered Feedback):

- The data exists and is unreachable except one request at a time.
- The schema was already prepared for it: `@@index([workspaceId, receiverAccountId, createdAt])` on
  `feedback`, whose comment reads *"For 'the Feedback I received', newest first (#26)"*
  (`apps/api/prisma/schema.prisma:240`). **No migration.**
- **#29 depends on it.** FB-0015's acceptance is "the Receiver sees it among their received
  Feedback, marked as given without a request" — the shelf has to exist before the thing that goes
  on it.

**The mock card #25 is skipped**, as #15, #23, #17 and #22 were. `GEN_04` R5 wants one vertical
slice; #25's sample list is a file #26 deletes the same day. Close #25 as superseded with a comment
naming the PR that covered it, when that PR merges — not before, since until then #25 is the only
board record that the screen is owed.

Scope facts from `ADR-0022`, through the Epic: Feedback **always shows the Giver's name**; there are
no Questions and no ratings; **Praise and Advice are not fields** (#40 is guidance). Visibility is
the Requester's choice and its screen is #83 — every request today is `ONLY_ME`.

## 2. Decisions

| # | Decision | Rejected | Why |
| --- | --- | --- | --- |
| D1 | `feedback` becomes its **own collection route**: `GET /v1/workspaces/{workspaceId}/feedback`, the Feedback addressed to the caller, newest first | Hanging the list off `…/feedback-requests` as an `include`; a `…/feedback-requests/{id}/feedback` nesting | #26 is the one read with **no request id** — it is "everything written to me", across requests, and #29 adds Feedback with no request at all. `BE_07` R1: a plural noun naming the resource. Same shape of argument as `feedback-asks` in 0016 D8 |
| D2 | **No `role` query parameter.** The route means "the Feedback addressed to the caller". #27 (*the Feedback I've given*) adds `?role=RECEIVED\|GIVEN` with `RECEIVED` as the default | Declaring `role` now with a one-value enum; two routes, `…/feedback/received` and `…/feedback/given` | `PROJECT.md` §2 — solve today's problem. A default-valued parameter added later is additive and does not change what the published route means (`BE_07` R4, `GEN_08` R7), so #27 costs nothing by waiting. A one-value enum is a knob with no consumer, which `AGENTS.md` §9 and the skill's own list refuse |
| D3 | Only the **Receiver** reads it. The caller's `accountId` from the session *is* the `receiverAccountId` the query is scoped by — not a filter applied to a wider read | A read of the Workspace's Feedback filtered in the use case; an Admin or Owner override | #26 AC 2 is explicit: not an Admin, not the Owner. `BE_21` R4 — enforce the scope where it cannot be forgotten. Written as an argument to the query, so "list somebody else's" cannot be written by accident (same construction as `sentInWorkspace`) |
| D4 | Visibility is **not consulted** | Reading `feedbackRequest.visibility` and filtering on it | Visibility governs who *besides* the Giver and Receiver may read (`glossary.md:87`). The Receiver is never the person it excludes. #84 adds the other readers, and that is a different route |
| D5 | The row carries **no `origin` field** yet. A `feedback` row has a non-null `feedbackAskId`, which *is* Requested Feedback | Adding `origin: 'REQUESTED'` now, as the glossary names it | 0016 D4 already took this call; #29 adds the enum and makes `feedbackAskId` nullable in one migration, and the response field is additive when it arrives. #25's mock AC ("requested and offered in the same list") describes a world #29 creates |
| D6 | Each entry shows the **Topic**, read from the request through Feedback's own relation, and **does not link to it** | Topic as a link to `/feedback/requests/{id}` | The entry already shows the whole answer, so the link adds a round trip to see the same text plus the other Asks. It also becomes conditional the moment #29 lands Feedback with no request. Cheap to add later if the walk says otherwise |
| D7 | `namesOf` — "name a page of Accounts in one call" — is **extracted** to `modules/feedback/application/service/account-names.service.ts` in its own pull request, ahead of this work | A third file-local copy; a shared helper in `shared/` | `GEN_16` R5: extract at the second occurrence to the nearest common owner — it is already copied in `list-sent-feedback-requests.use-case.ts` and `get-feedback-request.use-case.ts`, and #26 would be the third. `GEN_15` R2 and `GEN_16` R5 both want the move to be its own change. Nearest common owner is Feedback, not `shared/` — one module consumes it (`BE_01` R8). **This reads two rules generously, so it is yours to refuse** (§2 note below) |
| D8 | ~~Rename `sent-day.util.ts`~~ — **withdrawn 2026-10-13: already done.** PR #172 merged while this design was being reviewed and moved it to `lib/calendar-day.util.ts`. This screen imports that | A fourth day formatter | `GEN_16` R1 — search before you write. The rename this design proposed is `main`'s already, so PR 2 only consumes it |
| D9 | Two pull requests: API, then web | One PR; one PR per layer per screen | `GEN_08` R8 — the contract ships before what consumes it |

**Approved 2026-10-13 (naroebordin)**, as written. D8 was withdrawn the same day, because PR #172
merged and did the rename itself.

**D7 is the one real interpretation in this design.** `BE_01` R3 lists `application/service/` as a
legal role folder, but its *Rule detail* says the folder exists "for the application service
`BE_05#R10` creates when two use cases share a **workflow**". Naming a page of Accounts is a shared
**step**, not a workflow, and `0016` §10 took the other reading — three file-local copies, following
`list-workspace-members.use-case.ts`. `main` now holds one such file —
`workspace/application/service/invitation-delivery.service.ts`, merged with PR #172 on 2026-10-13 —
so the folder is no longer unprecedented. The choice is:

| | Cost |
| --- | --- |
| **Extract** (this design) | Reads `BE_05` R10 as covering a shared step. One new folder, one extra PR, three use cases import it |
| **Third copy** | Honest to `0016` §10's reading and to `BE_05` R10's words; accepts a third copy of eight lines, against `GEN_16` R5 |

I took *extract* because `GEN_16` R5's trigger (the second occurrence) is already two cards behind
us. **Approved as written.**

## 3. Domain model

**No change.** `Feedback` already exists as an entity with `giverAccountId`, `receiverAccountId`,
`body` and `createdAt` (`apps/api/src/modules/feedback/domain/entity/feedback.entity.ts`), created
by `FeedbackRequest.answerAsk()`. #26 adds a read projection and nothing else: no entity, no value
object, no repository method, no migration, no `prisma/schema.prisma` edit.

That is the point of the card being `S`.

## 4. API

```
modules/feedback/
  application/
    service/account-names.service.ts                 NEW   (D7 — its own PR, PR 0)
    query-port/feedback-request.query-port.ts         + receivedBy(), FeedbackRow, FeedbackPageRow
    types/feedback-request.types.ts                   + ReceivedFeedbackView, ReceivedFeedbackListView
    use-cases/list-received-feedback.use-case.ts      NEW   #26
  infrastructure/
    query/prisma-feedback-request.query.ts            + receivedBy()
  presentation/
    feedback.controller.ts                            NEW   (D1)
    dto/list-received-feedback.dto.ts                 NEW
  feedback.module.ts                                  + the controller, the use case, the service
```

### 4.1 Route

Under `/v1/workspaces/:workspaceId/…` behind Feedback's own `WorkspaceMemberGuard` — a non-Member
is answered `404 WORKSPACE_NOT_FOUND` (`BE_21` R3, ADR 0037). Who the caller is comes from
`@CurrentActor`, never from the query.

| Verb | Path | Result | Codes |
| --- | --- | --- | --- |
| `GET` | `…/feedback?page&pageSize` | the **caller's own** received Feedback, newest first: `id`, `feedbackRequestId`, `topic`, `giverAccountId`, `giverName`, `body`, `createdAt` | `200`; `400 REQUEST_INVALID`; `401 NOT_SIGNED_IN`; `404 WORKSPACE_NOT_FOUND` |

`BE_07`: R1 plural noun, R4 version in the path, R5 the shared `pageQueryShape` /
`pageResultShape` from `shared/presentation/dto/page.dto.ts`, R7 no envelope, R9 the Workspace
identifies and the page shapes, R10 every type declared so it reaches the generated contract.

`giverName` is `z.string().nullable()` **inside `items`**, so it is nested one level and the
nullable-primitive generator trap from `0016` §10 does not fire. Keep it there; do not lift a
nullable primitive to a response root.

**No new error codes.** Every refusal this route can make already has one.

### 4.2 Query port and read

```ts
/** One piece of Feedback addressed to a Member, with the Topic it answers. */
export interface FeedbackRow {
  readonly id: string;
  readonly feedbackRequestId: string;
  readonly topic: string;
  readonly giverAccountId: string;
  readonly body: string;
  readonly createdAt: Date;
}

export interface FeedbackPageRow {
  readonly items: readonly FeedbackRow[];
  readonly total: number;
}

/**
 * The Feedback one Member received in one Workspace, newest first. The Receiver is a required
 * argument for the same reason the Workspace is: one Member's Feedback is not another's.
 */
abstract receivedBy(
  workspaceId: string,
  receiverAccountId: string,
  page: PageRequest,
): Promise<FeedbackPageRow>;
```

Implemented in `prisma-feedback-request.query.ts` beside the existing reads, reusing its
`NEWEST_FIRST` and `skipFor`: `where: { workspaceId, receiverAccountId }`, `select` the six fields
with `feedbackRequest: { select: { id: true, topic: true } }`, `count` in the same `Promise.all`.
`where` + `orderBy` match `@@index([workspaceId, receiverAccountId, createdAt])` exactly; `id` is
the tiebreak, as everywhere else in the file.

`BE_06` R7/R8: a projection answered by a query contract, returning a projection or `[]`, never an
entity and never a thrown workflow error. `BE_06` R9: one read, whatever the row count.

### 4.3 Use case

`ListReceivedFeedbackUseCase` — a query (`BE_05` R3/R4): it reads the projection and never loads
the aggregate.

```
execute({ workspaceId, receiverAccountId, page }) : ReceivedFeedbackListView
  1. receivedBy(workspaceId, receiverAccountId, page)
  2. name every giverAccountId on the page in ONE summariesOf call   (D7's service, BE_06 R9)
  3. map to the view; a name that is missing or not yet introduced reads null
```

No authorization branch inside it — D3 puts the rule in the argument, and the guard above it proves
membership. `BE_21` R6 (deny by default) holds because there is no path that widens the scope: the
only `accountId` the controller can supply is the session's.

Injected: `FeedbackRequestQuery`, `AccountNamesService` — the narrowest contracts that cover the
need (`BE_05` R5).

### 4.4 Controller

A new `FeedbackController` on `v1/workspaces/:workspaceId/feedback`, one route, one use case
injected (`BE_07` R3). It converts `Date` to ISO at the boundary, as `feedback-request.controller.ts`
does, and declares `@ZodResponse`, `@ApiHeader(COOKIE_HEADER)` and the three failure responses.

It is a **new controller, not a third route on `FeedbackRequestController`**: the resource is
Feedback, not Feedback Requests, and `feedback-ask.controller.ts` set the precedent (0016 D8).

## 5. Web

**Changed 2026-10-14: it is a tab on Home, not a page.** PR #180 landed while the API half was
in review and rebuilt the signed-in app — the `(side-nav)` group is gone, `/feedback/sent` and
`/feedback/asks` are gone with it, and what they showed is now tabs on Home (`workspace`,
`shared`, `my-requests`, `waiting`). A fifth page in a layout that no longer exists is not an
option, so *Feedback for me* becomes the fifth tab. What it shows is unchanged.

```
app/(signed-in)/(member)/home/                                      #26
  _components/received-feedback-list.tsx    server; one entry per piece, newest first
  _components/received-feedback-list.test.tsx
  _lib/received-feedback.service.ts         'server-only'; cache(); cache: 'no-store'
  _lib/received-feedback.type.ts            the view model (FE_10 R6)
  _components/home-tabs.tsx                 + the tab's name and its panel
  _components/home-split-view.tsx           + the tab, in the personal column
lib/routes.constant.ts                      + 'received' in HOME_TABS
```

The tab is **last of the five**, after *Waiting for me*: what I asked for, what is asked of me,
then what came back. The address is `/home?tab=received`, which `ROUTES.homeTab` already builds and
`HomeSearchParams` already validates, so the tab survives a reload and a shared link (`FE_11` R7).
The day format is `lib/calendar-day.util.ts` (D8).

- **URL `/home?tab=received`** (`FE_11` R1/R7 — the URL is a contract, and the open tab belongs in
  it). The tab's name is the card's own words, *Feedback for me*.
- **Every file is a server component** (`FE_08` R1). There is nothing interactive on this screen —
  no form, no state, no event handler — so PR 2 adds no `'use client'` and no `useState`.
- **Read on the server, in the component that renders it** (`FE_09` R1), `cache: 'no-store'`
  (`FE_09` R2 — state the intent; R10 — one person's Feedback must never be served to another).
  Through the generated client only (`FE_10` R1/R2), mapped to a view model at the boundary (R6).
  One page of `pageSize: 100`, the same reading as `sent-requests.service.ts`: paging the screen
  waits until somebody has more than a hundred pieces of feedback.
- **Entry shape:** the Topic as `<h2>` (`subtitle-4`), *"From {giverName} · {day}"* with
  `<time dateTime>`, then the body. The body is up to 4,000 characters of free text written in a
  textarea, so it renders `whitespace-pre-wrap break-words` — line breaks are the writer's
  meaning. The surface is the `rounded-page bg-surface-overlay` row the other two lists use, **not**
  the `Card` atom — `Card` carries a titled, divided header for a screen that *is* one card, which
  is why `answer-ask-card.tsx` uses it and the lists do not. **PR 2 adds no component**
  (`FE_02` R8, `GEN_16` R1).
- **A Giver with no name** reads *"From a teammate"*, as `waiting-ask-list.tsx` already says of a
  Requester. It is never blamed on the Receiver.

  **Changed while building, from the `—` this design first wrote.** `sent-request-list.tsx` uses
  `—` because its line is `name : status`, a column where a dash reads as "no value". Here the
  name sits inside a sentence — *"From {name} · 11 Oct 2026"* — and *"From —"* reads as damage
  rather than as a missing Profile. The two existing lists already differ on this for the same
  reason, so this follows the prose one.
- **Empty state** (`FE_18`, `todo` — the index entry is the binding text): *"No one has written you
  feedback yet."* with a link to Home's form, *Ask a teammate for feedback* — the same pair
  `/feedback/sent` uses. Loading: inline `<Suspense>` with `Skeleton`. Errors: the root
  `app/error.tsx` boundary.
- **Accessibility** (`FE_06`): `<ul>`/`<li>` for the list, one heading per entry, `<time>` carrying
  the machine date, tone from tokens only (`FE_04`, `AGENTS.md` hard rule — no hardcoded design
  value). Nothing here takes focus or changes under the person.
- **No error-code table.** This screen only reads: `NOT_SIGNED_IN` is `requireMember()`'s redirect
  and `WORKSPACE_NOT_FOUND` is the session's problem, both already handled upstream. There is no
  `404` of its own — an empty page is a legitimate answer, not a missing resource (`FE_11` R6 does
  not fire).

## 6. `todo` convention entries interpreted

`AGENTS.md`: while an entry is `todo` the document does not exist and **the index entry is the
binding text**. Four bind this change, none in conflict, so "stop and ask" does not fire.

| Entry | Its binding text | How this change reads it |
| --- | --- | --- |
| `BE_14` Transactions and unit of work | `todo`; ADR 0031 is the interim | Not engaged — this change writes nothing and opens no transaction |
| `BE_16` Inter-module communication | index summary only | Unchanged: Identity's `AccountSummaryPort` stays the only way Feedback learns a name (ADR 0037) |
| `FE_16` Forms and validation | derive the form schema from the generated contract types | Not engaged — no form on this screen |
| `FE_18` Error handling and UI states | map backend codes; mandatory loading / empty / error states | §5's empty state, `<Suspense>` loading, root error boundary; no code table because the screen only reads |

`FE_07` R7 (a story per state) still does not apply — Storybook is #136, `Backlog`.

## 7. Tests

**API** (`bun test`, `BE_11`: named for the actor, the action and the outcome; ports substituted,
real domain objects; **no unit test for a projection query**, R9):

- `list-received-feedback.use-case.spec.ts`
  - a Member reads the Feedback written to them, newest first
  - **another Member's received Feedback is absent** — the refusal, not only the success
    (`BE_21` R10)
  - every Giver on the page is named in **one** `summariesOf` call (the N+1 guard, asserted on the
    fake's call count, as `list-sent-feedback-requests.use-case.spec.ts` does)
  - a Giver who has not introduced themselves reads as `null`
  - nobody has written to them → `{ items: [], total: 0 }`
- `account-names.service.spec.ts` (PR 0) — only if the extraction keeps logic worth a test:
  it de-duplicates ids and maps a missing Account to `null`. The two existing use-case specs
  already cover it through their own behaviour, so this is one small spec, not a re-test.

**Gherkin** (`@api`, `GEN_10`, in the existing `features/feedback-requests.feature`, steps in
`apps/api/test/steps/feedback.steps.ts`):

- a Member reads the Feedback they received, and sees what their teammate wrote
- Feedback written to another Member is not in this Member's list

**Web** (Vitest + Testing Library, `FE_14`: by role and accessible name, real component tree,
network mocked at MSW and nothing below it):

- `received-feedback-list.test.tsx` — entries render the Topic, the Giver, the day and the body;
  line breaks survive; a nameless Giver renders `—`; the empty state and its link
- `side-nav-links.test.tsx` — the third link exists and marks the current page

**Not written, deliberately:** no integration spec for the read. `BE_12`'s existing
`prisma-feedback-request.repository.integration.spec.ts` covers the write path and the answer race;
a projection with no logic earns no test (`BE_11` R9), and the ordering is one `orderBy` the Gherkin
scenario exercises end to end against a real Postgres anyway.

## 8. Execution plan

Three pull requests. Each is green on all six CI checks before the next starts.

| PR | Branch | Cards | Contents |
| --- | --- | --- | --- |
| 0 | `refactor/account-names-service` | — | D7: extract `namesOf` to `application/service/account-names.service.ts` — the first `application/service/` file on `main` — move both call sites, delete both copies. No behaviour change, no contract change |
| 1 | `feat/26-api-read-received-feedback` | #26 | `receivedBy()` on the query port + its Prisma read; `ListReceivedFeedbackUseCase`; `FeedbackController`; the DTO; the module wiring; unit tests; the two `@api` scenarios; regenerated contract |
| 2 | `feat/26-web-feedback-for-me` | #26 | the *Feedback for me* tab: list, service, view model, the tab wiring in `home-tabs` and `home-split-view`, `HOME_TABS`; web tests; two lines added to `seed-local.ts`'s printed addresses |

PR 0 is small and mechanical and exists because `GEN_16` R5 and `GEN_15` R2 both say a move is its
own change. **If you would rather not have a third PR**, say so and PR 1 carries the extraction with
the reason in its description — the rule it bends is a repository convention, and bending it in the
open is `GEN_01` R10's path, not a silent exception.

Per PR, in this order:

```bash
bun install                                   # only if the lockfile moved
turbo run check-types
bun run check:contract                        # PR 1 — regenerates packages/api; the diff is committed
bun run lint && bun run format
turbo run test --filter=api                   # PRs 0 and 1
turbo run test --filter=web                   # PR 2
bun run --cwd apps/api check-arch             # the BE_* specifier rules
```

PR 1 additionally, by hand, because CI runs neither suite:

```bash
docker compose up -d
bun run --cwd apps/api db:migrate:deploy
bun run --cwd apps/api test:bdd               # the two new @api scenarios
bun run --cwd apps/api test:integration       # unchanged by this work; run to prove it stayed green
```

Both need `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` in the
environment (`test:integration` needs the two `RESEND_*` as well; `test:bdd` fills those in itself).
A checkout's `.env` may predate them — copy the missing lines from `.env.example`.

The PM walk, after PR 2:

```bash
bun run dev
bun run --cwd apps/api db:seed                # prints the cookie and the addresses
```

The seed already writes two answers (`apps/api/scripts/seed-local.ts:179`, `:190`): the Owner asked
Ben about *Running the planning meeting* and Ben answered it, and the Owner answered Ben's ask about
*The way I write release notes*. So signed in as the Owner, `/feedback/received` shows **exactly one
entry** on first load — Ben's answer — and the piece the Owner wrote belongs on #27's screen, not
this one. That asymmetry is itself worth seeing during the walk. PR 2 adds the address to the list
the seed prints, beside *The answer* and *Still waiting*.

Board and brain, as the work lands:

- **#25 closed as superseded** by #26 when PR 2 merges, with a comment naming it — the call already
  made for #15, #23, #17 and #22.
- **#26 → `Testing`** on PR 2. The PM walk is owed before `Done`, and the board automation does not
  move cards (`STATE.md`, *Known incomplete*), so move it by hand.
- **No new glossary noun.** `Feedback`, `Giver`, `Receiver`, `Requested Feedback` and `Topic` are
  all rows already (`glossary.md:73–83`). Nothing to add to the brain's `glossary.md`.
- **One ADR here, `docs/adr/0042`:** *Feedback addressed to a Member is read by that Member and
  nobody else* — the rule D3 and D4 establish, which outlives this pull request and will be read
  again by #84 and #88 when other readers arrive. `ADR-0039` covers the *request*, not the Feedback.
- `STATE.md` gets the screen once #26 is walked, and still owes the two corrections `0016` §10
  named.

## 9. Risks and sequencing

| Risk | Handling |
| --- | --- |
| **PR #140 (#138, `FD-0017`) is open** and decides how the browser and the server call the API | PR 0 and 1 are API-only and untouched. PR 2 follows `main`'s pattern — `'server-only'` services for reads — which is what #140 ratifies. Ask for #140 to merge first; if it will not, PR 2 takes the rewrite with every other screen |
| **#29 (offered Feedback) reshapes this response** — `feedbackAskId` and `feedbackRequestId` become nullable, `origin` arrives | Additive on the wire (`GEN_08` R7). D5 and D6 are written so #29 widens rather than rewrites: no link off the Topic to break, and `topic` becomes nullable in the same change that makes Feedback without a request possible |
| **#27 (the Feedback I've given) wants the same route** | D2's path: add `?role=RECEIVED\|GIVEN`, default `RECEIVED`. The query port gains `givenBy()` beside `receivedBy()`; the use case takes the role. Published meaning unchanged |
| **The PM walk needs two real Accounts** — #74/#75 delivered them on 2026-10-13 | Not a blocker any more. The seed covers the single-Account path, and the cross-Member refusal is proved by the use-case spec and the `@api` scenario rather than by the walk |
| A teammate answers while the Receiver has the page open | Accepted: `no-store`, re-reads on navigation. Live updates are Epic #13's problem |
