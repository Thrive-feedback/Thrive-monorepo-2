# Technical design · NO-1 Discord direct messages

**Tickets:** [#211](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/211) NO-0001 ·
[#213](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/213) NO-0002 ·
[#214](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/214) NO-0003 ·
[#215](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/215) NO-0004 · Epic
[#13](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/13)
**Product decision:** brain `ADR-0035` §6–§9 — a Member links their own account, three events, no
reminders, skipped quietly, DMs belong to #13
**Status:** draft, 2026-10-17 · **Author:** naroebordin (with Claude) · **Follows:**
`docs/design/0020-connect-a-discord-channel.md`, which it depends on entirely

---

## 1. Context

`0020` connects a Workspace to a Discord server and posts public Feedback into one channel. This is the
other half: telling **one person** something, privately.

| Card | What a Member can do afterwards |
| --- | --- |
| #211 | link their own Discord account to Thrive, and unlink it |
| #213 | get a direct message when somebody asks them for Feedback |
| #214 | get a direct message when somebody answers a request they sent |
| #215 | get a direct message when Feedback is written to them |

**Why these are #13's and not #12's.** `ADR-0035` §9 split it: Integrations owns the connection to
Discord and what a shared channel is told; Notifications owns what an individual person is told and
when. That reversed Epic #13's own scope line, which had put chat notifications out of scope — the
Epic body was amended on 2026-10-17 to say so.

**Why a direct message may say more than a channel post.** `ADR 0039` keeps a Feedback Request to its
Requester and the people it asks. A channel is read by the whole team, so #201 can only ever name who
gave Feedback to whom. A DM has exactly one reader, and that reader is a party — so these messages may
name who asked and what about. That is the whole reason `ADR-0035` chose a bot over a pasted address.

**Two things that are not here, deliberately.** Reminders about unanswered Asks (`ADR-0035` §7:
nothing in Thrive can do something later, and adding a scheduler is bigger than all three messages
together), and any preference beyond linked/not-linked (`ADR-0035` §6: one switch per Member, so the
glossary's *Notification Preference* stays unbuilt).

**Hard prerequisite.** Discord only lets a bot start a conversation with somebody who shares a server
with it. So every card here is blocked by #199, and #200 — disconnecting the server — silently switches
all of it off for a whole Workspace. #200's last acceptance criterion exists for that reason.

## 2. Decisions

| # | Decision | Rejected | Why |
| --- | --- | --- | --- |
| D1 | **A new module, `modules/notifications/`**, owning one table | putting `LinkedAccount` on `profile` in Identity; putting it in Integrations | `domain-map.md` makes Notifications its own bounded context (`Notification`, `Reminder`, `Channel`, `Notification Preference`). Identity owns who a person *is*, not how they are reached. Integrations' **Connection** is defined in the glossary as a *Workspace's* link — a person's own link needed the new word `Linked Account` precisely because it is a different thing |
| D2 | **Notifications publishes a port; Feedback calls it** — `PersonNotifierPort` with `askReceived`, `askAnswered`, `feedbackWritten`, exported from `modules/notifications/index.ts` | a generic `notify({ accountId, message })` in `shared/`; an event bus | §4.3. The established pattern in this repo: Feedback already does `import { WorkspaceMembershipPort } from '@app/modules/workspace'` (ADR 0037). A generic port would force Feedback to compose the prose, and therefore to know the recipient's **language** — which it cannot, because that is on a Profile it does not own. Domain-named methods keep copy and language inside one module |
| D3 | **The Discord client from `0020` D2 is reused**, gaining `openDirectChannel` and `postDirect` | a second client in this module | `0020` D2 put the client in app-level `infrastructure/discord/` for exactly this. One bot token, one rate-limit budget, one place that knows Discord exists |
| D4 | **The DM channel id is cached on the `LinkedAccount` row**, filled on first success | opening a DM channel before every message; caching in Redis | A DM channel between two accounts is stable, and Discord limits how often an app may open one. There is no Redis (`BE_19` is `todo`). A nullable column costs nothing and removes one call from every message after the first |
| D5 | **Notifying happens after the transaction commits, and cannot fail the action** — fire-and-forget with `.catch(logError)` | inside the `UnitOfWork`; awaiting it before responding | `ADR-0035` §8: asking for Feedback must never fail because Discord is unreachable. Inside the transaction it would hold a Postgres connection across two HTTP calls per recipient and could roll back real work over a chat outage |
| D6 | **Unreachable is not an error and is not stored** — logged once, at `warn`, and forgotten | a `deliveryState` column; a banner in Thrive | `ADR-0035` §8, which also rejected telling them inside Thrive: that only reaches somebody who already opened it. A per-Member delivery state is a notification system's bookkeeping, and this is three messages |
| D7 | **A Deactivated Member is never messaged** | messaging anyone with a `LinkedAccount` | #210 added `member.deactivatedAt` (ADR 0047). Somebody Deactivated has been removed from the Workspace's life; a DM about its Feedback would be the only thing still reaching them |
| D8 | **`discordUserId` is globally unique**, and so is `accountId` | unique per Workspace; no constraint | #211 AC 6. One Discord account is one person; letting two Thrive Accounts claim it means one human's notifications arrive for somebody else's work |
| D9 | **`identify` is the only scope asked for**, and the user access token is used once and discarded | storing the user's access token; asking for `guilds` or `email` | All Thrive needs is which Discord account this is. A stored user token is a credential with no consumer — the bot token does the messaging. Asking for `guilds` would let Thrive read every server they are in, for no reason |
| D10 | The callback lands on a **`(signed-in)` web route**, as in `0020` D4 | a `@Public()` API route | Same reason: the API has no public domain (ADR 0027), and the session cookie is `sameSite: 'lax'`. No ADR 0029 exception |
| D12 | **Every message names its Workspace**, carried as an argument on each `PersonNotifierPort` method | leaving it to the link; naming it only when somebody is in more than one | Brain `ADR-0034` made one Account a Member of any number of Workspaces, and a `LinkedAccount` belongs to the Account (§6) — so one Discord conversation carries messages from every Workspace somebody is in. "Nut asked you for feedback" is ambiguous the moment they belong to two, and a link only resolves the ambiguity *after* it is clicked. Naming it conditionally would mean two copies of every message and a count to decide between them |
| D11 | **Four pull requests**, one per card, API and web together per card | one PR per layer | Each card here is small and independently checkable in the browser, which is `workflow.md` §8's test. `GEN_08` R8's contract-first rule is satisfied within each PR because each adds its own routes |

**Not approved yet — this document is the review.**

## 3. Domain model

```
modules/notifications/
  domain/
    value-object/discord-user-id.vo.ts        a snowflake; shares 0020's rule
    notifications.errors.ts
  application/
    port/person-notifier.port.ts              D2 — published; every method takes the Workspace (D12)
    port/discord-identity.port.ts             exchangeCode() → { discordUserId, username }
    use-cases/begin-discord-link.use-case.ts
    use-cases/complete-discord-link.use-case.ts
    use-cases/unlink-discord.use-case.ts
    use-cases/read-my-linked-account.use-case.ts
    service/notification-copy.service.ts       the prose, and later the language
    adapter/discord-person-notifier.adapter.ts implements the published port
    query-port/linked-account.query-port.ts
  infrastructure/
    repository/prisma-linked-account.repository.ts
  presentation/
    linked-account.controller.ts               /v1/linked-accounts/mine — no Workspace in the path
    dto/…
  index.ts                                     exports PersonNotifierPort only
```

`linked-account.controller.ts` sits under `/v1/linked-accounts/mine`, with **no `workspaceId` in the
path** and therefore no `WorkspaceMemberGuard`: a Linked Account belongs to an Account, not to a
Workspace, exactly as `/v1/members/mine` and `/v1/invitations/mine` are the caller's own.

## 4. How it fits together

### 4.1 Linking (#211)

```
Member presses Link Discord in Settings → Account
  web → POST /v1/linked-accounts/mine/discord/link      ← 200 { authorizeUrl }   state as 0020 D5
  browser → discord.com/oauth2/authorize?scope=identify&state&redirect_uri
  Discord → GET https://thriveteam.app/settings/account/discord/callback?code&state   (signed-in web route)
  web → POST /v1/linked-accounts/mine/discord/complete  { code, state }   ← 201 { username, linkedAt }
  web → DELETE /v1/linked-accounts/mine/discord                           ← 204   (unlink)
```

`state` is the same stateless signed token as `0020` D5, bound to the Account — there is no Workspace
to bind to here. Without it, a crafted link makes somebody link **the attacker's** Discord account to
their own Thrive Account, and from then on every notification meant for them arrives somewhere else.
That is the sharpest thing in this design.

New refusals (`BE_09`): `LINK_STATE_INVALID` (validation), `DISCORD_LINK_REFUSED` (conflict),
`DISCORD_ACCOUNT_ALREADY_LINKED` (conflict, D8), `NOT_LINKED` (not_found, on unlink).

### 4.2 Sending one message

```
DiscordPersonNotifier.askReceived({ workspaceId, accountId, requesterName, topic, askId })
  1  linkedAccountQuery.forAccount(accountId)        → none? return, nothing logged
  2  workspaceMembership.isActiveMemberOf(...)       → not active? return (D7)
  3  dmChannelId ?? discord.openDirectChannel(id)    → 403/50007? warn once, return (D6)
  4  copy.askReceived(...)                            → the embed, with ROUTES.homeAsk(askId)
  5  discord.postDirect(dmChannelId, embed)
  6  first success → store dmChannelId (D4)
```

Step 2 needs something Workspace does not publish today. `isMemberOf` answers membership, not
*active* membership, and since #210 a Deactivated person is still a `member` row with a
`deactivatedAt`. **So this needs `isActiveMemberOf`, or `isMemberOf` has to start excluding
Deactivated Members** — a decision for Workspace, in its own code ADR, and the second published-port
amendment this programme has needed after `0020`'s `isAdminOf`. Worth deciding both at once.

### 4.3 Where Feedback calls it

| Card | Use case | After |
| --- | --- | --- |
| #213 | `SendFeedbackRequestUseCase` | the request and its Asks commit — one call per Ask |
| #214 | `AnswerFeedbackAskUseCase` | the answer commits — one call, to the Requester |
| #215 | `OfferFeedbackUseCase` | the Feedback commits — one call to the Receiver, plus one per Selected person |

All after commit, none awaited (D5). #215 fires on `origin === 'OFFERED'` only; a `REQUESTED` answer is
#214's message, and the `CHECK` constraint on `Feedback` (`schema.prisma:244`) is what makes those two
cases exhaustive rather than overlapping — #215 AC 5.

**Naming the Workspace** (D12). Each port method takes `workspaceName` beside `workspaceId`, and
`notification-copy.service.ts` puts it in every message:

```
Nut asked you for feedback in Thrive Team
On: how our standups are going                     ← #213
Ploy answered your request in Thrive Team          ← #214
Nut wrote feedback to you in Thrive Team           ← #215
```

The caller already holds the name — every one of these fires inside a use case running under
`/v1/workspaces/:workspaceId`, where the guard has resolved a `MembershipView` carrying
`workspace.name`. So this costs an argument, not a read.

**Fan-out.** A request asking five people is five calls, each costing one Discord call after the first
message ever sent to that person (D4). One failing must not stop the others, so they go out with
`Promise.allSettled`, not a loop with `await`. At this size that is fine; `BE_18` is where it stops
being, and nothing in this scope goes near it.

## 5. Web

| Card | Where |
| --- | --- |
| #211 | `settings/account/` — a Linked Account row, using `_components/setting-row.tsx` (added by #204 on 2026-10-17), plus `settings/account/discord/callback/page.tsx` |
| #213–#215 | nothing. These are invisible in Thrive by design |

The callback page forwards `code` and `state`, then redirects to a clean address so a `code` does not
sit in browser history. `FD-0017` / PR #140 is still open; if it merges first this follows it.

## 6. Schema and migration

One table, one migration. No existing table touched. `workspaceId` is absent on purpose — a Linked
Account is a person's, not a Workspace's — and `accountId` carries **no foreign key** into Identity's
tables (`BE_03` R7).

```prisma
/// One Member's own link to their Discord account, which is what lets Thrive message them
/// directly. Each Member links their own; its existence is their consent, and unlinking is how
/// they stop being messaged (brain ADR-0035 §6). No access token is kept: Thrive messages as the
/// bot, and the one Discord issued at linking is used once to learn who they are and discarded.
model LinkedAccount {
  id             String   @id
  /// The Account this belongs to. No foreign key: Accounts are Identity's.
  accountId      String
  provider       String
  discordUserId  String
  /// Shown on their Settings so they can see which account is linked. Refreshed when read.
  discordUsername String
  /// The private conversation with the bot, learned on the first message and reused after.
  dmChannelId    String?
  linkedAt       DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([accountId, provider])
  @@unique([provider, discordUserId])
  @@map("linked_account")
}
```

No new configuration: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` and `DISCORD_BOT_TOKEN` are
`0020` §6's, and this reuses all three.

## 7. Tests

| Level | What | Where |
| --- | --- | --- |
| Unit | `state` bound to the Account: refused when re-signed, expired, or carrying another Account | `…complete-discord-link.use-case.spec.ts` |
| Unit | linking refuses a Discord account another Account already holds (D8); unlinking deletes the row | same, + `unlink-discord.use-case.spec.ts` |
| Unit | the user access token is never stored (D9) | `…complete-discord-link.use-case.spec.ts` |
| Unit | notifier returns silently with no Linked Account; skips a **Deactivated** Member (D7); warns once and returns on `50007` (D6) | `discord-person-notifier.adapter.spec.ts` |
| Unit | the DM channel id is stored after the first success and reused after (D4) | same |
| Unit | each of the three use cases still succeeds when the notifier rejects (D5) | the three Feedback use-case specs |
| Unit | `OFFERED` fires #215's message, `REQUESTED` fires #214's, never both | `offer-feedback` + `answer-feedback-ask` specs |
| Integration | both unique indexes hold; a request to five people sends five, with one failure not stopping the rest | `…integration.spec.ts` (`BE_12`, compose Postgres) |
| Gherkin | `@api`: link, read back, unlink; a second Account cannot claim the same Discord account | `features/notifications.feature` (`BE_13`, `GEN_10`) |
| Web | the Linked Account row shows linked and unlinked states; the callback cleans the address | `settings/account/**/*.test.tsx` (`FE_14`) |

The Discord client is faked throughout, as `EmailSender` is. Nothing reaches Discord.

## 8. `todo` convention entries interpreted

| Entry | How this design reads it | Conflict? |
| --- | --- | --- |
| `BE_16` Inter-module communication | reach another module only through what it publishes. D2 follows ADR 0037's pattern; §4.2 needs a **second** amendment (`isActiveMemberOf`) on top of `0020`'s `isAdminOf`. Two in one programme is the signal that `BE_16` should be written rather than interpreted again | none, but see the risk below |
| `BE_17` Outbox & reliable messaging | a lost notification is accepted (D6), named, and left to `BE_17` | none |
| `BE_18` Background jobs | **not needed**, and only because `ADR-0035` §7 dropped reminders. Every message here fires inside a request that is already running | none |
| `BE_19` Redis | not needed; D4 caches on the row instead | none |
| `BE_22` Application security hardening | the `state` token is the trust boundary; §4.1 | none |
| `FE_19` Authentication & protected routes | the callback is an ordinary `(signed-in)` page (D10) | none |

## 9. Execution plan

Four pull requests, one per card, in key order: **#211 → #213 → #214 → #215**.

#211 carries the module, the migration, the OAuth link flow and the Settings row. #213 carries the
published port, the notifier adapter, the copy service, the first Feedback call site, and
`isActiveMemberOf` with its code ADR. #214 and #215 are one call site and one message each — which is
why they are `S` and #213 is `M`.

Code ADR numbers: **0048** is claimed by `0020`'s `isAdminOf`, so this programme's start at **0049**.

## 10. Risks and sequencing

| Risk | Reading |
| --- | --- |
| **`state` on the link flow** | the sharpest thing here. Without it somebody links an attacker's Discord account and every notification meant for them goes elsewhere, silently and indefinitely |
| **Two published-port amendments** | `0020` needs `isAdminOf`, this needs `isActiveMemberOf`. `BE_16` is `todo` and being interpreted twice in one programme. Decide both in one ADR, or write `BE_16` first (#202's sibling) |
| **A DM is the only channel** | somebody who never links Discord is told nothing at all. `ADR-0035` accepted this as a two-speed product; the real answer is #13's in-app and email Notifications, unbuilt |
| **Discord treats bulk DMs as spam** | it is Thrive's whole application that gets rate-limited or disabled, not one customer's Connection. D9's narrow scope, §4.1's self-service linking and `ADR-0035` §7's three events are the mitigation. Watch for `429` on `openDirectChannel` in particular |
| **#200 silently disables all of this** | disconnecting the server stops every DM in that Workspace, because of the shared-server rule. #200's last AC puts that on screen; nothing enforces it in code |
| **One person, many Workspaces** | brain `ADR-0034`. A Linked Account is per Account, so one Discord conversation carries messages from every Workspace somebody belongs to. §4.2 names the Workspace in each; nothing stops two Workspaces' messages interleaving, and nobody has decided whether a Member may link Discord for one Workspace but not another |
| **Fan-out** | `Promise.allSettled` per request, uncapped. A request may ask at most as many people as #30/#31 allow, so it is bounded today — revisit if that cap rises |

## 11. What carries to Slack, and what does not

**Carries unchanged — most of this design.** `PersonNotifierPort` with domain-named methods (D2) is the
piece that pays off: `askReceived`, `askAnswered` and `feedbackWritten` say nothing about Discord, so
Feedback's three call sites never change when a second provider arrives. Likewise D5 (after the commit,
never awaited), D6 (skipped quietly), D7 (never message a Deactivated Member), D12 (name the Workspace),
the `(signed-in)` callback (D10), and `conversations.open` → post being the same two-step shape as
Discord's `openDirectChannel` → `postDirect` (D3, D4).

**Does not carry:**

| | Discord | Slack |
| --- | --- | --- |
| **D8's uniqueness** | a Discord user id is **global**, so `@@unique([provider, discordUserId])` is right | a Slack user id is only unique **within one Slack workspace**. The identifier is the pair `(team, user)`, so that constraint is wrong and the row needs the team beside the user |
| **Who can be messaged** | anybody sharing a server with the bot | anybody in the Slack workspace where the app is installed — same idea, different precondition, so §4.2 step 2 stays but its reason changes |
| **The column names** | `discordUserId`, `discordUsername`, `dmChannelId` | `team`/`user`/`im`. Same proposal as `0020` §11: generic names now, Discord's meaning in the comment |

**The consequence worth seeing early:** a person could link **both** Discord and Slack, and
`@@unique([accountId, provider])` already allows exactly one of each. Nothing in `ADR-0035` says which
one a message should go to, or whether both should fire. That is a product question, not a schema one,
and it is not answered anywhere yet.
