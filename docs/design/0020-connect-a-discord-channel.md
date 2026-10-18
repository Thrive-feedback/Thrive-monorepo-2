# Technical design · IT-1 Connect a chat tool and choose a channel (Discord first)

**Ticket:** [#199](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/199) IT-0001 · Epic
[#12](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/12)
**Product decision:** brain `ADR-0035` — Discord first; a bot, a server Connection and a per-Member
Linked Account; outbound only
**Status:** draft, 2026-10-17 · **Author:** naroebordin (with Claude) · **Follows:** nothing — first
design in the Integrations module · **Paired with:** `docs/design/0021-discord-direct-messages.md`
(Epic #13's half)

---

## 1. Context

Epic #12's scope gate — no Integration before the feedback loop works in the browser — passed on
2026-10-16. `ADR-0035` then chose Discord, and chose a **bot** rather than a pasted channel address,
because a pasted address can only ever post to its one channel and the point of this programme is also
to message one person (Epic #13, `NO-0001`–`NO-0004`).

| Card | What a Member can do afterwards |
| --- | --- |
| #199 | an Admin adds the Thrive bot to their Discord server, picks a channel, and sees a test message arrive |
| #200 | disconnect it, and Thrive leaves the server |
| #201 | public Feedback and its Topic appear in that channel |
| #211→#215 | a Member links their own Discord account and is messaged directly (Epic #13) |

**What #199 is really buying.** The Discord calls are small. What this Task pays for and everything
after it inherits:

1. a module holding a Workspace's Connection,
2. **one Discord client for all of Thrive**, which #13's direct messages reuse unchanged,
3. a Role check in a module that is not Workspace — §4.4, the part to read twice.

**An earlier draft of this document is void.** It had the Admin paste a webhook address, which meant a
person-supplied URL the API would then call, an SSRF host allowlist, and a per-Workspace secret
encrypted at rest. `ADR-0035` replaced all of it with a bot. There is now no person-supplied URL, and
what a Workspace stores — a server id and a channel id — is not secret at all. Three of that draft's ten
decisions survive; see D-void at the end of §2.

**The retired build is the warning, not the spec.** `thrive-monorepo` shipped Slack and Discord and
stored its chat token unencrypted, saying so in its own source (brain
`research/2026-09-26-legacy-thrive-monorepo-as-built.md` §9). Read for the endpoint shape, ported for
nothing (ADR 0009).

## 2. Decisions

| # | Decision | Rejected | Why |
| --- | --- | --- | --- |
| D1 | **A new module, `modules/integrations/`**, owning one table | a section of Workspace | `domain-map.md` makes Integrations its own bounded context with its own nouns. `BE_03` R7. Workspace owning it would make "which chat tool a team uses" a fact about Workspaces |
| D2 | **The chat client is app-level infrastructure** — a port in `shared/application/`, one adapter per provider under `infrastructure/chat/<provider>/`, bound by a `ChatModule` | a client inside `modules/integrations/infrastructure/` | Exactly `EmailSender`'s shape, and for the same stated reason: it belongs to no capability. Epic #13's direct messages are **not** Integrations' code, and if the client lives inside this module, #13 either reaches into it (breaking `BE_03` R4) or builds a second one |
| D3 | **No credential is stored per Workspace, because Discord does not issue one.** A Workspace stores identifiers only | the previous draft's `SecretCipher`; adding a nullable `secret` column now, for Slack | For Discord neither value is secret: a server id is known to everyone in it, and a channel id grants nothing. Thrive's bot credential is one config value (§6). **This is the one decision that does not generalise** — Slack issues a bot token per installed workspace, so the first such provider brings a column *and* the cipher *and* the key management, together, when they have a consumer. Adding the empty column now would be a knob with no reader (`AGENTS.md`), and a migration on a pre-launch table with no users costs nothing |
| D4 | **The OAuth redirect lands on a `(signed-in)` web route**, which forwards to an ordinary authenticated API route | a `@Public()` API callback | **Discord cannot reach the API** — it has no public domain, and the browser only ever reaches the web origin (ADR 0027, `PROJECT.md`). The session cookie is `sameSite: 'lax'`, so it travels on Discord's top-level GET redirect. **So ADR 0029 needs no exception** — a correction to the earlier draft, which had this as Thrive's first public route |
| D5 | **`state` is a stateless signed token** — HMAC over `{accountId, workspaceId, nonce, exp}`, 5-minute life | a `oauth_state` table; Redis | There is no Redis (`BE_19` is `todo`) and a table for a value that lives five minutes is a migration plus a sweeper. Being signed and short-lived is what a `state` needs. Replayable within its window — accepted, because connecting twice replaces rather than accumulates (D7) |
| D6 | **The returned `guild_id` is never trusted.** The `code` is exchanged with Discord, and the guild is read from Discord's answer | reading `?guild_id=` from the redirect | That parameter arrives through the person's browser and anyone can craft it. Trusting it lets somebody connect *their* server to *your* Workspace by handing you a link. The code exchange is the only authenticated proof of which server was authorised |
| D7 | One Connection per Workspace, enforced in the **application layer**; the unique index is `(workspaceId, provider)` | a unique index on `workspaceId` alone | The precedent of `AlreadyInAWorkspaceError`, whose comment reads *"Held here rather than in the schema, so letting a person belong to several later is deleting this check."* Slack arriving must not be a migration |
| D8 | Workspace's published port gains **`isAdminOf`** — a fact, not a capability | `mayManageIntegrations` on the port; publishing the Role value | §4.4. Amends ADR 0037's published surface, so it carries its own code ADR |
| D9 | **The channel list is offered from the provider, and confirmed by posting** | computing each channel's effective permissions before offering it | Channel overwrites, role order and category inheritance are Discord's permission algebra; reimplementing it client-side is a large amount of code that is wrong at the edges. Offer the text channels, let the test post be the proof (#199 AC 4) |
| D10 | **No `UnitOfWork`** | a transaction around exchange → list → post → write | One row, one statement. A transaction held open across three Discord calls holds a Postgres connection for tens of seconds. ADR 0031 is for use cases that write more than once |
| D11 | Two pull requests: API, then web | one PR | `GEN_08` R8 — the contract ships before what consumes it |
| D12 | **Installs go through a registry**, one `ChatInstaller` per provider, chosen by the `provider` value — the same seam `0021` D3 uses for messaging | a Discord-only module, generalised when Slack arrives | Taken 2026-10-18 at the author's instruction, against `PROJECT.md` §2, and with the same stated cost: today it is a map with one entry and an interface designed against one example. `0021` §7's fake second provider is what keeps it honest |

**D-void** — from the superseded draft: the `DiscordWebhookAddress` value object and its host allowlist,
the `SecretCipher` port and encrypted `secret` column, reading the channel name off the webhook, and the
201-with-body shape of a connect-by-paste route. All removed. Surviving unchanged: D1, D7 (was D6), D10
(was D7), D8, D11 (was D9).

**Not approved yet — this document is the review.**

## 3. Domain model

`glossary.md` covers it, with one row added on 2026-10-17 for `ADR-0035` §6.

| Glossary | In code | Here |
| --- | --- | --- |
| Integration | `Integration` | not a table — the provider is an enum value |
| Connection | `IntegrationConnection` | the one table this module owns: a Workspace, a guild, a channel |
| **Linked Account** *(new)* | `LinkedAccount` | **not this Task's** — `NO-0001`, and it belongs to Notifications |
| Channel | `NotificationChannel` | not this Task's — #13's, for where a Notification is delivered |
| Trigger | `IntegrationTrigger` | inbound only; `ADR-0035` §3 defers it |

```
modules/integrations/
  domain/
    value-object/integration-provider.vo.ts
    value-object/external-id.vo.ts               an opaque provider id; each adapter checks its own shape
    integrations.errors.ts
  application/
    port/chat-installer.port.ts                  D12 — ONE interface, implemented per provider:
                                                 authorizeUrl(state) · exchangeCode(code)
                                                 listChannels() · leave()
    service/chat-installer.registry.ts           D12 — provider → ChatInstaller
    use-cases/begin-install.use-case.ts          builds the authorise URL + state
    use-cases/complete-install.use-case.ts
    use-cases/choose-channel.use-case.ts
    use-cases/read-connection.use-case.ts
    query-port/connection.query-port.ts
  infrastructure/
    provider/discord-chat-installer.adapter.ts   the only implementation today
    repository/prisma-connection.repository.ts
    mapper/connection.mapper.ts
  presentation/
    integration.controller.ts
    workspace-admin.guard.ts                     §4.4
    dto/…
  index.ts
```

Outside the module, by D2:

```
shared/application/chat-poster.port.ts           postToChannel(channelId, message)
infrastructure/discord/discord-bot.client.ts     the one authenticated Discord client
infrastructure/discord/discord.module.ts         mirrors infrastructure/email/email.module.ts
infrastructure/discord/oauth-state.ts            D5
```

`shared/application/` holds only the **posting** port, kept generic so #13 adds `postDirect` beside it
without Notifications importing Integrations. The install-specific calls (code exchange, channel list,
leaving a guild) are Integrations' own port, because nothing else will ever want them.

## 4. API and the flow

### 4.1 The round trip

```
Admin presses Connect Discord
  web   → POST /v1/workspaces/{id}/integrations/{provider}/install  (signed in, Admin)
        ← 200 { authorizeUrl }                                     state signed into it (D5)
  browser → discord.com/oauth2/authorize?client_id&scope=bot&permissions=3072&state&redirect_uri
  Admin authorises, picks their server
  Discord → GET https://thriveteam.app/settings/workspace/integrations/{provider}/callback?code&state&guild_id
        ↑ a (signed-in) WEB route — the API has no public domain (D4). Cookie rides along, sameSite=lax
  web   → POST /v1/workspaces/{id}/integrations/{provider}/complete { code, state }
        ← 200 { guildName, channels: [{ id, name }] }               guild from the code exchange, not the query (D6)
  Admin picks a channel
  web   → PUT  /v1/workspaces/{id}/integrations/{provider}/channel  { channelId }
        ← 204                                                        posts the test message, then writes
  web   → GET  /v1/workspaces/{id}/integrations                     for the screen
```

`permissions=3072` is `VIEW_CHANNEL` (`1<<10`) + `SEND_MESSAGES` (`1<<11`) and nothing else — #199 AC 2.

### 4.2 Refusals

New codes, in `BE_09`'s taxonomy:

| Code | Category | When |
| --- | --- | --- |
| `WORKSPACE_NOT_FOUND` | not_found | not a Member — reused, never a 403 (ADR 0037) |
| `NOT_ALLOWED_TO_MANAGE_INTEGRATIONS` | forbidden | a Member who is not an Admin |
| `INSTALL_STATE_INVALID` | validation | `state` missing, unsigned, expired, or for another Account or Workspace |
| `DISCORD_INSTALL_REFUSED` | conflict | Discord rejected the code exchange |
| `CHANNEL_NOT_IN_GUILD` | validation | the chosen channel is not a text channel of the connected guild |
| `CHANNEL_UNREACHABLE` | conflict | the test post failed — most often the bot cannot post there |

`GET /v1/workspaces/{id}/integrations` is open to **any Member**: the channel name is not a secret, and a
Member being able to see "this Workspace posts into #general" is the honest half of the audience risk
`ADR-0035` logs.

### 4.3 Order of operations

```
CompleteDiscordInstall:   verify state  →  exchange code  →  read guild from the answer  →  list text channels
ChooseChannel:            verify channel is in that guild  →  post the test message  →  upsert the Connection
```

Nothing is stored until a message has actually arrived in the chosen channel (#199 AC 4), so a Connection
that has never worked cannot exist for #200 and #201 to special-case.

### 4.4 Authorization — the part to read twice

`ADR 0037` had each module declare its own guard over Workspace's published `WorkspaceMembershipPort`,
because Workspace's own guard lives in its `presentation/`, which `BE_02` R2 and `BE_03` R4 put out of
every other module's reach. Feedback already does this
(`modules/feedback/presentation/workspace-member.guard.ts`).

That port answers **membership only**, and says so itself:

> It answers a fact and nothing else: **Roles**, names and the Members themselves stay inside
> Workspace, which owns them.

#199 is Admin-only, so **Integrations is the first module outside Workspace that needs a Role** and that
sentence must be amended rather than worked around. Four ways:

| | Approach | Why not |
| --- | --- | --- |
| a | put these routes in Workspace | collapses the bounded context D1 exists for |
| b | publish `MemberRoleValue` | exports Workspace's Role vocabulary into every module that ever needs a permission, and each then reimplements what Admin may do. Exactly what the port's comment refuses |
| c | **publish `isAdminOf({ workspaceId, accountId })`** | chosen. Still a fact, no vocabulary crosses, and the Role model stays Workspace's to change. Implemented over `MemberRole`, which since 2026-10-17 has exactly two values — #203 retired Owner (ADR 0045), so there is no ambiguity left about what an Admin is |
| d | publish `mayManageIntegrations(...)` | makes Workspace name another module's feature |

**Amends ADR 0037's published surface, so it carries its own code ADR in PR 1.**

Integrations declares `WorkspaceAdminGuard` in its own `presentation/`, answering `WORKSPACE_NOT_FOUND`
to a non-Member and `NOT_ALLOWED_TO_MANAGE_INTEGRATIONS` to a Member who is not an Admin — two answers,
because the second caller has already proved they belong there and there is nothing left to hide
(`BE_21` R3).

### 4.5 What is left to get wrong, now that SSRF is gone

The superseded draft's sharpest risk disappeared with the pasted URL. What remains:

- **The `state` token** (D5). Without it, a crafted link makes an Admin connect somebody else's Discord
  server to their own Workspace. Signed, bound to both the Account and the Workspace, five minutes,
  rejected on any mismatch. The session requirement on the callback is a second layer, not a substitute:
  the browser is the Admin's either way.
- **The `guild_id` query parameter** (D6). Browser-supplied, so it is read for nothing. The guild comes
  from Discord's answer to the code exchange.
- **The channel id the Admin submits.** Checked against the connected guild's channel list, not taken on
  trust — otherwise an Admin of Workspace A could name a channel in Workspace B's server.
- **The bot token in logs.** The client logs the route and the status, never a header.

### 4.6 The chat client

In `infrastructure/discord/`, bearing `Authorization: Bot <token>`, and the one place that knows Discord
exists. Mirrors `infrastructure/email/resend-email-sender.adapter.ts`, which is `BE_23`'s other worked
example (#202):

- `fetch` with a **10s** `AbortSignal.timeout`.
- **3 attempts**, exponential backoff with ±20% jitter.
- Retry `5xx` and `429`, honouring Discord's `retry_after`. **Never** another `4xx`: `401`/`403`/`404`
  mean the bot is gone or unwelcome, and retrying is only load.
- `redirect: 'manual'` — not an SSRF guard any more, just refusing to follow Discord somewhere odd.
- **No idempotency key**, because Discord has none. A retry whose first attempt landed posts twice.
  Accepted here: the duplicate is a second test message. It is #201's to carry for real messages and
  `BE_17`'s to fix.

## 5. Web

A new **Integrations** section on `app/(signed-in)/(member)/settings/workspace/page.tsx`, beside Members
and Invitations, plus **one new route** — the callback.

```
settings/workspace/
  _components/discord-connection.tsx        server component, reads the Connection (FE_08)
  _components/connect-discord-button.tsx    client, posts /install then redirects to authorizeUrl
  _components/choose-channel-form.tsx       client, the dropdown
  _lib/integration-actions.service.ts       mirrors invitation-actions.service.ts
  _lib/integration-access.util.ts           mirrors invitation-access.util.ts
  integrations/discord/callback/page.tsx    (signed-in) — D4
```

The callback page forwards `code` and `state` to `/complete`, then renders the channel dropdown. It must
redirect to a clean address afterwards so a `code` does not sit in history or in a shared URL.

Gated on screen by `mayManageIntegrations(membership)`; the API refuses independently (`GEN_09` R2 —
client checks are UX).

**Ordering note.** `FD-0017` / PR #140 (*one convention for calling the API from the browser and from the
server*) is still open and `In review`. If it merges first, this follows it; otherwise this copies
`invitation-actions.service.ts` and gets rebased. Check before PR 2, not before PR 1.

## 6. Schema, migration and configuration

One table, one migration, no existing table touched. `BE_15`; Prisma Migrate owns DDL (ADR 0022). The
module owns this table and nothing joins to it (`BE_03` R7) — `workspaceId` and `connectedByAccountId`
are ids with **no foreign key** into Workspace's or Identity's tables, the rule ADR 0037 set for
Feedback.

```prisma
/// One Workspace's authorised link to one external tool. Nothing here is secret for Discord: a
/// server id is known to everyone in it, and a channel id grants nothing on its own. A provider
/// that issues a per-Workspace credential (Slack does) adds the column, the cipher and the key
/// handling together, when they have a reader — D3.
model IntegrationConnection {
  id                    String   @id
  workspaceId           String
  provider              String
  /// The provider's own space: a Discord server, a Slack team. Names are cached for the screen
  /// and refreshed when read; the ids are opaque strings, because providers do not agree on a shape.
  externalWorkspaceId   String
  externalWorkspaceName String
  externalChannelId     String
  externalChannelName   String
  connectedByAccountId  String
  connectedAt           DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([workspaceId, provider])
  @@map("integration_connection")
}
```

**Three new config values** (`BE_10`, `INFRA_07`), placeholders in `.env.example`, set on `thrive-api`
**before** the image that reads them — the rule `PROJECT.md` already records for `RESEND_API_KEY`:

| | |
| --- | --- |
| `DISCORD_CLIENT_ID` | public; also needed by the web to build the authorise URL |
| `DISCORD_CLIENT_SECRET` | the code exchange (D6) |
| `DISCORD_BOT_TOKEN` | every call the client makes |

`state` is signed with `DISCORD_CLIENT_SECRET` rather than adding a fourth value — one secret, one
purpose family. Say if you would rather it were its own key; it is a one-line change now and a migration
of nothing later.

**The application is a shared asset.** One Discord application serves every customer, so its token is a
single point of failure for all of them, and an unverified app is capped at **100 servers**. `ADR-0035`
also flags that it must not be created under a personal account while `STATE.md` Open decision #3 is
open.

## 7. Tests

| Level | What | Where |
| --- | --- | --- |
| Unit | `state`: round-trips; refused when expired, re-signed, or carrying another Account or Workspace | `infrastructure/discord/oauth-state.spec.ts` |
| Unit | the Discord adapter refuses an id that is not a snowflake; an unknown `{provider}` is `PROVIDER_NOT_SUPPORTED`, not a 404 | `infrastructure/provider/discord-chat-installer.adapter.spec.ts` |
| Unit | `CompleteInstall` reads the provider's space from the **exchange**, and ignores `guild_id` entirely (D6) | `…complete-install.use-case.spec.ts` |
| Unit | `ChooseChannel` refuses a channel outside the guild; stores nothing when the test post fails (§4.3) | `…choose-channel.use-case.spec.ts` |
| Unit | Both use cases refuse a non-Admin **before** calling Discord at all | both spec files |
| Unit | Client: 10s timeout, 3 attempts on `503`, **one** on `403`, honours `retry_after`, logs no token | `infrastructure/discord/discord-bot.client.spec.ts` |
| Integration | `(workspaceId, provider)` unique; connecting again replaces in place | `…choose-channel.use-case.integration.spec.ts` (`BE_12`, compose Postgres) |
| Gherkin | `@api`: an Admin completes an install and reads it back; a Member is refused; a bad `state` is refused | `features/integrations.feature`, steps in `apps/api/test/steps` (`BE_13`, `GEN_10`) |
| Web | the callback page forwards and then cleans the address; the section is absent for a non-Admin | `_components/*.test.tsx`, `callback/page.test.tsx` (`FE_14`) |

The Discord port and the client are faked in every suite, exactly as `EmailSender` is — nothing reaches
Discord.

## 8. `todo` convention entries interpreted

`CLAUDE.md` requires naming these, because for a `todo` entry the index line **is** the binding text.

| Entry | How this design reads it | Conflict? |
| --- | --- | --- |
| `BE_23` External integrations — outbound clients, webhooks | a port in `application/`, one client, timeout, capped attempts, backoff, and no trust in anything a redirect carries. #202 writes it up **from this client** | none |
| `BE_22` Application security hardening | validate at the trust boundary, deny by default, secrets never in logs or responses. §4.5, §4.6 | none |
| `BE_16` Inter-module communication | reach another module only through what it publishes. §4.4 extends that surface rather than going around it; D2 keeps the Discord client out of the module so #13 need not reach in | none — but it is why D8 needs an ADR |
| `BE_14` Transactions & unit of work | ADR 0031 is the interim; D10 reads it as "a use case that writes more than once", so this is outside it | none |
| `FE_16` Forms, `FE_18` UI states | the shapes already in `invite-members-form.tsx` | none |
| `FE_19` Authentication & protected routes | the callback is an ordinary `(signed-in)` page (D4), so nothing new is read into it | none |

No two conflict. **`BE_23` is interpreted most freely** — it is this Task's whole subject and does not
exist, which is why #202 is blocked by #199 and not the reverse.

## 9. Execution plan

**PR 1 — API.** The module, the migration, the Discord client and `DiscordModule`, the three config
values, the four routes, the `isAdminOf` amendment with its code ADR (**0048** is the next free number —
0045, 0046 and 0047 were taken by #203 and #210 on 2026-10-17), and the Gherkin scenarios.
Regenerate the contract (`turbo run contract:generate --filter=api`) or the *Contract* job fails
(ADR 0006, `GEN_08`).

**PR 2 — web.** The Settings section, the connect button, the callback page, the channel dropdown, tests.

Deploy order: the three config values go on `thrive-api` **before** the image that reads them, or the API
will not boot.

## 10. Risks and sequencing

| Risk | Reading |
| --- | --- |
| **`state` handling** | now the sharpest thing in the Task, since SSRF left with the pasted URL. If one review comment is spent anywhere, spend it on §4.5 |
| **One Discord application for every customer** | its token is everyone's outage, and it is capped at 100 servers unverified. Ownership is blocked on `STATE.md` Open decision #3 |
| ~~Admin is still Owner-or-Admin~~ | **Resolved 2026-10-17.** #203 merged: two Roles, Owner gone (ADR 0045), `mayManageInvitations` is now `role === 'ADMIN'`. `isAdminOf` has one obvious meaning. ADR 0046 also set the precedent for serialising a Workspace-scoped write under a per-Workspace advisory lock — read it before anything here needs one |
| **A duplicate test message on retry** | accepted (§4.6). #201 carries it for real messages; `BE_17` fixes it |
| **#140 may land first** | §5. PR 2 only |
| **#13 depends on this far more than it looks** | a bot can only start a conversation with somebody who shares a server with it. No Connection, no direct messages — so #211–#215 are all blocked by this, and #200 silently switches them off for a whole Workspace |
| **Discord is not our buyer's tool** | `ADR-0035`'s own accepted risk. The hedge is that the module, the client, the port shape and `isAdminOf` are all provider-agnostic — Slack reuses every one of them |

**What this does not do:** nothing is posted except one test message. #201 is where Feedback reaches the
channel, restricted to Feedback already set to *Everyone in the Workspace*; #211–#215 are where a person
is messaged directly, which is Epic #13's and needs its own design.

## 11. Adding a provider — the checklist

`ADR-0035` names Slack as next, and on 2026-10-18 the author chose to shape both designs for several
providers rather than generalise later (D12, and `0021` D3). This is what that bought, stated as the
work a second provider actually costs:

| | |
| --- | --- |
| **Write** | one `infrastructure/provider/<name>-chat-installer.adapter.ts` — authorize URL, code exchange, channel list, leave — and register it |
| **Add** | its client id and secret to configuration |
| **Add** | a row to the Integrations screen, which already lists providers rather than naming one |
| **Change** | nothing in the use cases, the routes, the error codes, the `state` token, the guard, or the table's shape |

**And one thing that is not free, named rather than hidden (D3).** Slack issues a **bot token per
installed workspace**; Discord issues none. So the first such provider brings a migration adding an
encrypted column, plus the `SecretCipher` port and adapter this design deleted from its own superseded
draft, plus somewhere to keep the key. That is deliberate: an empty column and an unused cipher today
would be a knob with no reader, and the table has no users to migrate around.

**What else differs per provider**, handled inside the adapter rather than above it: permission scopes
(Discord's `permissions=3072` bitfield has no Slack equivalent — Slack asks for named scopes),
rate limits (Discord's per-route buckets against Slack's per-method tiers), and getting listed at all
(Slack requires an app-directory submission that takes weeks; Discord does not).

**Naming.** This file keeps its `0020-connect-a-discord-channel.md` filename although it now describes
a provider-shaped design, because the number is what `STATE.md`, `handoff.md`, `0021` and five cards
cite. The title line is the thing that was corrected.

---

## 12. Corrections made while building #199 (2026-10-18)

The API half was built against this document on 2026-10-18. Five things in it were wrong or
incomplete, corrected in the code rather than left to a reviewer:

| | What this document said | What the repository required |
| --- | --- | --- |
| **ADR number**, and then the whole amendment | *"**0048** is the next free number"*, and §4.4 proposes `isAdminOf` with an ADR of its own | **Both overtaken.** 0048 went to #193/#194 on 2026-10-17, and by the time this was rebased on 2026-10-23 `isAdminOf` **already existed on `main`**: Workspace Goals needed the same fact and published it the same way, under **ADR 0052**. §4.4's reasoning stands and was reached twice independently — the code and the ADR this design called for are simply not ours to write. Integrations consumes what is there |
| **Where the port lives** | §4.4 amends "Workspace's published port" | `WorkspaceMembershipPort` is in `workspace/domain/port/`, not `application/port/`, and is implemented in `application/adapter/workspace-membership.adapter.ts` over `MembershipQuery.membershipInWorkspace`, which already answers the Role. The amendment is six lines |
| **What `isMemberOf` means** | `0021` §4.2 expects to need a second amendment, `isActiveMemberOf`, because *"`isMemberOf` answers membership, not active membership"* | **It already excludes Deactivated Members** — `membershipInWorkspace` filters `deactivatedAt: null` (ADR 0047). Only the port's comment was imprecise, and it now says so. `0021` needs no second amendment, and that risk comes off its list |
| **The gap between `/complete` and `/channel`** | §4.1 has `PUT …/channel` take `{ channelId }`, while §4.3 verifies that channel "is in that guild" — with nothing stored yet, and the guild read from the exchange one request earlier | A third thing had to exist: `/complete` answers an **`installation`** — the authorised space, signed exactly as `state` is (D5) — and `PUT …/channel` carries it back. The alternative, taking `externalWorkspaceId` from the request body, is the trust D6 refuses one request later. `InstallHandoff` is the port, `SignedHandoff` the HMAC helper both tokens share, with 5 minutes for `state` and 15 for the installation, because a person is reading a list of channels in between |
| **Two names** | `CHANNEL_NOT_IN_GUILD`, `DISCORD_INSTALL_REFUSED`; `service/chat-installer.registry.ts` | The codes are **`CHANNEL_NOT_OFFERED`** and **`INSTALL_REFUSED`**: D12 made the module provider-shaped, "guild" is Discord's word, and `0021` had already settled that these codes are not provider-named. The registry is **`chat-installer-registry.service.ts`** — `.registry.ts` is not one of `BE_01` R6's role suffixes, and `check-arch` refuses the filename this document proposed |

Also built differently, deliberately: the guard is `presentation/workspace-member.guard.ts` rather
than a `workspace-admin.guard.ts`. It refuses a non-Member with `WORKSPACE_NOT_FOUND` and resolves
whether they are an Admin; the Admin refusal is each **use case's**, as it is on Workspace's own
routes, which is also what §7's test ("both use cases refuse a non-Admin before calling Discord")
asks for. One guard then serves both the Admin-only routes and the read every Member may make.

One thing was added that this document did not call for, after a review pass: each signed token
carries **which of the two it is**. Without that the 15-minute installation token also reads as a
`state`, because it holds every claim a `state` needs. Nothing exploitable followed from it — a code
exchange still needs a code only the tool issues — but the longer-lived value was usable where the
shorter-lived one is meant, and stamping it costs one claim.

The chat client sits in `infrastructure/chat/discord/`, which is what D2's own text says
(`infrastructure/chat/<provider>/`); the tree in §3 said `infrastructure/discord/`, written before
D12.

**Still unbuilt at the end of PR 1:** the web (PR 2) and the Discord application itself, which
`ADR-0035` and `STATE.md` Open decision #3 keep shut until its owner is settled. So AC 2–5 cannot
be walked in a browser yet; the code and its tests stand on faked providers, as `EmailSender` is.
