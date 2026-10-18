# Technical design · NO-1 Direct messages through a connected chat tool

**Tickets:** [#211](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/211) NO-0001 ·
[#213](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/213) NO-0002 ·
[#214](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/214) NO-0003 ·
[#215](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/215) NO-0004 · Epic
[#13](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/13)
**Product decision:** brain `ADR-0035` §6–§9 — a Member links their own account, three events, no
reminders, skipped quietly, DMs belong to #13
**Status:** draft, 2026-10-18 · **Author:** naroebordin (with Claude) · **Follows:**
`docs/design/0020-connect-a-discord-channel.md`, which it depends on entirely

---

## 1. Context

`0020` connects a Workspace to a chat tool and posts public Feedback into one channel. This is the
other half: telling **one person** something, privately.

| Card | What a Member can do afterwards |
| --- | --- |
| #211 | link their own chat account to Thrive, and unlink it |
| #213 | get a direct message when somebody asks them for Feedback |
| #214 | get a direct message when somebody answers a request they sent |
| #215 | get a direct message when Feedback is written to them |

**Discord is the only provider these four cards ship.** `ADR-0035` chose Discord first and Slack
second. **This design is nevertheless shaped for several providers** — a decision taken on 2026-10-18,
after a first draft that was Discord-specific throughout. §2 D3 and §11 say what that costs, because it
knowingly inverts `PROJECT.md` §2 ("solve today's problem; do not build for the general case you have
not met yet"). The reasoning: the second provider is named, dated and already has a decision behind it,
and the parts that are expensive to change later — a published port, a table, a unique constraint — are
exactly the parts a second provider breaks.

**Why these are #13's and not #12's.** `ADR-0035` §9 split it: Integrations owns the connection to the
chat tool and what a shared channel is told; Notifications owns what an individual person is told and
when. That reversed Epic #13's own scope line, which had put chat notifications out of scope — the Epic
body was amended on 2026-10-17 to say so.

**Why a direct message may say more than a channel post.** `ADR 0039` keeps a Feedback Request to its
Requester and the people it asks. A channel is read by the whole team, so #201 can only ever name who
gave Feedback to whom. A DM has exactly one reader, and that reader is a party — so these messages may
name who asked and what about. That is the whole reason `ADR-0035` chose a bot over a pasted address.

**Two things that are not here, deliberately.** Reminders about unanswered Asks (`ADR-0035` §7:
nothing in Thrive can do something later, and adding a scheduler is bigger than all three messages
together), and any preference beyond linked/not-linked (`ADR-0035` §6: one switch per Member, so the
glossary's *Notification Preference* stays unbuilt).

**Hard prerequisite.** A chat tool only lets an app start a conversation with somebody it already shares
a space with — a server in Discord, an installed workspace in Slack. So every card here is blocked by
#199, and #200 — disconnecting — silently switches all of it off for a whole Workspace. #200's last
acceptance criterion exists for that reason.

## 2. Decisions

| # | Decision | Rejected | Why |
| --- | --- | --- | --- |
| D1 | **A new module, `modules/notifications/`**, owning one table | putting `LinkedAccount` on `profile` in Identity; putting it in Integrations | `domain-map.md` makes Notifications its own bounded context (`Notification`, `Reminder`, `Channel`, `Notification Preference`). Identity owns who a person *is*, not how they are reached. Integrations' **Connection** is defined in the glossary as a *Workspace's* link — a person's own link needed the new word `Linked Account` precisely because it is a different thing |
| D2 | **Notifications publishes a port; Feedback calls it** — `PersonNotifierPort` with `askReceived`, `askAnswered`, `feedbackWritten`, exported from `modules/notifications/index.ts` | a generic `notify({ accountId, message })` in `shared/`; an event bus | §4.3. The established pattern here: Feedback already does `import { WorkspaceMembershipPort } from '@app/modules/workspace'` (ADR 0037). A generic port would force Feedback to compose the prose, and therefore to know the recipient's **language** — which it cannot, because that is on a Profile it does not own. Domain-named methods keep copy and language in one module, and say nothing about which chat tool delivers them |
| D3 | **Providers are resolved through a registry**: one `ChatProvider` adapter interface, one implementation per provider, chosen by the stored `provider` value | a Discord-only module, generalised when Slack arrives; a `switch` in the use case | **Taken on 2026-10-18 at the author's instruction, against `PROJECT.md` §2.** The retired Go build used exactly this ("providers register by name at startup, so adding one does not touch the service" — brain `research/2026-09-26-…` §9) and it is the one part of that build worth keeping. **Cost, stated plainly:** with one provider the registry is a map with a single entry, and the interface is being designed against one real example — the usual way to get an abstraction wrong. It earns its place only when Slack lands |
| D4 | **The direct-channel id is cached on the `LinkedAccount` row**, filled on first success | opening a conversation before every message; caching in Redis | Both providers return a stable id for a one-to-one conversation (Discord `openDirectChannel`, Slack `conversations.open`) and both limit how often it may be opened. There is no Redis (`BE_19` is `todo`). A nullable column costs nothing and removes one call from every message after the first |
| D5 | **Notifying happens after the transaction commits, and cannot fail the action** — fire-and-forget with `.catch(logError)` | inside the `UnitOfWork`; awaiting it before responding | `ADR-0035` §8: asking for Feedback must never fail because a chat tool is unreachable. Inside the transaction it would hold a Postgres connection across two HTTP calls per recipient and could roll back real work over a chat outage |
| D6 | **Unreachable is not an error and is not stored** — logged once, at `warn`, and forgotten | a `deliveryState` column; a banner in Thrive | `ADR-0035` §8, which also rejected telling them inside Thrive: that only reaches somebody who already opened it. A per-Member delivery state is a notification system's bookkeeping, and this is three messages |
| D7 | **A Deactivated Member is never messaged** | messaging anyone with a `LinkedAccount` | #210 added `member.deactivatedAt` (ADR 0047). Somebody Deactivated has been removed from the Workspace's life; a DM about its Feedback would be the only thing still reaching them |
| D8 | **The identity is the triple `(provider, externalTeamId, externalUserId)`**, and `externalTeamId` is **non-null**, holding `''` where a provider has no such concept | `(provider, externalUserId)`; a nullable team column | A Discord user id is global, so the pair would do — but Slack documents the identifier as `(team, user)` and does not promise the user id alone is enough, and Enterprise Grid complicates it further. **The nullable version is a trap:** Postgres treats NULLs as distinct in a unique index, so `(discord, NULL, U1)` could be inserted twice and the constraint would silently not hold. `''` is ugly and correct; `NULLS NOT DISTINCT` needs Postgres 15+ (we are on 17) but is not reliably expressible through Prisma |
| D9 | **Only an identifying scope is asked for**, and the user access token is used once and discarded | storing the user's access token; asking for anything broader | All Thrive needs is which account this is — Discord's `identify`, Slack's OpenID `identity`. A stored user token is a credential with no consumer, because the bot credential does the messaging. Broader scopes would let Thrive read every space they belong to, for no reason |
| D10 | The callback lands on a **`(signed-in)` web route**, as in `0020` D4 | a `@Public()` API route | Same reason: the API has no public domain (ADR 0027), and the session cookie is `sameSite: 'lax'`. No ADR 0029 exception, for any provider |
| D11 | **Every message names its Workspace**, carried as an argument on each `PersonNotifierPort` method | leaving it to the link; naming it only when somebody is in more than one | Brain `ADR-0034` made one Account a Member of any number of Workspaces, and a `LinkedAccount` belongs to the Account (§6) — so one chat conversation carries messages from every Workspace somebody is in. "Nut asked you for feedback" is ambiguous the moment they belong to two, and a link only resolves it *after* it is clicked. Naming it conditionally would mean two copies of every message and a count to decide between them |
| D12 | **A Member may link one account per provider, and every one of them is messaged** | one linked account in total; a "preferred" provider | `ADR-0035` §6 made linking itself the switch, so a second link is a second "yes" and silently not using it would be the surprising behaviour. **This is a product question the ADR does not answer** (§10) — it is proposed here, and `ADR-0035` should absorb or overturn it before #213 merges. The cost is that somebody who links both is pinged twice |
| D13 | **Four pull requests**, one per card, API and web together per card | one PR per layer | Each card is small and independently checkable in the browser, which is `workflow.md` §8's test. `GEN_08` R8's contract-first rule is satisfied within each PR because each adds its own routes |

**Not approved yet — this document is the review.** D3 and D12 are the two to argue with.

## 3. Domain model

```
modules/notifications/
  domain/
    value-object/provider-account.vo.ts        (provider, externalTeamId, externalUserId) — D8
    notifications.errors.ts
  application/
    port/person-notifier.port.ts               D2 — published; every method names the Workspace (D11)
    port/chat-provider.port.ts                 D3 — ONE interface, implemented per provider:
                                                 authorizeUrl(state) · exchangeCode(code)
                                                 openDirectChannel(ref) · postDirect(channelId, message)
    service/chat-provider.registry.ts          D3 — provider → ChatProvider
    service/notification-copy.service.ts       the prose, and later the language
    adapter/chat-person-notifier.adapter.ts    implements PersonNotifierPort over the registry
    use-cases/begin-account-link.use-case.ts
    use-cases/complete-account-link.use-case.ts
    use-cases/unlink-account.use-case.ts
    use-cases/read-my-linked-accounts.use-case.ts
    query-port/linked-account.query-port.ts
  infrastructure/
    provider/discord-chat-provider.adapter.ts  the only implementation today
    repository/prisma-linked-account.repository.ts
  presentation/
    linked-account.controller.ts               /v1/linked-accounts/mine — no Workspace in the path
    dto/…
  index.ts                                     exports PersonNotifierPort only
```

`ChatProvider` (D3) is the seam. Everything above it — the use cases, the copy, the notifier, the
controller — is written once. Everything a chat tool makes different lives below it, in one file per
provider, plus the shared HTTP client `0020` D2 put in `infrastructure/`.

`linked-account.controller.ts` sits under `/v1/linked-accounts/mine`, with **no `workspaceId` in the
path** and therefore no `WorkspaceMemberGuard`: a Linked Account belongs to an Account, not to a
Workspace, exactly as `/v1/members/mine` and `/v1/invitations/mine` are the caller's own.

## 4. How it fits together

### 4.1 Linking (#211)

```
Member presses Link Discord in Settings → Account
  web → POST   /v1/linked-accounts/mine/{provider}/link      ← 200 { authorizeUrl }    state as 0020 D5
  browser → <provider authorize page>?scope=<identify>&state&redirect_uri
  provider → GET https://thriveteam.app/settings/account/links/{provider}/callback?code&state
  web → POST   /v1/linked-accounts/mine/{provider}/complete  { code, state }  ← 201 { username, linkedAt }
  web → GET    /v1/linked-accounts/mine                      ← 200 { items: [...] }
  web → DELETE /v1/linked-accounts/mine/{provider}           ← 204
```

`{provider}` is a path parameter validated against the registry's keys (D3), so an unknown one is
`PROVIDER_NOT_SUPPORTED` rather than a 404 that looks like a missing route. Today the registry holds
one key.

`state` is the same stateless signed token as `0020` D5, bound to the Account **and the provider** —
there is no Workspace to bind to here. Without it, a crafted link makes somebody link **the attacker's**
chat account to their own Thrive Account, and from then on every notification meant for them arrives
somewhere else. That is the sharpest thing in this design.

New refusals (`BE_09`), none provider-named: `LINK_STATE_INVALID` (validation),
`PROVIDER_NOT_SUPPORTED` (validation), `LINK_REFUSED` (conflict), `ACCOUNT_ALREADY_LINKED` (conflict,
D8), `NOT_LINKED` (not_found, on unlink).

### 4.2 Sending one message

```
ChatPersonNotifier.askReceived({ workspaceId, workspaceName, accountId, requesterName, topic, askId })
  1  linkedAccountQuery.forAccount(accountId)       → none? return, nothing logged
  2  workspaceMembership.isActiveMemberOf(...)      → not active? return (D7)
  3  copy.askReceived(...)                          → one message, with ROUTES.homeAsk(askId)
  4  for each Linked Account (D12), settled in parallel:
       registry.get(provider)
       directChannelId ?? provider.openDirectChannel(ref)   → refused? warn once, skip (D6)
       provider.postDirect(directChannelId, message)
       first success → store directChannelId (D4)
```

The copy is composed **once**, above the registry, because it is the same words whichever tool carries
them. Only rendering differs — a Discord embed, a Slack block — and that belongs in the provider
adapter, which is why `postDirect` takes a message the adapter shapes rather than a string.

Step 2 needs nothing new, **corrected 2026-10-18**: `isMemberOf` already answers *active* membership —
`MembershipQuery.membershipInWorkspace` filters `deactivatedAt: null` (ADR 0047), so a Deactivated
person is not a Member to it. This design read the port's comment, which did not say so; the comment
was fixed alongside `isAdminOf`, which Workspace Goals published first (ADR 0052). There is no
`isActiveMemberOf` to add.

### 4.3 Where Feedback calls it

| Card | Use case | After |
| --- | --- | --- |
| #213 | `SendFeedbackRequestUseCase` | the request and its Asks commit — one call per Ask |
| #214 | `AnswerFeedbackAskUseCase` | the answer commits — one call, to the Requester |
| #215 | `OfferFeedbackUseCase` | the Feedback commits — one call to the Receiver, plus one per Selected person |

All after commit, none awaited (D5). #215 fires on `origin === 'OFFERED'` only; a `REQUESTED` answer is
#214's message, and the `CHECK` constraint on `Feedback` (`schema.prisma:244`) is what makes those two
cases exhaustive rather than overlapping — #215 AC 5.

**Naming the Workspace** (D11). Each port method takes `workspaceName` beside `workspaceId`, and
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

**Fan-out.** A request asking five people is five calls, each costing one provider call after the first
message ever sent to that person (D4), times the number of accounts they have linked (D12). One failing
must not stop the others, so they go out with `Promise.allSettled`, not a loop with `await`. At this
size that is fine; `BE_18` is where it stops being, and nothing in this scope goes near it.

## 5. Web

| Card | Where |
| --- | --- |
| #211 | `settings/account/` — a Linked Accounts row listing each provider and its state, using `_components/setting-row.tsx` (added by #204 on 2026-10-17), plus `settings/account/links/[provider]/callback/page.tsx` |
| #213–#215 | nothing. These are invisible in Thrive by design |

One callback route serves every provider, parameterised the same way the API is. It forwards `code` and
`state`, then redirects to a clean address so a `code` does not sit in browser history. `FD-0017` /
PR #140 is still open; if it merges first this follows it.

## 6. Schema and migration

One table, one migration. No existing table touched. `workspaceId` is absent on purpose — a Linked
Account is a person's, not a Workspace's — and `accountId` carries **no foreign key** into Identity's
tables (`BE_03` R7).

```prisma
/// One Member's own link to their account in a connected chat tool, which is what lets Thrive
/// message them directly. Each Member links their own; its existence is their consent, and
/// unlinking is how they stop being messaged (brain ADR-0035 §6). No user access token is kept:
/// Thrive messages with the Workspace's own credential, and the token the provider issues at
/// linking is used once to learn who they are and discarded.
model LinkedAccount {
  id               String   @id
  /// The Account this belongs to. No foreign key: Accounts are Identity's.
  accountId        String
  /// Which chat tool. One row per Account per provider; every one of them is messaged.
  provider         String
  /// The provider's own workspace, where it has one — a Slack team. **Empty string, never null,**
  /// for a provider whose user ids stand alone (Discord): Postgres treats NULLs as distinct, so a
  /// nullable column would make the unique index below silently stop holding.
  externalTeamId   String
  /// The provider's id for this person.
  externalUserId   String
  /// Shown on their Settings so they can see which account is linked. Refreshed when read.
  externalUsername String
  /// The one-to-one conversation, learned on the first message and reused after.
  directChannelId  String?
  linkedAt         DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([accountId, provider])
  @@unique([provider, externalTeamId, externalUserId])
  @@map("linked_account")
}
```

No new configuration: `0020` §6's three values are reused, and a second provider adds its own.

## 7. Tests

| Level | What | Where |
| --- | --- | --- |
| Unit | `state` bound to Account **and provider**: refused when re-signed, expired, or carrying either of another | `…complete-account-link.use-case.spec.ts` |
| Unit | an unknown provider is `PROVIDER_NOT_SUPPORTED`, not a 404 | same |
| Unit | linking refuses an account another Account already holds (D8); unlinking deletes the row | same, + `unlink-account.use-case.spec.ts` |
| Unit | the user access token is never stored (D9) | `…complete-account-link.use-case.spec.ts` |
| Unit | notifier returns silently with no Linked Account; skips a **Deactivated** Member (D7); warns once and skips when a provider refuses the conversation (D6) | `chat-person-notifier.adapter.spec.ts` |
| Unit | with two Linked Accounts both are messaged, and one failing does not stop the other (D12) | same |
| Unit | the direct-channel id is stored after the first success and reused after (D4) | same |
| Unit | each of the three use cases still succeeds when the notifier rejects (D5) | the three Feedback use-case specs |
| Unit | `OFFERED` fires #215's message, `REQUESTED` fires #214's, never both | `offer-feedback` + `answer-feedback-ask` specs |
| Integration | **both unique indexes hold, including two rows that differ only by `externalTeamId`** — the D8 trap, proved against real Postgres | `…integration.spec.ts` (`BE_12`, compose Postgres) |
| Gherkin | `@api`: link, read back, unlink; a second Account cannot claim the same provider account | `features/notifications.feature` (`BE_13`, `GEN_10`) |
| Web | the Linked Accounts row shows each provider's state; the callback cleans the address | `settings/account/**/*.test.tsx` (`FE_14`) |

Every `ChatProvider` is faked, as `EmailSender` is. Nothing reaches a chat tool. **A fake second
provider in the tests is what proves D3's seam** — otherwise the registry is an abstraction with one
implementation and no evidence.

## 8. `todo` convention entries interpreted

| Entry | How this design reads it | Conflict? |
| --- | --- | --- |
| `BE_16` Inter-module communication | reach another module only through what it publishes. D2 follows ADR 0037's pattern; §4.2 needs a **second** amendment (`isActiveMemberOf`) on top of `0020`'s `isAdminOf`. Two in one programme is the signal that `BE_16` should be written rather than interpreted again | none, but see §10 |
| `BE_17` Outbox & reliable messaging | a lost notification is accepted (D6), named, and left to `BE_17` | none |
| `BE_18` Background jobs | **not needed**, and only because `ADR-0035` §7 dropped reminders. Every message fires inside a request that is already running | none |
| `BE_19` Redis | not needed; D4 caches on the row instead | none |
| `BE_22` Application security hardening | the `state` token is the trust boundary; §4.1 | none |
| `BE_23` External integrations | one interface, one adapter per provider, behind `0020`'s shared client — which is what #202 will write up | none |
| `FE_19` Authentication & protected routes | the callback is an ordinary `(signed-in)` page (D10) | none |

## 9. Execution plan

Four pull requests, one per card, in key order: **#211 → #213 → #214 → #215**.

#211 carries the module, the migration, the `ChatProvider` interface and registry, the Discord adapter,
the link flow and the Settings row. #213 carries the published port, the notifier, the copy service, the
first Feedback call site, and `isActiveMemberOf` with its code ADR. #214 and #215 are one call site and
one message each — which is why they are `S` and #213 is `M`.

Code ADR numbers: **0048** is claimed by `0020`'s `isAdminOf`, so this programme starts at **0049**.

## 10. Risks and sequencing

| Risk | Reading |
| --- | --- |
| **`state` on the link flow** | the sharpest thing here. Without it somebody links an attacker's chat account and every notification meant for them goes elsewhere, silently and indefinitely |
| **D3 is an abstraction with one implementation** | taken at the author's instruction against `PROJECT.md` §2. The honest mitigation is §7's fake second provider; the honest risk is that Slack turns out not to fit the interface and it is rewritten anyway, having cost something in the meantime |
| **D12 is not in the ADR** | "every linked account is messaged" is a product decision made in a design document. `ADR-0035` §6 implies it but does not say it. Settle it there before #213 merges |
| ~~**Two published-port amendments**~~ | **Resolved 2026-10-18 while building #199.** There is only one: `isMemberOf` already excludes Deactivated Members (`membershipInWorkspace` filters `deactivatedAt: null`, ADR 0047), so §4.2's step 2 needs no `isActiveMemberOf` — the port's comment was imprecise and now says so. `0020`'s `isAdminOf` was overtaken entirely: Workspace Goals published it first, under **ADR 0052**, so this programme writes neither. `BE_16` is still `todo` and was interpreted once, not twice |
| **A DM is the only channel** | somebody who never links is told nothing at all. `ADR-0035` accepted this as a two-speed product; the real answer is #13's in-app and email Notifications, unbuilt |
| **Chat tools treat bulk DMs as spam** | it is Thrive's whole application that gets rate-limited or disabled, not one customer's Connection. D9's narrow scope, §4.1's self-service linking and `ADR-0035` §7's three events are the mitigation |
| **#200 silently disables all of this** | disconnecting stops every DM in that Workspace, because of the shared-space rule. #200's last AC puts that on screen; nothing enforces it in code |
| **One person, many Workspaces** | brain `ADR-0034`. A Linked Account is per Account, so one conversation carries messages from every Workspace somebody belongs to. D11 names the Workspace in each; nothing stops two Workspaces' messages interleaving, and nobody has decided whether a Member may link for one Workspace but not another |
| **Fan-out** | `Promise.allSettled`, uncapped, now multiplied by linked accounts (D12). Bounded today by how many people #30/#31 let a request ask — revisit if that cap rises |

## 11. Adding a provider — the checklist

What D3 buys, stated as the work a second provider actually costs:

| | |
| --- | --- |
| **Write** | one `infrastructure/provider/<name>-chat-provider.adapter.ts` — authorize URL, code exchange, open conversation, post — and register it |
| **Write** | its message rendering, because the copy is shared but the format is not |
| **Add** | its credentials to configuration, and `0020`'s per-Workspace credential if it issues one (Slack does; Discord does not — `0020` D3) |
| **Add** | a row to the Settings screen, which already lists providers rather than naming one |
| **Change** | nothing in `PersonNotifierPort`, the use cases, the copy service, the controller, the routes, the error codes, the table or Feedback's three call sites |

**What is still not provider-neutral, honestly:** `externalTeamId` carrying `''` for Discord is a
compromise (D8), and `0020`'s Connection table has no credential column at all, so the first provider
that issues a per-Workspace token still brings a migration. Both are named in `0020` §11.
