# Technical design · NO-2 In-app Notifications

**Requirement:** `requirement.md`, beside this file — read it first; it owns the rules, this owns the mechanism
**Proposed card:** NO-0005 · Epic [#13](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/13)
**Product decision:** brain `ADR-0035` §6–§9 (three events, skipped quietly, DMs belong to #13); the
in-app half has no ADR of its own yet — `requirement.md` §7 is what would become one
**Status:** draft, 2026-10-24 · **Author:** naroebordin (with Claude)
**Approved 2026-10-24 by naroebordin:** the delivery approach — **D9** (polling: on mount, on focus,
every 60 s while visible) and **D10** (through a web server action), and the §4 split of one event into
two independent channels. **Still open and not covered by that approval:** D12 and D14 (§2's "two to
argue with"), and every product question in `requirement.md` §7
**Follows:** `docs/design/0021-discord-direct-messages.md`. Same module, same three events, same
published port. §11 is the diff this forces on `0021`, and it is the part to read before #213 starts.

---

## 1. Context

`0021` tells one person something through a chat tool they chose to link. This tells **the same person
the same three things inside Thrive**, where no linking, no Connection and no third party is involved.

The two are not alternatives. In-app is the floor (`requirement.md` rule 1): it is written for every
recipient, always. Chat is a second place the same event is carried to, for the people who opted in.
So this design does not add a parallel system — it adds **what sits behind `PersonNotifierPort`**, which
`0021` D2 already published and already named after the person rather than after Discord.

**Three facts found in the repository that decide most of this design:**

1. **Identity already publishes a batched name lookup.** `AccountSummaryPort.summariesOf(ids)`
   (`apps/api/src/modules/identity/index.ts`), used by Feedback's `PeopleService` to resolve a whole page
   of people in one call (`BE_06` R9). Notifications can store ids and resolve names at read time, which
   removes the need to snapshot a name and removes any reason for Notifications to read Feedback.
2. **The browser never reaches the API.** `apps/web/lib/api-client.service.ts` is `server-only`, and the
   API has no public domain (ADR 0027). Anything that refreshes a count has to go through the web server.
3. **There is no route to a single piece of Feedback.** Home's dialog takes `request` and `ask` only
   (`apps/web/app/(signed-in)/(member)/home/page.tsx`). §10 R4 — **this already blocks #215**, which is
   carded and says "land on that Feedback".

**What is deliberately not here.** Reminders (no scheduler — `BE_18` is `todo`), email (its own card, and
Resend's shared 100-a-day cap), preferences (`requirement.md` §5), and anything that pushes to the
browser (§2 D9).

## 2. Decisions

| # | Decision | Rejected | Why |
| --- | --- | --- | --- |
| D1 | **In-app lives in `modules/notifications/`** — the module `0021` D1 creates, beside `LinkedAccount` | a second module; putting it in Feedback | `domain-map.md` gives Notifications one bounded context owning `Notification`, `Reminder`, `Channel`, `Preference`. Two modules for one context is the thing `BE_03` exists to prevent |
| D2 | **One row per recipient per event.** The row *is* the in-app Notification and the fan-out unit | one row per event plus a recipients join table | Every event here already enumerates its recipients at the moment it happens. A join table buys a saving at 1–5 recipients and costs a second read on the hottest query in the feature — the unread count |
| D3 | **The row stores ids and a type. Never prose, never Feedback's words.** Names are resolved at read time through `AccountSummaryPort.summariesOf`, once per page | storing the rendered sentence; storing an excerpt of the Request message | `requirement.md` rule 2. A stored sentence is a second copy of words `ADR 0054` deliberately keeps in one place, it freezes a name that may change, and it would make a future redaction unenforceable. Resolving costs one extra call per page, not per row (`BE_06` R9, the `PeopleService` pattern) |
| D4 | **The subject is one `subjectId`; its kind is implied by `type`** | a polymorphic `(subjectKind, subjectId)` pair | Four types, each with exactly one kind of subject: `ASK_RECEIVED`→Ask, `ASK_ANSWERED`→Feedback Request, `FEEDBACK_RECEIVED`/`FEEDBACK_SHARED`→Feedback. A second column would hold a value derivable from the first |
| D5 | **Written after the subject's transaction commits, in Notifications' own transaction** | inside the Feedback use case's `UnitOfWork` | `AGENTS.md` §6 hard rule: no cross-module transaction. Not negotiable, whatever it costs. What it costs is §10 R1: a crash between the two loses the Notification, which is exactly the gap `BE_17`'s outbox exists to close and which this design accepts and names |
| D6 | **The row write is `await`ed and its failure swallowed**, unlike the chat message, which stays fire-and-forget | fire-and-forget for both (`0021` D5); awaiting both | They are different risks. The row is one local Postgres insert, ~1 ms, and losing it means the person is **never told by any channel**. The chat call is two HTTPS round trips to a third party that may be down. So: `await` the row inside a `try/catch` that logs and returns; leave chat as `0021` wrote it. **Cost, stated:** ~1–3 ms added to the p50 of three write endpoints, measurable before and after with the existing suites |
| D7 | **Fan-out is one `createMany`**, not a call per recipient | `Promise.allSettled` over inserts | A request asking five people is one round trip, not five. This is also why D2's shape pays: the recipients are already in hand |
| D8 | **Idempotent on `(recipientAccountId, type, subjectId)`, unique, inserted with `skipDuplicates`** | nothing; a dedup check read before insert | A double-submitted form or a retried request must not put two lines in a bell. A check-then-insert is a race (`BE_12`); a unique index is not. It also enforces `requirement.md` rule 4 at the database rather than in a code path somebody can reorder |
| D9 | **Freshness is polling: on mount, on the tab regaining focus, and every 60 s while visible** | SSE; websockets; a shorter interval | There is no Redis and no broker (`BE_19`, `INFRA_12` both `todo`), the API may run more than one replica, and a held connection would cross Railway's proxy and the private hop. A 50-Member Workspace polling once a minute is **under 1 request per second**; at 5 s it is 10 rps to change a number that changes a few times a day. **Cost: the count can be up to 60 s stale** — `requirement.md` §4 step 3 says "within a minute" for that reason |
| D10 | **The web polls through a server action**, as `SessionRefresher` already does | the browser calling the API; a Next route handler | §1 fact 2 — the client has no way to reach the API. `apps/web/lib/session/session-actions.service.ts` is the established shape; a route handler is the alternative if the action's POST semantics prove awkward, and that is a `FE_09`/`FE_11` call made when the code is written, not here |
| D11 | **Routes sit under the Workspace**: `GET /v1/workspaces/{workspaceId}/notifications`, `POST …/notifications/read`, `POST …/notifications/{id}/read` | `/v1/notifications/mine`, as `0021` put Linked Accounts | A Linked Account belongs to an **Account**; a Notification belongs to a **Workspace** (`requirement.md` rule 5). Under the Workspace it gets `WorkspaceMemberGuard` free (`BE_21` R3). **And the surface has no way to name a person** — the caller is always the recipient — so rule 7 is a property of the API's shape, not of a check somebody might forget |
| D12 | **In-app copy is composed in the web; chat copy stays on the API** | one rendered string from the API for both; both in the web | **The one to argue with.** The API must compose chat copy — it posts it, and it needs an absolute URL. The web must own in-app copy — the destination is a *web route* (`ROUTES.homeAsk`), and `ROUTES` is not the API's to know; `0021` §4.2 step 3 having the API build a web path is already a layering smell that works only because chat needs a URL anyway. It also puts the sentence where `FE_23` (i18n, `todo`) will want it. **Cost: the sentence exists in two places.** Mitigated by the `type` enum being the one shared vocabulary and by §4.4 listing both renderings side by side |
| D13 | **No `NotificationChannel` interface yet.** The adapter writes the row, then hands to chat, in sequence | a channel registry, mirroring `0021` D3's provider registry | Honest inconsistency, deliberately taken. `0021` D3 took a registry because the second **provider** is named, dated and decided (Slack). The second **channel** — email — has no card and no date. Two concrete steps in one adapter is not an abstraction problem; it becomes one when email lands, and that is when the interface is worth writing. `PROJECT.md` §2 |
| D14 | **The table is built with the bell, not at #213** | writing rows at #213 with nothing reading them | A schema designed with no screen to check it against is how the shape gets wrong, and it is a table with no consumer (`PROJECT.md` §2). What #213 **must** do instead is §11: lock the port signature, so Feedback's three call sites are written once |
| D15 | **Read state is one nullable `readAt`** | separate `seenAt` and `readAt` | One bell, one question: is there anything I have not dealt with. `requirement.md` §7 question 5 settles *when* it is set; this settles that there is one of it |

**Not approved yet — this document is the review. D12 and D14 are the two to argue with.**

## 3. Domain model

Added to the module `0021` creates. Nothing in `0021`'s tree is moved.

```
modules/notifications/
  domain/
    entity/notification.entity.ts              a Notification: recipient, type, actor, subject, readAt
    value-object/notification-type.vo.ts       D4 — ASK_RECEIVED · ASK_ANSWERED · FEEDBACK_RECEIVED · FEEDBACK_SHARED
    repository/notification-repository.port.ts recordAll(…) · markRead(…) · markAllRead(…)
    notifications.errors.ts                    (exists — NOTIFICATION_NOT_FOUND added)
  application/
    port/person-notifier.port.ts               0021 D2, amended by §11 — published
    adapter/fan-out-person-notifier.adapter.ts D13 — records the row, then hands to chat
    service/chat-copy.service.ts               0021's, chat copy only — renamed there 2026-10-24 (D12)
    use-cases/list-my-notifications.use-case.ts
    use-cases/count-my-unread.use-case.ts
    use-cases/mark-notification-read.use-case.ts
    use-cases/mark-all-read.use-case.ts
    query-port/notification.query-port.ts
  infrastructure/
    repository/prisma-notification.repository.ts
    repository/prisma-notification.repository.integration.spec.ts   D8's unique index, against real Postgres
    query/prisma-notification.query.ts
  presentation/
    notification.controller.ts                 D11 — under /v1/workspaces/:workspaceId
    dto/…
  index.ts                                     still exports PersonNotifierPort only
```

`fan-out-person-notifier.adapter.ts` **replaces** `0021`'s `chat-person-notifier.adapter.ts` as the thing
bound to `PersonNotifierPort`; the chat half becomes a collaborator it calls, unchanged in behaviour.
That is the whole structural change, and it is behind a published port, so Feedback does not see it.

## 4. How it fits together

**One event, one port, two channels.** This is the whole relationship between this design and `0021`,
and it is the thing to understand before reading anything below.

```
Feedback — three use cases, three call sites, unchanged after #213
  └── PersonNotifierPort.askReceived | askAnswered | feedbackWritten      published, 0021 D2
        └── FanOutPersonNotifier                                          this design, D13
              │  recipients cleaned ONCE here: actor removed, de-duplicated,
              │  Deactivated dropped  (requirement.md rules 3, 4, 6)
              │
              ├── 1. in-app   repository.recordAll(...)      ALWAYS, every recipient
              │               awaited, ~1ms, try/catch → warn        D5 D6 D7 D8
              │
              └── 2. chat     ChatPersonNotifier.deliver(...)  ONLY if they linked an account
                              fire-and-forget, 0021 unchanged           0021 D4 D5 D6 D12
```

**Four properties worth stating plainly, because each is a thing that can be got wrong later:**

- **Feedback sees no difference.** The port it calls is the same before and after this card. What
  changes is which adapter is bound to it in `NotificationsModule` — `0021` binds the chat one, this
  rebinds to the fan-out one, which then calls the chat one. **One line in a module.**
- **The two channels are independent in both directions.** Chat being down does not stop a bell line
  appearing; the row write failing does not skip the chat attempt. Two guards, neither gating the
  other — telling somebody in one place beats telling them in neither. §7 tests both ways round.
- **The recipient rules move up and chat inherits them.** `0021` §4.2 checked Deactivated membership
  inside the chat notifier. It belongs above the split, so both channels obey it and neither can drift.
- **Somebody with Discord linked gets both, deliberately.** There is no cross-channel de-duplication
  and none is wanted: the bell is where they look, the DM is where they are reached. `requirement.md`
  rule 1 — linking adds a place, it never replaces one.

**What each channel carries differs**, and §4.4 is the table of it: the DM names the Workspace and may
quote the Request message (`ADR-0035` §7 — one reader, who is a party); the bell names neither, because
it is already inside its Workspace and the words stay in Feedback (`requirement.md` rule 2).

**What stays entirely in the chat half:** `LinkedAccount`, the `ChatProvider` registry, the Discord
adapter, `openDirectChannel` caching, and the quiet skip for somebody Discord refuses. In-app has no
opinion on any of it and never reads that table.

### 4.1 The write path

```
AnswerFeedbackAskUseCase                                  (Feedback — unchanged except its call)
  … transaction commits …
  notifier.askAnswered({ workspaceId, workspaceName, recipientAccountId,
                         actorAccountId, actorName, subjectId: requestId })

FanOutPersonNotifier.askAnswered(event)
  1  await repository.recordAll([...])        D5 D6 D7 — one createMany, skipDuplicates (D8)
         try/catch → log at warn, return. The action never fails for this.
  2  void chat.deliver(event).catch(logError) 0021, unchanged — fire-and-forget
```

**Recipients are cleaned before step 1**, in one place rather than at three call sites:

- the actor is removed (`requirement.md` rule 3)
- the list is de-duplicated, so a Receiver who is also a Selected person gets one row (rule 4)
- Deactivated Members are dropped, via `WorkspaceMembershipPort.membersAmong` — one call for the whole
  list, and `isMemberOf`/`membersAmong` already answer **active** membership only (ADR 0047, confirmed in
  `0021` §4.2's 2026-10-18 correction). There is no `isActiveMemberOf` to write

### 4.2 The read path

```
GET /v1/workspaces/{workspaceId}/notifications?page&pageSize      ← WorkspaceMemberGuard (BE_21 R3)
  query.forRecipient(workspaceId, actor.accountId, page)          the caller, always — D11
  AccountSummaryPort.summariesOf(unique actor ids)                one call per page — D3
  → { items: [{ id, type, actor: { accountId, name }, subjectId, createdAt, readAt }], total, page, pageSize }

GET …/notifications/unread-count   → { count }
POST …/notifications/{id}/read     → 204   refuses an id that is not the caller's: NOTIFICATION_NOT_FOUND
POST …/notifications/read          → 204   marks every unread one of the caller's in this Workspace
```

Paging uses `pageQueryShape` / `pageResultShape` from `shared/presentation/dto/page.dto.ts` — the same
names and limits as every other collection (`BE_07` R5).

**`subjectId` is returned raw and nothing is read from Feedback.** The web turns it into a link (D12).
A subject that no longer exists or is no longer readable is not filtered here — following it lands on
Thrive's ordinary not-found, which is `requirement.md` rule 8 and also the only version of this that does
not make Notifications read another module's tables.

### 4.3 Cost of the hot query

The unread count runs on every poll, so it is the only query here worth sizing up front.

```sql
SELECT count(*) FROM notification
 WHERE recipient_account_id = $1 AND workspace_id = $2 AND read_at IS NULL
```

Index `(recipient_account_id, workspace_id, read_at)` covers it. At a 50-Member Workspace polling once a
minute that is **under 1 query per second against an index**, over a table holding roughly 90,000 rows a
year (`requirement.md` §7 question 3). A partial index on `read_at IS NULL` would be tighter and Prisma
does not express one cleanly; it is a raw migration if it ever shows up in a measurement, and **nothing
should be done about it before then**.

### 4.4 The two renderings (D12)

| `type` | Chat (API composes, carries the words) | In-app (web composes, carries none) | Opens |
| --- | --- | --- | --- |
| `ASK_RECEIVED` | "Nut asked you for feedback in Thrive Team — On: how our standups are going" | "Nut asked you for feedback" | `ROUTES.homeAsk(subjectId)` |
| `ASK_ANSWERED` | "Ploy answered your request in Thrive Team" | "Ploy answered your request" | `ROUTES.homeRequest(subjectId)` |
| `FEEDBACK_RECEIVED` | "Nut wrote feedback to you in Thrive Team" | "Nut wrote feedback to you" | `ROUTES.homeFeedback(subjectId)` — **does not exist, §10 R4** |
| `FEEDBACK_SHARED` | "Nut shared feedback with you in Thrive Team" | "Nut shared feedback with you" | same |

The Workspace's name is in the chat copy and not the in-app copy, for the reason `0021` D11 gave: a chat
conversation carries messages from every Workspace somebody belongs to, and a bell does not — it is
already inside one (`requirement.md` rule 5).

## 5. Web

| Where | What |
| --- | --- |
| `components/organisms/notification-bell.tsx` | client component in `MemberNavbar`; the count, the panel, *Mark all as read*. `FE_02`, `FE_08` |
| `components/molecules/notification-row.tsx` | one line: actor, sentence, relative time, unread dot |
| `lib/notifications/notification-actions.service.ts` | the server actions D10 needs, shaped like `session-actions.service.ts` |
| `lib/notifications/notification-copy.ts` | D12 — `type` → sentence and `ROUTES` destination, in one map |
| `lib/routes.constant.ts` | `homeFeedback(feedbackId)`, once §10 R4 is resolved |

The panel is built from `components/atoms/dropdown-menu.tsx` and the count from
`components/atoms/badge.tsx` — both already in the repository. A `Popover` would be the better fit and
is **not** installed; adding it is `bunx --bun shadcn@latest add popover` plus the rewrite to token
utilities every component here gets (`PROJECT.md` §4), and it is a choice for whoever builds this, not
one this document should make. Either way the new components are shown at `/ui-showcase` like every
other (`FE_13`). Empty state is a sentence, not a blank box (`requirement.md` §4 step 10).

## 6. Schema and migration

One table, one migration, no existing table touched. `GEN_11`: UUIDv7 id.

```prisma
/// One thing one Member is told about, inside Thrive. It is a pointer, never a copy: it names who
/// did something and which Ask, Feedback Request or Feedback it concerns, and carries none of the
/// words — following it, behind a sign-in, is how those are read (requirement.md rule 2).
/// Written after the thing it is about has committed, in this module's own transaction: a
/// cross-module transaction is forbidden (AGENTS.md §6), so a crash in between loses it. That is
/// accepted and is what BE_17's outbox would close.
model Notification {
  id                 String    @id
  /// The Workspace this is about. A Member of several is shown this one's only.
  workspaceId        String
  /// Who is being told. No foreign key: Accounts are Identity's (BE_03 R7).
  recipientAccountId String
  /// ASK_RECEIVED · ASK_ANSWERED · FEEDBACK_RECEIVED · FEEDBACK_SHARED.
  type               String
  /// Who did the thing. Never the recipient — nobody is told about their own action.
  actorAccountId     String
  /// The Ask, Feedback Request or Feedback it names. Which of those it is, is implied by `type`.
  /// No foreign key: they are Feedback's.
  subjectId          String
  /// Null until the Member opens it or marks everything read. The unread count is a count of these.
  readAt             DateTime?
  createdAt          DateTime  @default(now())

  /// One line per person per thing: a retried or double-submitted write cannot make two.
  @@unique([recipientAccountId, type, subjectId])
  /// The unread count, which runs on every poll (§4.3).
  @@index([recipientAccountId, workspaceId, readAt])
  @@map("notification")
}
```

No new configuration. No new dependency.

## 7. Tests

| Level | What | Where |
| --- | --- | --- |
| Unit | the actor is never a recipient; recipients are de-duplicated so Receiver-and-Selected is one row | `fan-out-person-notifier.adapter.spec.ts` |
| Unit | a Deactivated Member gets no row | same |
| Unit | the row is written **before** chat is handed anything, and chat failing does not undo it | same |
| Unit | the **converse**: when the row write throws, chat is still attempted — one channel failing never silences the other | same |
| Unit | when the row write throws, the adapter returns normally and logs once (D6) | same |
| Unit | each of the three Feedback use cases still succeeds when the notifier rejects | the three Feedback use-case specs — `0021` already adds these |
| Unit | `OFFERED` makes `FEEDBACK_RECEIVED`, `REQUESTED` makes `ASK_ANSWERED`, never both | `offer-feedback` + `answer-feedback-ask` specs |
| Unit | marking read refuses an id belonging to somebody else, as not-found | `mark-notification-read.use-case.spec.ts` |
| **Integration** | **the unique index holds — the same `(recipient, type, subject)` inserted twice yields one row** (D8), against real Postgres | `prisma-notification.repository.integration.spec.ts` (`BE_12`) |
| Integration | `markAllRead` touches only the caller's rows in only that Workspace | same |
| Gherkin | `@api`: three events produce three Notifications; the count falls on read; another Member's are unreachable | `features/notifications.feature` (`BE_13`, `GEN_10`) — the file `0021` creates |
| Web | the bell renders a count, the panel renders each type's sentence and destination, empty state, mark-all-read | `notification-bell.test.tsx`, `notification-copy.test.ts` (`FE_14`) |

Nothing here reaches a chat tool; the chat collaborator is faked, as `0021` fakes every `ChatProvider`.

## 8. `todo` convention entries interpreted

| Entry | How this design reads it | Conflict? |
| --- | --- | --- |
| `BE_14` Transactions & unit of work | one transaction per use case through `UnitOfWork`, never spanning modules. D5 obeys it and pays for it in §10 R1 | none |
| `BE_16` Inter-module communication | reach another module only through what it publishes. Feedback → Notifications through `PersonNotifierPort`; Notifications → Identity and Workspace through their published ports. **No new port on anybody else is needed** | none — but this is `BE_16`'s third interpretation in one programme, which is the signal `0021` §8 already raised that it should be written |
| `BE_17` Outbox & reliable messaging | the lost-Notification window is named, accepted and left to `BE_17` (§10 R1) | none |
| `BE_18` Background jobs | not needed, and only because Reminders are out of scope. Every write happens inside a request already running | none |
| `BE_19` Redis | not needed — D9 polls rather than pushing, and §4.3 says why no cache is warranted | none |
| `BE_22` Application security hardening | the trust boundary is D11: a surface with no way to name a person | none |
| `FE_17` State management | the bell holds its own state, polled; nothing global | none |
| `FE_18` Error handling & UI states | a failed poll leaves the last known count and does not shout. A bell is not worth an error banner | none |
| `FE_19` Authentication & protected routes | the bell renders inside `(signed-in)/(member)`, which is already guarded | none |
| `FE_23` i18n | D12 puts in-app copy where `FE_23` will want it. Nothing is translated today | none |

None conflict, so nothing here needs `AGENTS.md` §2's "stop and ask".

## 9. Execution plan

One card, one pull request, API and web together — `0021` D13's reasoning, unchanged.

1. **Migration + model + repository**, with its integration spec for the unique index first (`BE_12`)
2. **`FanOutPersonNotifier`** replacing `0021`'s chat adapter behind `PersonNotifierPort`, with the
   recipient cleaning of §4.1
3. **The four routes** and their DTOs (`BE_07`, `BE_08`, `GEN_08`), then `turbo run contract:generate --filter=api`
4. **The bell**, its copy map and its server actions
5. **Gherkin** scenarios and the web tests

**Checkpoints to stop at** (`GEN_04` R3, R8): after 2, confirm with a unit test that the three Feedback
use cases are untouched; after 3, confirm the contract diff is empty in CI before any web work.

**Code ADRs this would produce** — numbering checked against `docs/adr/`, where the next free number is
**0056**, not whatever this line says by the time you read it:

- *A Notification is a pointer and names are resolved at read time* (D3)
- *The Notification row is awaited; chat delivery is not* (D5, D6)
- *In-app copy is the web's, chat copy is the API's* (D12) — the one worth recording whichever way it goes

## 10. Risks and sequencing

| Risk | Reading |
| --- | --- |
| **R1 · A crash between commit and the row loses the Notification, silently and forever** | The sharpest thing here, and it is forced: a cross-module transaction is forbidden (`AGENTS.md` §6). D6 narrows the window to one awaited local insert. `BE_17`'s outbox is the real answer and does not exist. **Nobody is told their notification was lost** — the same acceptance `ADR-0035` §8 already made for chat |
| **R2 · D12 puts the sentence in two places** | Argue with it. The alternative — one rendered string from the API — puts web routes inside the API and i18n in the wrong app. Neither option is clean; this one keeps the layering honest and the duplication visible in §4.4 |
| **R3 · The count is up to 60 s stale** | D9. Accepted, and `requirement.md` §4 words the walk as "within a minute" so it is not discovered as a bug. Revisit only with a measurement |
| **R4 · There is no route to a single piece of Feedback — and this already blocks #215** | Home's dialog takes `request` and `ask` only. #215 is carded and says "land on that Feedback", so **this is #215's problem before it is this card's**. The cheap fix is a third dialog param, `feedback=<id>`, matching the pattern merged 2026-10-15. It needs deciding before #215, not before this |
| **R5 · `0021` D6 reads as "nothing is stored", which this contradicts** | It means *chat delivery state* is not stored. §11 proposes the sentence that says so. Left unamended, the next reader concludes this design broke a decision it is actually obeying |
| **R6 · A bell is the first thing in Thrive that can become noise** | Four types, three events, all of them "something is waiting for you". `requirement.md` §5 keeps reactions and feed activity out for exactly this reason. The test is whether anybody asks for an off switch (`requirement.md` §10) |
| **R7 · Notifications a Member cannot act on** | Rule 8 keeps a line whose subject became unreadable, and following it shows a not-found. Filtering instead would mean reading Feedback's tables from Notifications — a module cycle (`BE_03`) for a cosmetic gain |
| **R8 · Fan-out multiplies with recipients** | One `createMany` per event (D7), so it does not. The chat half still fans out per person as `0021` wrote it |

## 11. What this forces on `0021`, and what it costs to do at #213

**The point of writing this now.** Three amendments, all cheap *before* Feedback's call sites ship and
awkward after. None of them changes what #211, #213, #214 or #215 do for a person.

**All three were applied to `0021` on 2026-10-24**, before #211 started. They are kept here as the
record of *why*, since `0021` now carries the change but not the argument.

| | Amendment to `0021` | Where | Status |
| --- | --- | --- | --- |
| 1 | Every `PersonNotifierPort` method carries **`actorAccountId`** beside the ready-made `actorName`, and the subject id | `0021` §4.2 | **applied** 2026-10-24 |
| 2 | `notification-copy.service.ts` renamed **`chat-copy.service.ts`** | `0021` §3, §4.3 | **applied** 2026-10-24 |
| 3 | **D6 narrowed** — *chat delivery* is not stored; the Notification of the same event **is**, by a later card | `0021` D6 | **applied** 2026-10-24 |

Had they been declined, this card would also have edited Feedback's three call sites, added a field to
three port methods and renamed one service — roughly half a day and one more pull request into a module
it otherwise never opens.

**What is *not* proposed:** building this table at #213 (D14). The table ships with the bell, designed
against a screen that exists.
