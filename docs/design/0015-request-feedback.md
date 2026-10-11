# Technical design · FB-1 Ask teammates for feedback

**Tickets:** [#15](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/15) FB-0001
(form, mock) · [#20](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/20) FB-0002
(real picker) · [#21](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/21) FB-0003
(really send) · Epic [#7](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/7)
**Status:** accepted, 2026-10-11 · **Author:** naroebordin (with Claude)

---

## 1. Context

Epic #7 is the product — phase 1 of the vision is feedback culture — and none of it is built.
What exists is Auth and Workspace: real Google sign-in, a saved Profile, a real Workspace, real
Invitations by email, and a `/home` that names your Workspace and lists your teammates.

The board splits the first flow into three cards: a mock screen (#15), a real picker (#20), and
really saving (#21). **This design does all three as one vertical slice**, which is `GEN_04` R5
("build one vertical slice end to end before you widen it"). Two reasons the split costs more
than it saves here:

- `GET /v1/workspaces/{workspaceId}/members` already exists
  (`apps/api/src/modules/workspace/presentation/workspace-member.controller.ts:32`) and already
  returns `accountId`, `email`, `fullName`, `role`. #20 is therefore web-only — a service and a
  mapper, not a feature.
- #21 AC 2 says *"the confirmation still shows the request after a refresh"*. A mock-only #15
  would get an in-place confirmation panel that #21 then deletes. Building the slice once
  avoids writing a component in order to throw it away.

Scope facts from `ADR-0022`, through the Epic: **there are no Questions** — the Giver answers in
one free-text box — and the Requester chooses Visibility when sending, which is #83, not this.

## 2. Decisions

| # | Decision | Rejected | Why |
| --- | --- | --- | --- |
| D1 | URL `/feedback/request` for the form, `/feedback/requests/{requestId}` for the confirmation | `/requests/new`, `/request-feedback` | `FE_11` R1 — the URL is a contract. Leaves `/feedback/asks` (#17), `/feedback/sent` (#16), `/feedback/received` (#25) a shared prefix |
| D2 | Nav link in `site-navbar` | A second nav row; a link on `/home` only | #15 AC 1 wants the main navigation, and one bar is what the design draws |
| D3 | The confirmation is its own route reading the stored request | An in-place panel; URL params | #21 AC 2 — it must survive a refresh. Also the read #16/#23 will build on |
| D4 | Feedback identifies people by `accountId` | Workspace's `member.id` | Workspace's member ids are Better Auth's organization plugin's and are not published; `accountId` is already Identity's public identifier and already on the members response. `(workspaceId, accountId)` *is* the Member |
| D5 | The request body takes `giverAccountIds`, an array capped at 1 | A singular `giverAccountId` | The glossary already models one FeedbackRequest as N Asks. Raising the cap in #30 is additive; renaming a singular field would be breaking (`GEN_08` R7) |
| D6 | `visibility` is stored now, defaulted to `ONLY_ME` | Leave the column to #83 | Decided 2026-10-11. Most private default; #83 adds only the picker. **Interim — needs an ADR from kritpavin, raised on #83 and in the PR** |
| D7 | No `expiresAt` on an Ask yet | Add a nullable column now | #38/#39 own expiry and will bring their own migration (`BE_15` R4/R8). `PROJECT.md` §2: solve today's problem |
| D8 | Two pull requests, API first | One PR | `GEN_08` R8 — ship the contract change before the change that consumes it |

## 3. Domain model

Glossary rows this uses verbatim (`GEN_14`): **Feedback Request** (`FeedbackRequest`),
**Requester** (`requesterId`), **Ask** (`FeedbackAsk`, states `Pending`/`Answered`/`Expired`),
**Topic** (`Topic`), **Giver**, **Visibility**, **Member**, **Workspace**. No new noun, so
nothing to add to the brain's `glossary.md` before merge.

```
FeedbackRequest                      aggregate root — one consistency boundary (BE_04 R8)
  id                 uuid v7         GEN_11 R1
  workspaceId        string          no FK — BE_03 R7
  requesterAccountId string          the Member who asked; becomes the Receiver
  topic              Topic           VO, trimmed, non-empty
  visibility         Visibility      VO: ONLY_ME | SELECTED_PEOPLE | EVERYONE (D6)
  asks               FeedbackAsk[]   created with the request, changed only through the root
  createdAt                          store-assigned, outside the domain (BE_04 R9)

FeedbackAsk                          inside the aggregate, never saved on its own
  id                 uuid v7
  giverAccountId     string          the Member being asked
  status             AskStatus       VO; starts Pending
```

Rules the domain enforces, not the use case (`BE_04` R1, `BE_05` R2):

- `Topic.of()` trims, collapses repeated spaces and refuses empty — `TopicEmptyError` (domain). It caps a Topic at **200 graphemes** (`TopicTooLongError`): the glossary says "a short text" and names no number, so 200 is this release's reading, in a `text` column so raising it costs no migration.
- `FeedbackRequest.send()` is the only factory, and every rule holds before the aggregate exists: at least one Giver (`NoGiversToAskError`), never the Requester (`CannotAskYourselfError`), never the same Giver twice (`GiverAlreadyAskedError`). There is no half-built request to save.
- `AskStatus` is a value object, not a compared string (`BE_04` R6). Its transitions
  (`answered`, `expired`) belong to #24 and #39; today it only starts `Pending` and answers
  `isPending()`. **A deliberate reading of R6**: declaring transitions nothing can trigger yet
  would be code with no caller.

## 4. API — `apps/api/src/modules/feedback/`

Scaffolded whole, per `BE_01` R10. Folders with no file are left out (R3), so there is no
`domain/port/` and no `application/adapter/` — nothing outside Feedback calls it yet.

```
feedback.module.ts                                 Nest module; binds ports (BE_02 R8)
index.ts                                           exports FeedbackModule and nothing else (BE_03 R2)
domain/
  entity/feedback-request.entity.ts                aggregate root + its Asks, snapshot()
  value-object/topic.vo.ts
  value-object/ask-status.vo.ts
  value-object/visibility.vo.ts
  repository/feedback-request-repository.port.ts   abstract class (BE_06 R1)
  feedback-request.errors.ts                       TopicEmptyError, TopicTooLongError, CannotAskYourselfError, GiverAlreadyAskedError, NoGiversToAskError, AskStatusInvalidError, VisibilityInvalidError
application/
  use-cases/send-feedback-request.use-case.ts      the command
  use-cases/get-feedback-request.use-case.ts       the query
  query-port/feedback-request.query-port.ts        the read projection (BE_06 R7)
  types/feedback-request.types.ts                  FeedbackRequestView and friends
  feedback-request.errors.ts                       GiverNotInWorkspaceError, FeedbackRequestNotFoundError, WorkspaceNotFoundError
infrastructure/
  mapper/feedback-request.mapper.ts                record ↔ entity, both ways (BE_06 R4)
  repository/prisma-feedback-request.repository.ts
  query/prisma-feedback-request.query.ts
presentation/
  dto/send-feedback-request.dto.ts
  dto/get-feedback-request.dto.ts
  dto/path-params.dto.ts                           both path shapes (BE_08 R10)
  workspace-member.guard.ts                        Feedback's own tenant guard — see below
  feedback-request.controller.ts
```

**Feedback declares its own `WorkspaceMemberGuard`** rather than reusing Workspace's. The plan
assumed it could reuse it; the architecture check refuses both routes to it — a barrel
re-exporting `presentation/` trips `BE_02` R2, and importing it directly trips `BE_03` R4 — and
`AGENTS.md` §6 forbids weakening a guardrail to make a change pass. Feedback's guard runs over
the published `WorkspaceMembershipPort` and answers the same `WORKSPACE_NOT_FOUND`, so the two
are indistinguishable to a caller. Recorded in `docs/adr/0037`, which also notes that the
convention set has no home for a shared tenant guard — a candidate improvement upstream.

Also changed:

- `apps/api/src/app.module.ts` — register `FeedbackModule`.
- `apps/api/src/modules/workspace/` — a new published port, mirroring Identity's
  `HasProfilePort` exactly: `domain/port/workspace-membership.port.ts` declaring
  `WorkspaceMembershipPort.isMemberOf({ workspaceId, accountId }): Promise<boolean>`,
  implemented by `application/adapter/workspace-membership.adapter.ts` over the existing
  `MembershipQuery`, bound in `workspace.module.ts`, exported from `index.ts`. `BE_03` R5 — the
  port lives in the provider and is named for the fact the consumer wants.
- `apps/api/prisma/schema.prisma` + one migration (§5).

### 4.1 `SendFeedbackRequestUseCase`

```ts
interface SendFeedbackRequestInput {
  readonly workspaceId: string;        // from the path, already guarded
  readonly requesterAccountId: string; // from the session, never from the body
  readonly topic: string;
  readonly giverAccountIds: readonly string[];
}
interface SendFeedbackRequestResult { readonly id: string; }
```

```
execute(input)
  request = FeedbackRequest.open({ id: uuidv7(), workspaceId, requesterAccountId,
                                   topic: Topic.of(input.topic),
                                   visibility: Visibility.onlyMe() })      // D6
  for each giverAccountId:
     unless workspaceMembershipPort.isMemberOf({ workspaceId, accountId })  // #21 AC 3
        throw new GiverNotInWorkspaceError()
     request.ask(giverAccountId)                                            // domain decides
  unitOfWork.run(() => feedbackRequestRepository.save(request))             // BE_05 R8
  return { id: request.snapshot().id }
```

The membership checks run as one pass before the write, not inside a loop over a query
(`BE_06` R9) — with the cap at 1 there is one check; #30 turns the port call into a batch
`membersOf(workspaceId, accountIds)` rather than a query per address.

Injected: `FeedbackRequestRepository`, `WorkspaceMembershipPort`, `UnitOfWork`, and an id
source. Ids come from a `uuid` v7 call in the use case, kept injectable for determinism
(`BE_11` R8) the way `Clock` already is in `send-invitations.use-case.ts`.

### 4.2 `GetFeedbackRequestUseCase`

A query (`BE_05` R3/R4): reads `FeedbackRequestQuery.ofWorkspace(workspaceId, requestId)`,
never loads the aggregate. Answers `FeedbackRequestNotFoundError` when the id is not in **this**
Workspace — the same shape as `WORKSPACE_NOT_FOUND`, so a request in someone else's Workspace is
indistinguishable from one that does not exist. Enriches each Ask's Giver with
`AccountSummaryPort.summariesOf()` from Identity's barrel, exactly as
`list-workspace-members.use-case.ts` does, so the confirmation can name the person.

### 4.3 Routes

Both under `/v1/workspaces/:workspaceId/feedback-requests`, behind `WorkspaceMemberGuard`
(`BE_21` R3 — a non-Member gets `404 WORKSPACE_NOT_FOUND`), one use case injected per route
(`BE_07` R3):

| Verb | Path | Body / result | Codes |
| --- | --- | --- | --- |
| `POST` | `…/feedback-requests` | `{ topic, giverAccountIds }` → `{ id }` | `201`; `400 REQUEST_INVALID`, `TOPIC_EMPTY`, `TOPIC_TOO_LONG`, `CANNOT_ASK_YOURSELF`, `GIVER_ALREADY_ASKED`, `GIVER_NOT_IN_WORKSPACE`; `401 NOT_SIGNED_IN`; `404 WORKSPACE_NOT_FOUND` |
| `GET` | `…/feedback-requests/{requestId}` | the request, its Topic, its Asks with each Giver's name and status | `200`; `401`; `404 FEEDBACK_REQUEST_NOT_FOUND` |

`BE_07` R1 (plural resource noun), R4 (version in the path), R7 (no envelope), R10 (every type
declared so it reaches the generated spec). No pagination — neither route returns a collection
of its own; `BE_07` R5 applies to #16's list. No idempotency key (R8): a duplicate send creates
a second request, which is what asking twice means.

Request DTO (`BE_08` R1/R3/R4/R10): `z.strictObject({ topic: z.string(), giverAccountIds: z.array(z.uuid()).min(1).max(1) })`. Only the shape is checked there; trimming, the length limit and "not blank" belong to `Topic`, and "not yourself" and "not twice" to the aggregate, each with its own code (`BE_08` R7).

Every refusal is `400` or `404`: `shared/presentation/coded-error.filter.ts` is the one place a category becomes a status, and its five categories hold no `422`. Adding one is a deliberate change to that map, which this change does not make.

Errors are classes with stable codes on `CodedError` (`BE_09` R2/R3/R6) and reach the wire
through the existing `CodedErrorFilter` — nothing throws an HTTP exception below the controller
(R5), and the category→status map is not touched.

## 5. Schema and migration

Two tables, Feedback's own, in one migration (`BE_15` R2 — one module's tables):

```prisma
/// A Member asking other Members for Feedback on a Topic (glossary: Feedback Request).
model FeedbackRequest {
  id                 String       @id
  /// Workspace's id, held without a foreign key: Feedback never joins another module's
  /// tables (BE_03 R7).
  workspaceId        String
  /// The Account of the Member who asked. No foreign key, same reason.
  requesterAccountId String
  topic              String
  /// Interim: always ONLY_ME until #83 lets the Requester choose (ADR pending).
  visibility         Visibility   @default(ONLY_ME)
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt
  asks               FeedbackAsk[]

  @@index([workspaceId, requesterAccountId])
  @@map("feedback_request")
}

/// One Member being asked, inside a Feedback Request (glossary: Ask).
model FeedbackAsk {
  id                String          @id
  feedbackRequestId String
  feedbackRequest   FeedbackRequest @relation(fields: [feedbackRequestId], references: [id], onDelete: Cascade)
  giverAccountId    String
  status            AskStatus       @default(PENDING)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@unique([feedbackRequestId, giverAccountId])
  @@index([giverAccountId, status])
  @@map("feedback_ask")
}

enum Visibility { ONLY_ME SELECTED_PEOPLE EVERYONE }
enum AskStatus  { PENDING ANSWERED EXPIRED }
```

Named `create_feedback_request`; Prisma Migrate owns the prefix (`BE_15` R1/R7). Rollback, in
the migration's description (R6): both tables are new and empty, so dropping them is the
rollback. Existing rows: none — nothing to migrate (R8). The `giverAccountId, status` index is
for #18 ("my Asks waiting"), the only read that will not have a request id.

## 6. Web — the two routes

```
app/(signed-in)/feedback/request/
  page.tsx                                  server; requireMember(); hero + card
  _components/request-feedback-hero.tsx
  _components/request-feedback-card.tsx     server; Suspense around the picker's data
  _components/request-feedback-form.tsx     'use client' — the one interactive subtree
  _components/member-picker.tsx             labelled Select over real teammates
  _lib/teammates.service.ts                 'server-only'; reads the members endpoint
  _lib/teammate.type.ts                     the view model (FE_10 R6)
  _lib/request-feedback-actions.service.ts  'use server'; POSTs, then redirects
  _lib/request-feedback-state.type.ts
app/(signed-in)/feedback/requests/[requestId]/
  page.tsx                                  the confirmation, re-read on every load
  _components/feedback-request-summary.tsx
  _lib/feedback-request.service.ts          'server-only'; reads one request
  _lib/request-params.schema.ts             validates the segment (FE_11 R4)
```

Modified: `apps/web/lib/routes.constant.ts` (`feedback.request`,
`feedback.requestById(id)`), `apps/web/components/organisms/site-navbar.tsx` and its test (a
`<nav>` with one link, rendered only when `session` is set).

### 6.1 Reading the teammates — #20

`teammates.service.ts` copies `home/_lib/members-and-invitations.service.ts` almost exactly:
`'server-only'`, `apiClient().GET('/v1/workspaces/{workspaceId}/members', …)` with
`cache: 'no-store'` (`FE_09` R1/R2 — who is in the Workspace changes the moment someone
accepts, and `FE_09` R10 forbids caching one person's data where another could read it), one
page of 100 because a Workspace holds 20–50 people, `unwrap()` for the error envelope, then a
map to the view model:

```ts
export type Teammate = { readonly accountId: string; readonly name: string };
// fullName is null until a Member has introduced themselves — fall back to the email.
```

Filtered: the signed-in person themselves, by email, the way `/home` already does — the session
carries `email`, not `accountId` (`apps/web/lib/session/current-account.type.ts`). #20's other
two criteria need nothing: another Workspace's Members cannot appear, because the endpoint is
scoped by the guard, and **Deactivate does not exist yet** — there is no status on `member`, so
"deactivated Members do not appear" is vacuously true today. Said plainly on the card rather
than ticked as if it were built.

### 6.2 Sending — #21

`request-feedback-actions.service.ts` is a server action (`FE_09` R4), treated as a public
endpoint (R5): it re-reads the session with `requireMember()` rather than trusting anything the
browser sent, validates with Zod, takes the Workspace from the session — never from the body —
and branches on the API's error **code**, never a message (`FE_10` R7). Shape copied from
`invite-teammates/_lib/invitation-actions.service.ts`, including its `redirect`-outside-the-
`try` comment, because `redirect` works by throwing.

On success it redirects to `ROUTES.feedback.requestById(id)`. Error codes map to copy:

| Code | What the person reads |
| --- | --- |
| `GIVER_NOT_IN_WORKSPACE` | "That teammate is no longer in your Workspace." |
| `CANNOT_ASK_YOURSELF` | "You can't ask yourself for feedback." |
| `TOPIC_REQUIRED` | handled client-side first; same message on the field |
| `NOT_SIGNED_IN` → `/signin`, `WORKSPACE_NOT_FOUND` → `/home` | redirect, not a message |
| anything else | "We couldn't send your request. Please try again." |

### 6.3 The form

`'use client'` on `request-feedback-form.tsx` only (`FE_08` R1/R2/R3); the page, the hero and
the card stay server components. `useActionState` over the server action, as
`create-workspace-form.tsx` does, with both fields controlled so what was typed survives a
refusal. `Send` is disabled while either field is empty or while sending, so a double click
cannot send twice; validation still runs on submit, because a disabled button explains nothing
(`FE_06`).

Component props (`FE_05` R1/R2/R3/R5):

```ts
export type MemberPickerProps = {
  teammates: readonly Teammate[];
  value: string | null;
  errorMessage?: string;
  onChange: (accountId: string) => void;
};
```

`MemberPicker` wraps the existing `Select` atom, names the Radix trigger with a `Label` and
`htmlFor` against a `useId` id, and sets `aria-invalid` + `aria-describedby` on it — the same
contract `TextField` already keeps. Empty state: when the Workspace has no other Member, the
picker is replaced by a line pointing at **Invite your teammates**, not a disabled empty select.

Every new file starts route-private (`FE_01` R3); nothing is promoted to `components/`.
`MemberPicker` moves up the ladder when #30 or #28 actually imports it (R4). It names a domain
concept, which `FE_02` R4 allows at organism level — precedent:
`register/create-workspace/_components/team-size-options.tsx`.

All styling is token roles only (`FE_03`, `FE_04` R1/R2) — no arbitrary values, no `dark:` in a
component.

### 6.4 The confirmation

`/feedback/requests/[requestId]/page.tsx` validates the segment with Zod before using it
(`FE_11` R4), reads the request server-side, and renders "You asked {name} for feedback on
{topic}" with the Ask's status. A refresh re-reads it, which is #21 AC 2. A request id from
another Workspace answers `404` from the API, which the page turns into `notFound()` (`FE_11`
R6). Failures fall to the existing root `apps/web/app/error.tsx` — the repo keeps one error
boundary there rather than per-route files, and slow reads get an inline `<Suspense>` with a
`Skeleton`, as `/home` does, rather than a `loading.tsx`.

## 7. `todo` convention entries interpreted

`AGENTS.md`: while an entry is `todo` the document does not exist and **the index entry is the
binding text**. Four bind this change:

| Entry | Its binding text | How I read it |
| --- | --- | --- |
| `BE_16` Inter-module communication | index summary only | Read as the pattern already in the repo: a port declared in the provider's `domain/port/`, an adapter in its `application/adapter/`, exported from the barrel, imported only in the consumer's module file (`BE_03` R5/R10). Identity→Workspace already works this way (`HasProfilePort`, `ProfileNamePort`, `AccountSummaryPort`); Workspace→Feedback copies it. Written up as `docs/adr/0037` because it also decides how one module's rows name another's data |
| `BE_14` Transactions and unit of work | `todo`, but **ADR 0031 is the interim** | One `UnitOfWork.run()` per use case, repositories joining through `PrismaTransactionContext`. No `serializeOn` key: unlike creating a Workspace, two concurrent sends are two legitimate requests |
| `FE_16` Forms and validation | "deriving the form schema from the generated contract types — the backend stays the source of truth" | Now satisfiable, and that is part of why the slice is worth doing: the action's input schema derives from the generated contract types in `@repo/api`, not from a hand-written shape |
| `FE_18` Error handling and UI states | "mapping the backend error codes from `BE_09`…, mandatory loading / empty / error / partial states" | The code→copy table in §6.2; empty state in §6.3; loading via `<Suspense>`; error via the root boundary |
| `FE_22` Frontend coding style | React idioms on top of `GEN_07` | Followed through `GEN_07` plus the register-flow idiom |

None conflict, so `AGENTS.md`'s "stop and ask if two entries conflict" does not fire.
`FE_07` R7 (a story per state) does not apply: `PROJECT.md` lists no story tool as present —
Storybook is #136, Backlog.

## 8. Tests

**API** (`bun test`, `BE_11`): named for actor, action and observable outcome; ports
substituted, real domain objects (R5); no test for the projection query (R9).

- `topic.vo.spec.ts` — trims; refuses empty and whitespace-only
- `visibility.vo.spec.ts`, `ask-status.vo.spec.ts` — accepted values, rejected strings
- `feedback-request.entity.spec.ts` — opening with a Topic creates one Ask per Giver, all
  `Pending`; asking yourself is refused; a duplicate Giver is refused
- `request-feedback.use-case.spec.ts` — a Requester asks a teammate and the request is saved
  with one Ask; a Giver outside the Workspace is refused and **nothing is saved**; a blank Topic
  is refused before any port is called
- `get-feedback-request.use-case.spec.ts` — a request in another Workspace answers not-found
- `prisma-feedback-request.repository.integration.spec.ts` (`BE_12`, named for the suite that
  collects it) — saves and reloads the aggregate with its Asks. Needs the compose Postgres
  migrated; `test:integration` runs nothing automatically, so §11 runs it by hand and the PR
  says whether it ran

**Web** (Vitest + Testing Library, `FE_14`): by role and accessible name, real `userEvent`,
network mocked at MSW and nothing below it (R4), server actions replaced at their module (R6).

- `request-feedback-form.test.tsx` — renders named controls; submit with nothing → both
  messages, action not called; Topic-only and person-only → one message each; whitespace Topic
  counts as empty; valid submit calls the action once with the chosen `accountId` and the
  trimmed Topic; the API's refusal renders its copy and keeps what was typed; focus lands on
  the first field in error
- `member-picker.test.tsx` — placeholder, chosen, invalid (name, announced state, message),
  picking calls `onChange` once; the empty-Workspace state points at inviting
- `teammates.service.test.ts` — excludes the signed-in person; falls back to the email when
  `fullName` is `null`
- `request-feedback-actions.service.test.ts` — each error code maps to its copy or its redirect
- `[requestId]/page.test.tsx` — names the Giver and the Topic; a 404 renders not-found
- `site-navbar.test.tsx` — the link shows for a session, not without one

## 9. What this does not settle

- **Visibility needs an ADR.** D6 stores `ONLY_ME` as an interim. `PROJECT.md` §5 forbids
  settling a load-bearing decision alone, so this one is raised on #83 and in the PR, for
  kritpavin. The column exists either way; only the default is interim.
- **No brain edit.** `FeedbackRequest`, `Ask`, `Topic`, `Requester`, `Giver` and `Visibility`
  are already rows in `glossary.md`. No new noun, so nothing flows back before merge.
- **One code ADR is worth writing**: that Feedback identifies people by `accountId` and holds no
  foreign key into Workspace's tables (D4). It is the first module to store another module's id,
  and #41 and every later Feedback card build on it. Drafted as `docs/adr/00NN` in the API PR —
  the number is taken at the time, since `0020`–`0022` are already duplicated (`STATE.md`,
  *Known incomplete*).
- **Nothing about Asks being answered** (#24), listed (#16/#23), seen by the Giver (#17/#18),
  expiring (#38/#39), or visible to others (#83).

## 10. Risks

| Risk | Mitigation |
| --- | --- |
| No Figma frame for this screen | Built from tokens in the register-flow idiom; the PR names which states were invented |
| The slice closes three cards in two PRs, so the PM loses the mock-first walk | The walk still happens — on real data, in §11's manual steps. Said on the cards |
| `visibility` default turns out wrong | One enum column, no rows in production (nothing is deployed with Feedback yet); changing it before launch is a migration with nothing to backfill |
| `giverAccountIds` capped at 1 looks like dead generality | It is the glossary's own 1:N; #30 raises the cap and adds nothing |
| Navbar change touches every page | One link behind a session check, covered by the navbar's own test |
| #48 (Thai/English) is in progress and will touch this copy | English only; every string sits in the route folder or the action's map, where #48 finds them in one place |

## 11. Verification

API PR:

```bash
cd apps/api && bun test src/modules/feedback
bun run check:contract          # regenerate and diff — the Contract CI job runs the same
turbo run check-types --filter=api
bun run lint
# integration, needs the compose Postgres up and migrated:
turbo run test:integration --filter=api
```

Web PR:

```bash
turbo run test --filter=web
turbo run check-types --filter=web
bun run lint
bun run dev                     # api :3000, web :3001
```

Manual walk, both tickets' *How to check it*, against real data: sign in → **Request feedback**
in the navbar → the picker lists the real Members of the Workspace and not yourself → pick one,
type a Topic, Send → the confirmation names the person and the Topic → **refresh: it is still
there** → `GET` the same id as a different Workspace's Member → 404. Then Send with each field
missing, and with a Topic of only spaces.

## 12. Delivery

| PR | Branch | Contents |
| --- | --- | --- |
| 1 | `feat/21-feedback-request-api` | `feedback` module, migration, two routes, Workspace's `WorkspaceMembershipPort`, ADR for D4, regenerated `packages/api` |
| 2 | `feat/15-request-feedback-form` | the two web routes, the real picker, the navbar link, `routes.constant.ts` |

Conventional Commits with the ticket in the scope (`INFRA_08` R3): `feat(21): …`,
`feat(15): …`. One logical change per commit (R4). Branch first; no commit or push unless asked.
