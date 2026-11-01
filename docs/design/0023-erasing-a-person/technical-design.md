# Technical design · PR-1 Erasing a person

**Requirement:** [`requirement.md`](requirement.md) — read §1, §6 and §7 first
**Status:** draft, 2026-10-31 · **Author:** naroebordin (with Claude)
**Conventions:** `GEN_09` R3/R4/R5 · `BE_01`–`BE_03` · `BE_05` · `BE_06` · `BE_09` · `BE_15` ·
`BE_21` · `BE_11`/`BE_12`/`BE_13` · `GEN_13` · interpreting `todo` entries `BE_16`, `BE_22`, `BE_14`
(§8)
**Not buildable yet:** §2's D-numbers are stable, but PR-0003 and PR-0004 wait on brain `ADR-0049`
answering `requirement.md` §7 Q1–Q3. PR-0001 and PR-0002 do not

---

## 1. Context

Five facts the design is built on. Each was read from the repository rather than taken from a document,
because three of them contradict what you would assume.

1. **Feedback holds no foreign key into Identity.** `docs/adr/0037` decided it; `schema.prisma`
   confirms it — `Feedback.giverAccountId` (`:270`), `FeedbackReceiver.accountId` (`:305`),
   `FeedbackMention.accountId` (`:378`) are bare `String`. Deleting an Account row therefore breaks
   nothing *structurally* and breaks everything *semantically*.
2. **`User` cascades into five tables.** `Session`, `Account`, `Profile`, `Member` and `Invitation` all
   declare `onDelete: Cascade` on their `User` relation. A hard delete is a very blunt instrument.
3. **Three tables hold a denormalised copy of a person's name.** `FeedbackMention`,
   `FeedbackRequestMention` and `KudosMention` each store `slug` and `displayName` (`:352`, `:379`).
   These are personal data outside the module that owns personal data.
4. **None of those three tables can be looked up by `accountId` efficiently.** Each has a composite
   primary key `@@id([feedbackId, accountId])` (`:355`, `:382`) — `accountId` is the **trailing**
   column, and Postgres 17 cannot seek a btree on a non-leading column. A scrub keyed on `accountId`
   alone scans. They are not unindexed; they are indexed the wrong way round for this query.
5. **`User.email` is unique** (`@@unique([email])`, `:27`) and `Profile.slug` is unique (`:94`). A
   tombstone cannot simply blank them; it has to write a value that is unique per erased person.

And one constraint that shapes everything: **`AGENTS.md` §6 forbids a cross-module database transaction,
with no exception.** Erasure touches Identity, Workspace, Feedback, Kudos and Notifications. So it
cannot be one transaction, and the whole of §4 is about making a multi-step sequence safe instead.

## 2. Decisions

