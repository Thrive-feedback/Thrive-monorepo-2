# Technical design · FB-1/FB-2 See what I asked, see what is waiting, answer it

**Tickets:** [#16](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/16) FB-0005
(my real sent requests) · [#18](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/18)
FB-0007 (my real Asks waiting) · [#24](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/24)
FB-0009 (send a real answer) · Epic [#7](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/7)
**Supersedes the mock cards:** #23 (FB-0004), #17 (FB-0006), #22 (FB-0008)
**Status:** draft, 2026-10-12 · **Author:** naroebordin (with Claude) · **Follows:** `docs/design/0015-request-feedback.md`

> **Since 2026-10-22:** Topic is retired (brain `ADR-0039`, ADR 0054). Read *Topic* below as the
> request's **Request message**, and *body* as the **Feedback message**. Feedback no longer holds
> or returns a Topic of its own. This record is left as it was decided.
>
> **Since 2026-10-31:** an Ask does not expire (brain `ADR-0049`). `AskStatus` is `PENDING` or
> `ANSWERED`, and #38/#39 are not coming. This record is left as it was decided.

---

## 1. Context

`docs/design/0015-request-feedback.md` built the send half: a Requester asks one Member of their
Workspace for Feedback on a Topic, and `POST`/`GET` on `/v1/workspaces/{workspaceId}/feedback-requests`
store it and read one back. Merged 2026-10-11 as PRs #151 (API) and #152 (web); #15, #20 and #21 are
`Testing` on the board, PM walk still owed.

Nothing reads it back yet. A Giver cannot see that they were asked, cannot answer, and the Requester
cannot see an answer. These three cards close that loop:

| Card | What a person can do afterwards |
| --- | --- |
| #16 | Open **My requests** and see what I really sent, and where each Ask stands |
| #18 | Open **Waiting for me** and see the real Asks addressed to me |
| #24 | Open one, write one answer, send it — and the Requester reads it |

`#24` AC calls this "the first loop that works: ask, see, answer, read". It is the first point at
which Thrive does something a customer would pay for.

**The mock cards are skipped again**, as #15 was. `GEN_04` R5 wants one vertical slice end to end;
the design of 0015 §1 gives the reason in full, and it holds harder here — #23's sample list and
#17's sample list are files that #16 and #18 delete on the same day, and #22's answer screen would
be written to throw away a `useState` that #24 replaces with a server action. Each mock card is
closed as superseded by its real card, with a comment, the way #15 was.

Scope facts from `ADR-0022`, through the Epic: **no Questions and no ratings** — the Giver answers
in one free-text box; Feedback **always shows the Giver's name**; **Praise and Advice are not
fields**, they are writing guidance (#40). Expiry is #38/#39 and is not built, so nothing ever
reaches `EXPIRED` yet.

## 2. A defect found while reading, fixed in PR 1

`GetFeedbackRequestUseCase` takes `{ workspaceId, requestId }` and nothing else
(`apps/api/src/modules/feedback/application/use-cases/get-feedback-request.use-case.ts:30`). The
controller passes only the path parameters
(`apps/api/src/modules/feedback/presentation/feedback-request.controller.ts:93`). The guard proves
the caller is *a* Member of that Workspace, not that the request is theirs.

So **any Member of a Workspace can read any Feedback Request in it** — its Topic and everybody
asked — given its id. Every request stored today is `visibility = ONLY_ME` (0015 D6), which says
exactly the opposite. Ids are UUIDv7, so they are not enumerable, but v7 is time-ordered and an id
is handed to the browser on every send; "hard to guess" is not the control `ONLY_ME` promises.

Severity: medium today (one Workspace, one team, no customer data), rising the moment a Workspace
has people who are not colleagues. It is a one-argument fix and belongs in PR 1 because #16's list
is the thing that makes request ids plentiful.

**No separate Bug card** (decided 2026-10-12): the fix ships inside PR 1, which is the change that
makes it matter. PR 1's description names it under its own heading so the fix is reviewed as a fix
and not read as part of #16, and `docs/adr/` records the read rule it establishes — a Feedback
Request is readable by its Requester and its Givers, nobody else — because that rule outlives this
pull request.

**Fix:** the use case takes the caller's `accountId` and answers `FEEDBACK_REQUEST_NOT_FOUND`
unless the caller is the Requester **or** the Giver of one of its Asks — the two people who must
see it (#24 needs the Giver to read the Topic before answering). Same code as "does not exist", so
nothing is probeable (`BE_21`; the existing error's own doc comment already states that intent).

## 3. Decisions

| # | Decision | Rejected | Why |
| --- | --- | --- | --- |
| D1 | Feedback — the answer — is its own table `feedback`, written through the `FeedbackRequest` aggregate, read through a query port | A `FeedbackAsk.answerBody` column | Glossary has **Feedback** as a thing with a Giver, a Receiver and an origin, not a column on an Ask. #25–#29 list Feedback with no request in sight. One table from the start costs one migration either way |
| D2 | `FeedbackRequest` stays the consistency boundary: `answerAsk()` flips the Ask to `ANSWERED` **and** returns the new `Feedback`; one repository saves both in one transaction | Two aggregates with two repositories; a `FeedbackRepository` now | `BE_04` R8 — "this Ask is not answered twice" is a rule about the request. The aggregate load stays cheap: it loads Asks, never answer bodies. **Known future split:** #29 (Offered Feedback) has Feedback with no Ask and no request; Feedback becomes its own root then, with its own repository. Written now so that is a planned move, not a surprise |
| D3 | The second answer is refused by a **unique index** on `feedback.feedbackAskId`, not only by the domain check | Domain check alone; an advisory lock on the ask id | Check-then-act across two requests is a race the domain cannot see. The index is the only defence that holds under concurrency; the domain check is what turns the common case into a clean `409`. No `serializeOn` key (ADR 0031): a unique index is cheaper than a lock and already exact |
| D4 | No `origin` column and no `FeedbackOrigin` enum yet; a Feedback row has a non-null `feedbackAskId`, which *is* Requested Feedback | Add the enum now, as the glossary names it | 0015 D7, and `PROJECT.md` §2 — solve today's problem. #29 makes `feedbackAskId` nullable and adds the enum in one migration; widening a NOT NULL is cheap and non-breaking |
| D5 | Visibility is **not** copied onto the Feedback row; it stays on the request | Snapshot `visibility` per Feedback | The glossary gives Visibility to the Requester, per request, "never changed afterwards". One home, one fact. #84 reads it from the request |
| D6 | Answer body is a `FeedbackBody` value object: trimmed, non-empty, capped at **4,000 graphemes**, stored `text` | No cap; a `varchar(n)` | Same reading as `Topic`'s 200 (0015 §3): the glossary says "one free-text answer" and names no number. 4,000 is roughly four screens of writing. **Accepted by naroebordin, 2026-10-12, as this release's reading** — an engineering reading, not a product decision, so it is still kritpavin's to overturn; `text` means doing so costs no migration |
| D7 | Answering is `POST …/feedback-asks/{askId}/answers` → `201 { feedbackId }` | `PATCH …/feedback-asks/{askId}` with `{ status, body }` | Answering creates a thing (`BE_07` R1/R2); it does not edit a status field. The status flip is a consequence the domain owns, not a field a client sets |
| D8 | `feedback-asks` is its own top-level collection under the Workspace, with its own controller | `…/feedback-requests/{requestId}/asks/{askId}` | #18 is the one read that has **no request id** — it is "the Asks for me", across requests. The schema's `@@index([giverAccountId, status])` was already added for it (0015 §5). A Giver who has not seen the request cannot be asked to name it in a URL |
| D9 | `pageQueryShape` / `pageResultShape` move from `modules/workspace/presentation/dto/page.dto.ts` to `shared/presentation/dto/page.dto.ts`; Workspace imports from there | Duplicate the shape inside Feedback; import Workspace's | Importing it trips `BE_03` R4 (never reach into another module's `presentation/`) — the same wall that made Feedback declare its own `WorkspaceMemberGuard` (ADR 0037). Duplicating it means two definitions of one wire contract (`BE_07` R5 wants one). `shared/presentation/dto/` already holds `cookie-header.dto.ts` and is where a cross-module wire shape belongs. Cost: a Feedback PR touches Workspace's imports — mechanical, no behaviour |
| D10 | The Requester reads answers through the **existing** `GET …/feedback-requests/{requestId}`, each Ask gaining `answer` — `{ body, answeredAt }` or `null`. The answers are **their own query** (`answersInRequest`), read beside the request rather than joined onto every Ask row | A separate `GET …/feedback` route; a join carried by both reads | #24 AC 3 is "open it and read what B wrote" — that is this screen. A Giver sees only their own Ask's answer; the Receiver sees all of them (§5.4). The list of sent requests sends `answer: null` and says so: a page of twenty requests would otherwise carry twenty answers nobody is reading yet |
| D11 | Four pull requests: API then web, for #16+#18 together, then API then web for #24 | One PR per card; one PR for everything | `GEN_08` R8 — the contract change ships before what consumes it. #16 and #18 are one API surface (one query port, one enrichment, one guard) and splitting them doubles the review of the same file. #24 carries the migration and the only write, so it reviews alone |

**Reviewed 2026-10-12 (naroebordin).** D6's 4,000 accepted as the interim; §2's defect is fixed
inside PR 1 rather than filed as its own Bug card; #23, #17 and #22 are closed as superseded. The
Topic's 200 stays as 0015 left it. Both numbers are still readings of "a short text" / "one
free-text answer" and are noted on #24 for kritpavin.

> **Superseded, 2026-10-14:** the Ask no longer has a page of its own. `/feedback/asks/{askId}` is gone; an Ask opens in a dialog over Home at `/home?tab=waiting&ask={askId}`, and answering it goes back there. Its files now sit under `app/(signed-in)/(member)/home/`.

## 4. Domain model

New, in `modules/feedback/domain/`:

```
Feedback                             an entity created by FeedbackRequest.answerAsk(), stored in its own table
  id                 uuid v7         GEN_11 R1
  workspaceId        string          copied from the request; no FK out of the module — BE_03 R7
  feedbackRequestId  string
  feedbackAskId      string          unique — D3
  giverAccountId     string          the Member who wrote it
  receiverAccountId  string          the Requester, taken from the aggregate, never from the client
  body               FeedbackBody    VO — trimmed, non-empty, ≤ 4,000 graphemes (D6)
  createdAt                          store-assigned (BE_04 R9)

FeedbackBody                         VO · FeedbackBodyEmptyError, FeedbackBodyTooLongError
```

Changed:

```
AskStatus     gains `answered()`: PENDING → ANSWERED. Still no EXPIRED transition (#39 owns it).
FeedbackAsk   gains `answer()` — returns the answered Ask; refuses when not Pending.
FeedbackRequest.answerAsk({ askId, giverAccountId, feedbackId, body }) : Feedback
```

`answerAsk` is the only way an Ask changes:

1. no Ask in this request with that id **and** that Giver → it answers **`null`**;
2. the Ask is not `Pending` → `AskAlreadyAnsweredError` (`conflict` → `409`);
3. otherwise the Ask becomes `ANSWERED` and the Feedback comes back, with `receiverAccountId`
   read off the aggregate's own `requesterAccountId` — never off anything a client sent.

**Built as `null`, not as a thrown not-found** (changed from the plan): deciding what a caller is
told about an Ask that is not theirs belongs to the use case, which answers
`FEEDBACK_ASK_NOT_FOUND` the way every scoped read in this module does. The aggregate importing an
application error would also invert the layers (`BE_02` R3). The repository load is scoped to
`(workspaceId, askId, giverAccountId)` anyway — `findByAskOfGiver` — so `null` from the aggregate
means the row changed under the read.

## 5. API

```
modules/feedback/
  domain/
    entity/feedback.entity.ts                        NEW
    value-object/feedback-body.vo.ts                 NEW
    entity/feedback-ask.entity.ts                    + answer()
    entity/feedback-request.entity.ts                + answerAsk()
    value-object/ask-status.vo.ts                    + Answered, answered()
    feedback-request.errors.ts                       + FeedbackBodyEmptyError, FeedbackBodyTooLongError, AskNotAnswerableError
    repository/feedback-request-repository.port.ts   + findByAskId(), saveAnswer()
  application/
    use-cases/list-sent-feedback-requests.use-case.ts   NEW  #16
    use-cases/list-my-feedback-asks.use-case.ts         NEW  #18
    use-cases/get-feedback-ask.use-case.ts              NEW  #22/#24 screen
    use-cases/answer-feedback-ask.use-case.ts           NEW  #24
    use-cases/get-feedback-request.use-case.ts          + caller, + answers (§2, D10)
    query-port/feedback-request.query-port.ts           + sentInWorkspace(), askInWorkspace(), asksFor()
    types/feedback-request.types.ts                     + SentRequestView, MyAskView, AnswerView
    feedback-request.errors.ts                          + AskNotFoundError, AskAlreadyAnsweredError
  infrastructure/
    query/prisma-feedback-request.query.ts              + three reads
    repository/prisma-feedback-request.repository.ts    + findByAskId, saveAnswer
    mapper/feedback.mapper.ts                        NEW
  presentation/
    feedback-ask.controller.ts                       NEW  (D8)
    dto/list-sent-feedback-requests.dto.ts           NEW
    dto/list-my-feedback-asks.dto.ts                 NEW
    dto/answer-feedback-ask.dto.ts                   NEW
    dto/get-feedback-ask.dto.ts                      NEW
    dto/path-params.dto.ts                           + FeedbackAskPathParamsDto
shared/presentation/dto/page.dto.ts                  MOVED from modules/workspace (D9)
```

### 5.1 Routes

All under `/v1/workspaces/:workspaceId/…` behind Feedback's own `WorkspaceMemberGuard`
(`BE_21` R3 — a non-Member gets `404 WORKSPACE_NOT_FOUND`). Who the caller is always comes from
the session (`@CurrentActor`), never from the query or body.

| # | Verb | Path | Result | Codes |
| --- | --- | --- | --- | --- |
| 16 | `GET` | `…/feedback-requests?page&pageSize` | the **caller's own** requests, newest first; each with Topic, `createdAt`, and its Asks (Giver name + status) | `200`; `401`; `404 WORKSPACE_NOT_FOUND` |
| 16/24 | `GET` | `…/feedback-requests/{requestId}` | as today, **+ each Ask's answer** (D10), **+ the caller check** (§2) | `200`; `401`; `404 FEEDBACK_REQUEST_NOT_FOUND` |
| 18 | `GET` | `…/feedback-asks?status=PENDING&page&pageSize` | the **caller's own** Asks, newest first: `askId`, Topic, `requester` (`accountId` + nullable `name`), `createdAt` | `200`; `400 REQUEST_INVALID`; `401`; `404 WORKSPACE_NOT_FOUND` |
| 22/24 | `GET` | `…/feedback-asks/{askId}` | one Ask of the caller's: `requester`, the Topic, the status | `200`; `401`; `404 FEEDBACK_ASK_NOT_FOUND` |
| 24 | `POST` | `…/feedback-asks/{askId}/answers` | `{ body }` → `201 { feedbackId }` | `201`; `400 REQUEST_INVALID, FEEDBACK_BODY_EMPTY, FEEDBACK_BODY_TOO_LONG`; `401`; `404 FEEDBACK_ASK_NOT_FOUND`; `409 ASK_ALREADY_ANSWERED` |

`BE_07`: R1 plural nouns, R4 version in the path, R5 both collections paginated with the shared
shape, R7 no envelope, R10 every type declared so it reaches the generated contract. R8 (idempotency
key): not taken — the unique index on `feedbackAskId` makes a repeated send answer `409` rather than
write twice, which is the honest answer to "I already answered this".

`status` on the Asks list is `z.enum(ASK_STATUSES).default('PENDING')` — #18 AC 3 wants only
Pending today, and the parameter is where #27 and #39 will ask for the others without a new route.

### 5.2 Use cases

`ListSentFeedbackRequestsUseCase` (#16) and `ListMyFeedbackAsksUseCase` (#18) are queries
(`BE_05` R3/R4): they read the projection and never load the aggregate. Both enrich people's names
through Identity's `AccountSummaryPort.summariesOf()` **once per page, not once per row** — every
`giverAccountId` on the page is collected first, one call, then mapped (`BE_06` R9; the existing
`GetFeedbackRequestUseCase` already does this for one request). A page of 20 requests × 1 Ask is
one database read plus one port call, and stays that way when #31 raises the Giver cap.

`AnswerFeedbackAskUseCase` (#24):

```
execute({ workspaceId, askId, giverAccountId, body })
  unitOfWork.run(() =>
    request = repository.findByAskId(workspaceId, askId)        // scoped by Workspace, always
    unless request -> throw AskNotFoundError                     // 404, same code as "not yours"
    feedback = request.answerAsk({ askId, giverAccountId,
                                   feedbackId: idGenerator.next(),
                                   body: FeedbackBody.of(body) })
    repository.saveAnswer(request, feedback)                     // one UPDATE + one INSERT
  )
  return { feedbackId: feedback.id }
```

One transaction per use case through `UnitOfWork` (ADR 0031, the interim for `BE_14`). `saveAnswer`
writes the Ask's status with `updateMany({ where: { id, status: 'PENDING' } })` and inserts the
Feedback; **zero rows updated means another request won the race**, and the insert's unique index
would refuse it anyway — the repository turns either into `AskAlreadyAnsweredError` (D3).

### 5.3 Errors

Stable codes (`BE_09` R2/R3/R6), reaching the wire through the existing `CodedErrorFilter` —
nothing below a controller throws an HTTP exception (R5), and the category→status map is **not**
touched:

| Code | Declared on | Category | Status | Meaning |
| --- | --- | --- | --- | --- |
| `FEEDBACK_ASK_NOT_FOUND` | `ApplicationError` (already exists, #18) | `not_found` | 404 | no Ask with that id is the caller's, in this Workspace. One answer for "does not exist", "someone else's" and "another Workspace's" |
| `ASK_ALREADY_ANSWERED` | **`DomainError`** | `conflict` | 409 | "an Ask collects one answer" is a business rule, so it is the domain's — raised by the aggregate when it can see the Ask is not Pending, and by the repository when only the store could (ADR 0041). The `conflict` category already existed in `STATUS_BY_CATEGORY`, unused; this is its first caller |
| `FEEDBACK_BODY_EMPTY` / `FEEDBACK_BODY_TOO_LONG` | `DomainError` | `validation` | 400 | raised by the VO, as `TOPIC_EMPTY` / `TOPIC_TOO_LONG` already are |

### 5.4 Who may read an answer

`#24` AC 5: *nobody but the Giver and the Receiver, until FB-0028*. Enforced in the application
layer (`BE_21`), in two places and in neither the client:

- `GET …/feedback-requests/{requestId}` — the caller must be the Requester or a Giver (§2). The
  Requester (= Receiver) sees every Ask's answer; a Giver sees the `answer` field only on their
  own Ask, `null` on the others.
- `GET …/feedback-asks/{askId}` is scoped by `giverAccountId = actor.accountId` in the **query**,
  not filtered after the read — a query that forgets the scope cannot be written, which is the
  reason `workspaceId` is a required argument on the existing port.

`visibility` is read nowhere yet: every request is `ONLY_ME`, so "the Requester chose who else"
has no choice to honour until #83/#84. Stated so the gap is deliberate rather than forgotten.

## 6. Schema and migration

One migration, `create_feedback`, Feedback's own tables only (`BE_15` R1/R2/R7):

```prisma
/// One Giver's answer to one Ask (glossary: Feedback). Requested Feedback: Offered Feedback,
/// with no Ask, is #29 — which makes feedbackAskId nullable and adds FeedbackOrigin (D4).
model Feedback {
  id                String      @id
  /// Workspace's id, held without a foreign key (BE_03 R7), as on FeedbackRequest.
  workspaceId       String
  feedbackRequestId String
  /// Inside Feedback's own module, so a real relation: one answer per Ask, ever (D3).
  feedbackAskId     String      @unique
  feedbackAsk       FeedbackAsk @relation(fields: [feedbackAskId], references: [id], onDelete: Cascade)
  /// The Account of the Member who wrote it, and of the Requester it is for. No foreign keys.
  giverAccountId    String
  receiverAccountId String
  body              String
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  /// For "the Feedback I received", newest first (#26).
  @@index([workspaceId, receiverAccountId, createdAt])
  /// For "the Feedback I gave" (#27).
  @@index([workspaceId, giverAccountId, createdAt])
  @@map("feedback")
}
```

`FeedbackAsk` gains the back-relation `feedback Feedback?`. No other table changes: `AskStatus`
already has `ANSWERED`, and the `@@index([giverAccountId, status])` #18 needs was added in
`20261011075735_create_feedback_request`.

Rollback, stated in the migration's description (`BE_15` R6): the table is new and empty, so
dropping it is the rollback; no Ask has ever left `PENDING`, so nothing needs unwinding. Existing
rows: none to migrate (R8).

## 7. Web

PR #140 (#138, `FD-0017`) is **open and unmerged** and decides how the browser and the server call
the API. Everything below follows the pattern already in `main` — `'server-only'` services for
reads, `'use server'` actions for writes — which is what #140 ratifies. If #140 lands first, PRs 2
and 4 adopt whatever it changes; if it lands after, it rewrites these files. See §10.

```
app/(signed-in)/(side-nav)/feedback/_lib/                        shared by both lists
  ask-status.constant.ts                the status names and their three colour roles
  sent-day.util.ts                      one date format, fixed to UTC and one locale
app/(signed-in)/(side-nav)/feedback/sent/                        #16
  page.tsx                              server; requireMember(); Suspense around the list
  _components/sent-request-list.tsx     one row per request: Topic, date, each Giver + status
  _lib/sent-requests.service.ts         'server-only'; cache: 'no-store'
  _lib/sent-request.type.ts             the view model (FE_10 R6)
app/(signed-in)/(side-nav)/feedback/asks/                        #18
  page.tsx
  _components/waiting-ask-list.tsx      who asked, the Topic, when; the answer screen is #24
  _lib/my-asks.service.ts
  _lib/my-ask.type.ts
app/(signed-in)/(top-nav)/feedback/asks/[askId]/                 #22/#24
  page.tsx                              validates the segment with Zod (FE_11 R4)
  _components/answer-ask-card.tsx       server; who asked + the Topic; the box, or why there is none
  _components/answer-ask-form.tsx       'use client' — the one interactive subtree
  _lib/feedback-ask.service.ts          'server-only'; null on 404 → notFound()
  _lib/answer-ask-actions.service.ts    'use server'; POSTs, then redirects
  _lib/answer-ask-state.type.ts
  _lib/ask-params.schema.ts
```

**Three things the plan did not say, decided while building PR 4:**

- **An answered Ask gets no box.** The first answer is final, so a second one earns a `409`; a
  form that can only be refused is worse than a sentence saying why. The screen reads the Ask's
  status and renders either the box or "You have already answered this", with a link back.
- **Sending goes back to the same Ask**, which then shows that sentence. It is the confirmation that
  survives a refresh, the same reason #21's own confirmation is its own route (0015 D3) — and it is
  where a repeated Send lands too, so the `409` never reaches the person as an error.
- **The Topic is the link** on *Waiting for me*, not a repeated "Answer this": a screen reader
  listing the links then hears what each one is about.

Every surface here is the `Card` atom, so PR 4 adds no component and the hand-rolled surface in the
two list rows (§7's earlier note) gains no third copy — the `SurfaceRow` molecule considered for this
pull request is not needed.

Modified: `lib/routes.constant.ts` (`feedback.sent`, `feedback.asks`, and `feedback.askById(id)`
in PR 4); `components/organisms/site-side-nav.tsx` + its test — the side nav held one link, whose
`aria-current="page"` was a constant because Home was the only page using the nav. The links move
into `components/organisms/side-nav-links.tsx`, a client component, because only the browser knows
the current path: a server component would have to be told it by every page. The confirmation page from 0015 is unchanged except
that it now renders an answer when there is one.

- Both lists: `FE_09` R1/R2/R10 — `cache: 'no-store'`, because an Ask's status changes when
  somebody else answers and one person's list must never be served to another.
- Empty states (`FE_18`, `todo` — index entry binding): *"You haven't asked anyone for feedback
  yet"* with a link to Home's form; *"Nothing is waiting for you"*. Loading: inline `<Suspense>`
  with the existing `Skeleton`, as `/home` does. Errors: the root `app/error.tsx` boundary.
- The answer form mirrors `request-feedback-form.tsx`: `useActionState`, the field controlled so
  typing survives a refusal, **Send enabled on an empty box** and the error shown inline on press
  (the `/home` form's reading of `FE_06`), disabled only while sending. `components/atoms/textarea.tsx`
  and `components/molecules/text-area-field.tsx` already exist, so PR 4 adds no component — an
  earlier draft of this section said otherwise.
- Error code → copy (`FE_10` R7, branch on the **code**, never the message):

| Code | What the person reads |
| --- | --- |
| `ASK_ALREADY_ANSWERED` | "You've already answered this request." + the page re-reads, so the box is replaced by what they wrote |
| `FEEDBACK_BODY_EMPTY` | inline on the field; the browser checks first |
| `FEEDBACK_BODY_TOO_LONG` | inline, with the limit named; a live counter appears past 3,500 |
| `FEEDBACK_ASK_NOT_FOUND` | `notFound()` — it is not theirs or it is gone |
| `NOT_SIGNED_IN` → `/signin`, `WORKSPACE_NOT_FOUND` → `/home` | redirect, not a message |
| anything else | "We couldn't send your answer. Please try again." |

The server action is a public endpoint whatever the form did first (`FE_09` R4/R5): it re-reads the
session with `requireMember()`, takes the Workspace from the session, validates with Zod derived
from the generated contract types (`FE_16`, `todo`), and never trusts an `askId` as proof of
anything — the API scopes it to the caller.

## 8. `todo` convention entries interpreted

`AGENTS.md`: while an entry is `todo` the document does not exist and **the index entry is the
binding text**. Five bind this change, none in conflict, so "stop and ask" does not fire.

| Entry | Its binding text | How this change reads it |
| --- | --- | --- |
| `BE_14` Transactions and unit of work | `todo`; **ADR 0031 is the interim** | One `UnitOfWork.run()` per use case. No `serializeOn` key — D3 replaces the lock with a unique index |
| `BE_16` Inter-module communication | index summary only | Unchanged from 0015/ADR 0037: Identity's `AccountSummaryPort` is the only way Feedback learns a name |
| `BE_17`–`BE_19` Outbox / jobs / events | `todo`, nothing installed (`PROJECT.md` §4) | **Nothing is published when an Ask is answered.** The Requester finds out by opening the page. Telling them is Epic #13 (Notifications), and `PROJECT.md` lists no broker — so this is the honest state, not an omission |
| `FE_16` Forms and validation | "deriving the form schema from the generated contract types" | The answer action's input schema derives from `@repo/api`, not a hand-written shape |
| `FE_18` Error handling and UI states | "mapping the backend error codes…, mandatory loading / empty / error / partial states" | §7's code→copy table, both empty states, `<Suspense>` loading, root error boundary |

`FE_07` R7 (a story per state) still does not apply — Storybook is #136, `Backlog`.

## 9. Tests

**API** (`bun test`, `BE_11`: named for actor, action and observable outcome; ports substituted,
real domain objects; no test for a projection query, R9):

- `feedback-body.vo.spec.ts` — trims; refuses empty and whitespace-only; refuses past 4,000 graphemes
- `ask-status.vo.spec.ts` — `PENDING` → `ANSWERED`; answering an `ANSWERED` Ask is refused
- `feedback-request.entity.spec.ts` — answering an Ask flips only that Ask and returns Feedback
  addressed to the Requester; **another Giver's Ask answers not-found**; answering twice is refused
- `answer-feedback-ask.use-case.spec.ts` — a Giver answers and both writes happen in one unit of
  work; an Ask that is not the caller's is refused and **nothing is written**; a blank body is
  refused before the repository is touched
- `list-sent-feedback-requests.use-case.spec.ts` — only the caller's own requests; names resolved
  in **one** `summariesOf` call for the page (the N+1 guard, asserted on the fake's call count)
- `list-my-feedback-asks.use-case.spec.ts` — only the caller's Pending Asks; another Member's are absent
- `get-feedback-request.use-case.spec.ts` — **+ §2's fix**: a Member who is neither Requester nor
  Giver gets not-found; a Giver sees their own answer and `null` for another Giver's
- `prisma-feedback-request.repository.integration.spec.ts` (`BE_12`) — **+ the race**: two
  concurrent `saveAnswer` calls on one Ask leave one Feedback row and one `409`. Needs the compose
  Postgres migrated; `test:integration` runs nothing automatically, so §10 runs it by hand and each
  PR says whether it ran

**Gherkin** (`@api`, `GEN_10`) — **added to the plan after the suite landed on `main` on
2026-10-12.** `features/feedback-requests.feature` now exists, so answering arrives with its own
scenarios rather than unit tests alone:

- a teammate answers what they were asked, and the Member who asked reads it
- an answered Ask stops waiting
- an Ask collects one answer, and the first one is final — the `409`
- an Ask is answered by the Member it waits on and by nobody else — the `404`

Steps in `apps/api/test/steps/feedback.steps.ts`, over two journeys in `support/journeys.ts`. The
world remembers the Ask a person has on screen, because a Giver pressing Send twice has the id in
front of them while their waiting list no longer does.

**Web** (Vitest + Testing Library, `FE_14`): queried by role and accessible name, real `userEvent`,
network mocked at MSW and nothing below it (R4), server actions replaced at their module (R6) —
both lists including their empty states, the answer form's inline error, and the side nav's two new
links.

## 10. Execution plan

Four pull requests, in order. Each is green on all six CI checks before the next starts.

| PR | Branch | Cards | Contents |
| --- | --- | --- | --- |
| 1 | `feat/16-18-api-read-feedback` | #16, #18 | D9's `page.dto.ts` move; §2's authz fix; the two list routes; `GET …/feedback-asks/{askId}`; query-port reads; tests |
| 2 | `feat/16-18-web-feedback-lists` | #16, #18 | `/feedback/sent`, `/feedback/asks`, the two services, side-nav links, routes constant, tests |
| 3 | `feat/24-api-answer-an-ask` | #24 | `create_feedback` migration; `Feedback` + `FeedbackBody`; `answerAsk()`; `POST …/answers`; answers on the request read (D10); unit, integration and `@api` tests; ADR 0041 |
| 4 | `feat/24-web-answer-an-ask` | #24 | the answer screen, the `TextArea` atom + its showcase entry, the server action, the answer on the confirmation page, tests |

**A generator defect worked around in PR 1.** An Ask names the Member who asked as
`requester: { accountId, name }` rather than as a flat `requesterName`, because a **nullable string
directly on a response root** comes out of the contract as an array of strings: nestjs-zod 5.5 hands
`@nestjs/swagger` `type: ['string', 'null']` as that property's metadata, and swagger reads an array
`type` as "array of". Nested one level — inside `items`, or inside `requester` — it generates
correctly. Checked against `cleanupOpenApiDoc`'s `version: '3.1'` option too, which fixes the
session DTO's nullable object but not this. The grouping is a better shape anyway, so the
workaround is not a scar; the same trap waits for any future root-level nullable primitive.

**Interpreted while building PR 1:** `BE_01` R6's role-suffix list (enforced by
`apps/api/scripts/check-architecture.mjs`) has no suffix for a plain application helper, so the
"name a page of Accounts in one call" step is a file-local function inside each query use case
rather than one shared file — which is what `list-workspace-members.use-case.ts` already does.

Per PR, in this order:

```bash
bun install                                   # only if the lockfile moved
turbo run check-types
bun run check:contract                        # PRs 1 and 3 — regenerates packages/api; a diff must be committed
bun run lint && bun run format
turbo run test --filter=api                   # PRs 1 and 3
turbo run test --filter=web                   # PRs 2 and 4
cd apps/api && node scripts/check-architecture.mjs
```

PR 3 additionally, by hand, because CI runs neither suite:

```bash
docker compose up -d
bun run --cwd apps/api db:migrate:deploy
bun run --cwd apps/api test:integration        # includes the two-writers race test
bun run --cwd apps/api test:bdd                # the @api scenarios
```

Both need `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` in
the environment (`test:integration` needs the two `RESEND_*` as well; `test:bdd` fills those in
itself). A checkout's `.env` may predate them — copy the missing lines from `.env.example`.

Board and brain, as the work lands:

- #23, #17, #22 — **closed as superseded** by #16, #18, #24 (confirmed 2026-10-12), each with a
  comment saying which PR covered it, the way #15 was handled. Closed when the covering PR merges,
  not before: until then they are the only board record that the screens are owed.
- #16/#18 move to `Testing` on PR 2, #24 on PR 4 — the PM walk is owed on each before `Done`.
- The brain: no new glossary noun — `Feedback`, `Giver`, `Receiver`, `Answer`, `Requested Feedback`
  are all already rows (`glossary.md:73–81`). D1/D2/D6's cap and §2's fix are **code** decisions →
  an ADR in `docs/adr/` here, not in the brain. `STATE.md` gets the loop when #24 is walked, and
  needs two corrections already outstanding: PRs #151/#152 **are merged**, and card #148 is still
  `Backlog` although Invitation email works.

## 11. Risks and sequencing

| Risk | Handling |
| --- | --- |
| **PR #140 (#138) rewrites how the web calls the API** and is open | PR 1 and 3 are untouched by it — they are API only. Ask for #140 to merge before PR 2 starts; if it will not, PR 2 and 4 follow `main`'s pattern and take the rewrite with everyone else |
| **#74 / #41 — Feedback still runs on seeded Members** | #18's acceptance ("sign in as B, the Ask is there; sign in as C, it is not") cannot be walked honestly with one real Account. The API test proves the scoping; the **PM walk on #18 and #24 waits for #74**, and the PR says so rather than ticking the box |
| The `page.dto.ts` move touches Workspace in a Feedback PR | Mechanical, import-only, covered by Workspace's existing tests; called out in PR 1's description |
| 4,000-grapheme cap is an engineering reading, not a product call | Accepted for this release (D6) and noted on #24 for kritpavin, exactly as the Topic's 200 is. `text` column, so overturning it is a one-line change and no migration |
| A Giver answers while the Requester has the page open | Accepted: the page is `no-store` and re-reads on navigation. Live updates are Epic #13's problem, not this one |