| # | Decision | Alternatives considered | Why |
| --- | --- | --- | --- |
| D1 | **Erase lives in Identity**, which owns the Account, and orchestrates the other modules through ports | a new `privacy` module; putting it in Workspace | `domain-map.md` gives Identity the Account and the Profile — the two things being erased. A new module would own no table and exist only to call other modules, which is a service, not a bounded context (`BE_03`) |
| D2 | **Tombstone in place: the `User` row survives, blanked.** `name` becomes a fixed placeholder, `email` becomes `erased-<accountId>@invalid`, `image` becomes null, `Profile` is deleted | hard-delete the `User` row and let the cascade run; insert a separate tombstone row | **The pivotal decision, and the code settles it.** `prisma-account.query.ts:24` resolves every person through `user.findMany` joined to `profile`, and `AccountSummaryPort`'s own contract says *"Unknown ids are left out."* So a hard delete does not render a missing person — it **silently drops them from the result**, and every list that renders a Giver loses a row rather than showing a placeholder. Keeping the row avoids that entirely, and §4.2 shows it needs no consumer change at all. `.invalid` is reserved by RFC 2606, so the address can never be routed or re-registered |
| D3 | **Each module holding personal data publishes a `ForgetPersonPort`** with one method, `forget(accountId)` | Identity reaching into other modules' tables; a domain event per module | `BE_03` R7 forbids the first outright. An event needs an outbox to be reliable and `BE_17` is `todo`, so a published port called in sequence is the honest shape — the same choice `0021`/`0022` already made for `PersonNotifierPort`. Interprets `BE_16` (§8) |
| D4 | **A sequence of per-module transactions, not one transaction** | one `UnitOfWork` spanning modules | `AGENTS.md` §6, not negotiable. The cost is that a crash can leave a half-erased person, which D5 exists to make recoverable rather than to pretend away |
| D5 | **An `ErasureRequest` row drives and records the sequence**, with a completed-steps list | doing it in one request and hoping; a queue | Delivers requirement rules 6, 8 and 9 at once: it is the audit record, the resume point, and the thing that stays visibly open if a step fails. Without it, rule 6 is unimplementable |
| D6 | **Every step is idempotent and keyed on `accountId`** — `UPDATE … WHERE accountId = ?`, `DELETE … WHERE accountId = ?` | marking rows as processed | Re-running a completed step is a no-op by construction, so resume needs no reasoning about what already ran. The step list in D5 is an optimisation and an audit trail, never a correctness requirement |
| D7 | **Names rendered at read time are not written; names stored as copies are scrubbed** | scrubbing everything; scrubbing nothing | Falls directly out of D2 and fact 3. A Giver's name is resolved from the `User` row at read time, so the tombstone handles it with zero writes. A Mention's `displayName` is a stored copy, so it must be overwritten. This split is why the port in D3 has work to do in exactly three modules and no work at all in the rest |
| D8 | **Sessions and sign-in methods are deleted in the first step**, before anything else | letting the 7-day session expiry run out | A person who asked to be erased must not still be signed in on another device while the sequence runs. It also makes the sequence safe: nothing the erased person does can race it |
| D9 | **The last-Admin invariant is checked inside the same advisory lock Deactivate uses** — `UnitOfWork`'s `serializeOn`, keyed on the Workspace | checking before the sequence starts | `prisma-unit-of-work.adapter.ts:34` takes `pg_advisory_xact_lock(hashtext(key))`; ADR 0046 and 0047 already serialize Role changes and Deactivate on the Workspace. A check outside the lock is a check-then-act race (`BE_12`) — two sole Admins of two Workspaces erasing at once is the obvious case, and the less obvious one is an Admin being demoted while an erasure is in flight |
| D10 | **Three `@@index([accountId])` are added** to `FeedbackMention`, `FeedbackRequestMention` and `KudosMention` | relying on the composite PK; a background scrub | Fact 4 — their PK leads with `feedbackId`, so a `WHERE account_id = ?` cannot seek it and scans instead. The index costs a few MB and is the difference between erasure being O(this person's rows) and O(every mention ever written) |
| D11 | **The classification is a `///` doc comment on the field**, in Prisma's own documentation syntax, checked by a script in `apps/api/scripts/` | a separate data-map document; a spreadsheet | `GEN_09` R3 says *"write the classification down next to the field"*, and its Open questions name exactly this guardrail. A document beside the schema goes stale the first busy week; a comment that CI enforces cannot. It also puts the retention statement where R5's own Open question says it currently has to live |
| D12 | **The erasure route is `POST /v1/accounts/mine/erasure`** — the caller is always the subject | `DELETE /v1/accounts/{accountId}` | Requirement §7 Q2 recommends no Admin-initiated erasure. A surface with no way to name another person makes that a property of the API's shape rather than a guard somebody can forget — the same argument `0022` D11 used for Notifications. `BE_07`: it creates an `ErasureRequest`, so it is a `POST` to a resource, not a `DELETE` of one |
| D13 | **No scheduler, no retry loop.** A failed step leaves the request open; retry is a second call to the same endpoint, which resumes | a background job that sweeps stuck requests | `BE_18` is `todo` and there is no queue, no clock and no worker (`PROJECT.md` §4). Inventing one for this feature is a large dependency for a rare event. **Stated cost:** a request that fails its last step stays open until somebody calls again, and nothing notices automatically. §10 R2 |
| D14 | **PR-0001 and PR-0002 ship before and independently of the erasure itself** | one card for all of it | The classification is what tells the erasure path which fields to touch, and it is valuable on its own even if §7 is never answered. It is also the only part that is not blocked on a product decision |

## 3. Domain model

Identity gains one aggregate and one value object. No other module gains anything — they gain a port
implementation, which is infrastructure.

```
modules/identity/
  domain/
    entity/erasure-request.entity.ts      ErasureRequest
    value-object/erasure-step.vo.ts       ErasureStep, the ordered enum
    repository/erasure-request.repository.ts
  application/
    port/forget-person.port.ts            published BY each module, consumed here
    use-cases/erase-my-account.use-case.ts
  infrastructure/
    repository/prisma-erasure-request.repository.ts
  presentation/
    accounts-erasure.controller.ts
```

**`ErasureRequest`** — one per request, keyed on the Account.

| Field | Class | Meaning |
| --- | --- | --- |
| `id` | internal | UUIDv7 (`GEN_11`) |
| `accountId` | internal | who is being erased. Keeps its value after the tombstone, which is the point |
| `requestedAt` | internal | when they asked |
| `completedSteps` | internal | the steps finished, in order |
| `completedAt` | internal | null while open |

**It stores no personal data at all.** Not the email, not the name, not an IP. That is deliberate and it
is the one record that outlives the erasure — an audit row that retained personal data would defeat the
feature it audits (`GEN_09` R3, R5).

**`ErasureStep`** — ordered, because the order carries meaning (D8):

```
REVOKE_ACCESS → LEAVE_WORKSPACES → SCRUB_FEEDBACK → SCRUB_KUDOS → CLEAR_NOTIFICATIONS → TOMBSTONE
```

**`ForgetPersonPort`** — the one method each module publishes:

```ts
export interface ForgetPersonPort {
  forget(accountId: string): Promise<void>;
}
```

One method, no return value, idempotent by contract (D6). A module with nothing to forget does not
implement it; today that is every module except Workspace, Feedback, Kudos and Notifications.

## 4. How it fits together

### 4.1 The erasure sequence

Each numbered step is **its own transaction in its own module**. Between any two, the process can die.

| Step | Module | What it does | Why here |
| --- | --- | --- | --- |
| 1 `REVOKE_ACCESS` | Identity | Delete every `Session` and every `Account` (sign-in method) for the person | D8. They are signed out everywhere before anything else changes, and nothing they do can race the rest |
| 2 `LEAVE_WORKSPACES` | Workspace | Under `serializeOn: workspaceId` per Workspace: refuse if they are the last active Admin (§7 Q3), else delete their `Member` rows; delete Pending `Invitation`s they sent and any Invitation addressed to their email | D9. Invitations addressed to them hold their email — personal data that lives outside Identity. Invitations they *sent* hold somebody else's, so only Pending ones are revoked; the rest point at the tombstone |
| 3 `SCRUB_FEEDBACK` | Feedback | `UPDATE feedback_mention SET slug = …, display_name = … WHERE account_id = ?`, same for `feedback_request_mention` | D7. The stored copies of their name. `giverAccountId`, `accountId` on receivers and selected people are **left alone** — they are ids, not personal data, and they resolve to the tombstone |
| 4 `SCRUB_KUDOS` | Kudos | The same for `kudos_mention` | Same reason. Separate step because `ADR 0060` makes Kudos its own aggregate |
| 5 `CLEAR_NOTIFICATIONS` | Notifications | Delete their `LinkedAccount` rows and every `Notification` where they are the recipient | `LinkedAccount` holds an external user id — a cross-service identifier, `sensitive` under `GEN_09` R3. Their own Notifications are about them and nobody else reads them, so they are deleted outright rather than scrubbed |
| 6 `TOMBSTONE` | Identity | Delete `Profile`; set `user.name` to the placeholder, `user.email` to `erased-<accountId>@invalid`, `user.image` to null; stamp `completedAt` | Last, because every earlier step is keyed on `accountId` and this is the step after which the person is no longer identifiable |

After each step the `ErasureRequest` appends that step and commits. Resuming means reading
`completedSteps` and continuing — and because of D6, re-running one that already ran is harmless, so a
crash *during* a step costs nothing either.

### 4.2 The read path, which does not change

This is the section worth checking, because the claim is that almost nothing changes.

A screen rendering Feedback resolves people through `AccountSummaryPort.summariesOf`, implemented at
`prisma-account.query.ts:24` as a `user.findMany` joined to `profile`. After erasure the `user` row
still exists, so the person is still **returned**; `Profile` is gone, so `fullName`, `displayName` and
`slug` come back `null`, and `photoUrl` is null.

**And that null state is already modelled.** `AccountSummary` documents `displayName` as *"`null` while
the Account has not introduced itself"* — the state of somebody who signed in but has not finished
*Introduce yourself* (#61). Every consumer already handles it. So the tombstone does not produce a new
state for the web to learn; it reuses one that has existed since the sign-up path was built.

| Screen | Change needed |
| --- | --- |
| Workspace feed | **none** |
| *Feedback for me*, *Shared with me*, My requests, My activity | **none** |
| An answer on a request | **none** |
| A Mention inside text | **none at render time** — the stored `displayName` was overwritten in step 3 |
| Teammate picker, Mention autocomplete, Members list | **none** — all three read active `Member` rows, which step 2 deleted |

The one thing to confirm rather than assume: **what the web already renders for a null `displayName`.**
It renders something today, for the not-yet-introduced case, and whatever that is becomes the erased
person's label by default. If it reads as "unknown" that is acceptable; if it reads as "finish setting
up your profile" it is wrong in this context and needs one branch. **This is a ten-minute check in
`apps/web` before PR-0003 starts, and it is the only open question in the read path** — §11 item 1.

### 4.3 Cost

The sequence is six transactions, each a handful of indexed statements. The only one that could be slow
is step 3, and only without D10:

| | Without `@@index([accountId])` | With |
| --- | --- | --- |
| `feedback_mention` scrub | sequential scan of every mention ever written | index scan of this person's |
| At 50 Members × 2 years | tens of thousands of rows scanned, twice | tens of rows |

Not a performance problem at today's size — it is a correctness-of-growth problem, and the index costs
a few megabytes. Measure it the way the repo already does: the integration suite times the scrub against
a seeded database before and after.

### 4.4 The two things that can refuse

`BE_09` — both are domain errors, not infrastructure failures:

| Error | When | HTTP |
| --- | --- | --- |
| `LastAdminCannotEraseError` | §7 Q3 — they are the only active Admin of at least one Workspace. Names the Workspaces | `409` |
| `ErasureAlreadyInProgressError` | A request is already open for this Account | `409`, and the response carries the open request so the web can resume rather than start again |

## 5. Web

One screen, in the existing Settings → Account route (`FE_01`, `FE_08`).

- The control is a destructive button, below Linked Accounts, visually separated — `FE_02`/`FE_04`,
  tokens only.
- Pressing it opens a dialog (`Drawer`/`Dialog` already exist, ADR 0066) with three sentences: it cannot
  be undone; your name disappears from everything; the Feedback you wrote stays, so the people you wrote
  it about keep it.
- Confirmation is **typing your own email address**, not a checkbox (`requirement.md` §4 step 4).
- On success the web clears the session and lands on the signed-out page. This is a server action, as
  `SessionRefresher` already is — the browser cannot reach the API (`0022` D10, `FE_09`).
- `409 LastAdminCannotEraseError` renders inline, naming the Workspaces and linking to Members so they
  can hand over Admin. Not a toast — it is an instruction, not a notification.

## 6. Schema and migration

`BE_15`: forward-only, one migration, expand/contract where a column goes.

**Added**

```prisma
/// A request to Erase an Account (glossary: Erase). Holds no personal data by design.
model ErasureRequest {
  id             String        @id
  /// internal · the Account being erased; survives the tombstone, which is how a resume finds its work.
  accountId      String
  /// internal · retained indefinitely as the audit record (GEN_09 R3).
  requestedAt    DateTime      @default(now())
  completedSteps ErasureStep[]
  completedAt    DateTime?

  @@unique([accountId])
}
```

**Changed**

- `@@index([accountId])` on `FeedbackMention`, `FeedbackRequestMention`, `KudosMention` (D10).
- `Session.ipAddress` and `Session.userAgent` **dropped** (PR-0002). Expand/contract: stop writing them
  first — Better Auth's own option — then drop the columns in a later migration, so a rolling deploy
  never has new code meeting an old schema or the reverse.
- Every field in the schema gains a `/// <class> · <meaning>` comment, and every `personal` or
  `sensitive` one a retention line (PR-0001). No DDL; Prisma comments do not alter the database.

**The classification, applied.** The full pass is PR-0001's deliverable; the shape:

| Table | Fields | Class |
| --- | --- | --- |
| `User` | `name`, `email`, `image` | **personal** — removed on Erase |
| `Account` | `accessToken`, `refreshToken` | **sensitive** — encrypted at rest already (`auth.ts:72`), deleted on Erase |
| `Session` | `token` | **sensitive**; `ipAddress`, `userAgent` **personal**, and dropped because nothing reads them |
| `Profile` | `fullName`, `displayName`, `slug` | **personal** — deleted on Erase |
| `Feedback`, `FeedbackRequest`, `Kudos` | `message` | **personal** — free text about a person. Kept on Erase, per §7 Q1 |
| `*Mention` | `displayName`, `slug` | **personal** — scrubbed on Erase |
| `LinkedAccount` | `externalUserId`, `directChannelId` | **sensitive** — a cross-service identifier |
| everything else | ids, timestamps, enums, counts | **internal** |

**The guardrail.** `apps/api/scripts/check-data-classification.mjs`, run in the *Architecture* CI job
beside `check-architecture.mjs`: parse `schema.prisma`, fail on any scalar field without a class, and on
any `personal`/`sensitive` field without a retention line. It gets a fixture under
`scripts/arch-fixtures/` that proves it still fails, exactly as every `dependency-cruiser` rule already
does (`PROJECT.md` §4, `INFRA_06`).

## 7. Tests

`BE_11` for the domain, `BE_12` for anything touching the database, `BE_13`/`GEN_10` for the scenarios.

**Unit** — `ErasureRequest`'s step ordering, that appending a completed step twice is a no-op, that an
open request refuses a second.

**Integration**, against real Postgres — this is where the value is:

- Each `ForgetPersonPort` implementation, run **twice**, asserting the second run changes nothing (D6).
- Step 2 refusing a sole Admin, and allowing them once a second Admin exists.
- Two concurrent erasures of two sole Admins of the same Workspace: exactly one succeeds (D9). This is
  the test that fails if `serializeOn` is dropped, and it is the reason the lock is in the design.
- **The grep test**: seed a Workspace, erase a person, then assert their Display name appears in **no
  column of any table**. Written as a query over `information_schema`, so a table added next year is
  covered without anybody remembering to update it. This is the only test that catches the §1 failure
  mode on a table that does not exist yet.

**Gherkin** (`features/`, `@api`) — the §4 walk as scenarios: erase, then read the feed, a Mention, and
*Feedback for me* as another Member; the sole-Admin refusal; signing in again (per §7 Q4).

**Deliberately not tested:** that Discord forgets anything. It does not, brain `ADR-0045` says so, and a
test asserting otherwise would be a lie.

## 8. `todo` convention entries interpreted

`AGENTS.md` §2 requires naming these. Three, and none of them conflict.

| Entry | Its binding index text | How this design reads it |
| --- | --- | --- |
| `BE_16` Inter-module communication (P2) | *"Direct call vs domain event vs read model, how to choose, anti-corruption layers, and why the forbidden cross-module join has no exception"* | Taken as: a **published port, called directly**, is the sanctioned shape when the caller needs to know the work finished. An event would need the outbox `BE_17` (also `todo`) describes. This matches what `0021`/`0022` already did with `PersonNotifierPort`, so it sets no new precedent — **D3** |
| `BE_22` Application security hardening (P2) | *"Rate limiting, CORS, headers, input sanitization, mass assignment, SSRF and injection defenses, file-upload rules, **audit trail**"* | Only the audit-trail clause is used, and narrowly: `ErasureRequest` records that an erasure happened and which steps ran. Nothing here decides the general audit-trail shape, and rate limiting is explicitly left to `BE_22`'s own card — **D5** |
| `BE_14` Transactions & unit of work (P2) | *"Where a transaction begins and ends, propagation, and what must never share one"* | ADR 0031 is the interim and already answers it: one transaction per use case through `UnitOfWork`, optionally serialized. This design adds no new reading — it uses `serializeOn` exactly as ADR 0046 and 0047 do — **D9** |

**No conflict found between any two**, which is what `AGENTS.md` §2 says to stop and ask about.

## 9. Execution plan

Four pull requests, in order. The first two are unblocked today.

| | PR | Depends on | What lands | Rough size |
| --- | --- | --- | --- | --- |
| 1 | **Classify every stored field** | nothing | `///` class + retention on every field; `check-data-classification.mjs`; its fixture; the CI wiring | S — a day, mostly reading the schema carefully |
| 2 | **Stop collecting what nothing reads** | 1 | Better Auth stops capturing IP/UA; expired sessions pruned; the two columns dropped in a follow-up migration | S — half a day |
| 3 | **A person can erase their Account** | brain `ADR-0049`, 1 | `ErasureRequest`; `ForgetPersonPort` in four modules; the sequence; the three indexes; the route; integration + Gherkin | L — the bulk of it |
| 4 | **Erase from Settings → Account** | 3 | The screen, the dialog, the typed confirmation, the sign-out, the `409` states | M |

**How I would run it, concretely:**

1. **Before any code:** take `requirement.md` §7 to kritpavin and get Q1–Q3 answered. That is a
   conversation, it is the critical path for PR-0003, and nothing I can do moves it. Write the answers
   as brain `ADR-0049` (next free number — `ADR-0048` is the latest). It is append-only, so it is worth
   grilling properly before it is written rather than superseding it later.
2. **In parallel, start PR-0001**, which needs none of those answers. Classifying the schema is also how
   I would find anything this design has missed — a `personal` field in a table I have not looked at is
   exactly the kind of thing that turns up on a careful pass and not on a grep.
3. **PR-0002 straight after**, because it is the one live `GEN_09` R5 violation and it is two small
   changes.
4. **PR-0003 as a vertical slice, API-first**, per `AGENTS.md` §7: the port and one module's
   implementation with its integration test, then the remaining three, then the sequence, then the
   route. The grep test (§7) is written early, because it is the one that tells me the design is
   actually complete.
5. **PR-0004 last**, then walk §4 by hand in a browser with two seeded Members. Step 7 is the one to
   watch.
6. **Close the loop in the brain**: the glossary's **Erase** row gains the Q1 answer and moves from
   planned to built; `STATE.md` drops "No PDPA data map" from *Deliberately not done yet*.

**What I would not do:** start PR-0003 before `ADR-0049`. The port shape barely changes between the
answers, but the step-2 and step-3 contents change completely, and building it twice is slower than
waiting for a conversation.

## 10. Risks and sequencing

| | Risk | Mitigation, or the accepted cost |
| --- | --- | --- |
| R1 | **Irreversible, by design.** A bug that erases the wrong person cannot be undone | The route cannot name another person (D12), so the blast radius is the caller. The typed confirmation is the second gate. Accepted beyond that: this is what the glossary row asks for |
| R2 | **A step fails and nothing notices** (D13) | The request stays open and `completedAt` stays null, so it is visible in the database and resumable by a second call. **Accepted**: nothing alerts on it. Closing this properly needs `BE_18`, which is `todo` |
| R3 | **A table added later holds personal data and nobody adds it to the sequence** | The `information_schema` grep test (§7) fails the moment a new column holds the name, without anybody remembering. This is the single most valuable test here |
| R4 | **The free-text body still identifies the person** (`requirement.md` §7.1) | Not solvable by engineering. Handled in the copy: the confirmation says the identifier goes, not that every trace does |
| R5 | **A Member erases mid-session on another device** | Step 1 deletes sessions first (D8), so the other device is signed out at its next request |
| R6 | **PR-0001 finds a field this design has not accounted for** | Expected, and the reason PR-0001 goes first. The sequence gains a step; the shape does not change |

## 11. What this forces elsewhere

Three things, none large, all cheaper now than later:

1. **A placeholder name must be chosen** — product copy, not engineering, and it appears on the feed
   next to real names. Narrower than it first looks, because §4.2 shows an erased person arrives at the
   web as a null `displayName`, which already has a rendering. So the question is only: *does the
   existing null rendering read acceptably for somebody who left, or does erasure need its own word?*
   Check the web first, then decide the copy with the Q1–Q4 answers so it lands in the same ADR.
2. **The sole-founder hole** (`requirement.md` §7.3): a person with no teammates cannot erase themselves
   under any answer to Q3, because there is no one to hand Admin to and no way to delete a Workspace.
   That is a real gap, it is outside this card, and it deserves its own.
3. **Every future module that stores a name** inherits an obligation: publish `ForgetPersonPort`, or
   explain in its design why it has nothing to forget. Worth a line in `BE_16` whenever that document
   stops being `todo`.
