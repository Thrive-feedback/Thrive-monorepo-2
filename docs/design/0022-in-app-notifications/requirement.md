# Requirement · NO-2 In-app Notifications

**Epic:** [#13 Notifications](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/13) · group
**NO-1** in `domain-map.md` ("Get notified and reminded")
**Product decision it leans on:** brain `ADR-0035` §6–§9 (three events, skipped quietly, DMs belong to #13)
**Status:** draft, 2026-10-24 · **Author:** naroebordin (with Claude)
**Reviewed in part, 2026-10-24:** §7 questions 1, 2, 3 and 5 are **decided** by naroebordin and are now
rules. Questions 4 (Mentions) and 6 (Epic #13's priority) stay open — §7.1 and §7.2
**Sits beside:** `docs/design/0021-discord-direct-messages.md`, which tells the *same* three events to
the *same* people through a chat tool. Read §8 of this file before building either.

---

## 1. Why this exists

Today, from `STATE.md`: **nothing tells a Member they were asked.** No email, no notification. *Waiting
for me* is the only way a Giver finds out somebody is waiting on them, and the only way they find out is
by choosing to go and look. `ADR-0006` decision 4 accepted that by putting Notifications at **Low**.

The four cards now in flight — #211, #213, #214, #215 — fix it **only for people who link a chat
account**. `ADR-0035` §6 made linking the switch, and `0021` §10 names the consequence plainly:
*"somebody who never links is told nothing at all… the real answer is #13's in-app and email
Notifications, unbuilt."*

This document is that answer, for the in-app half. It is the **floor** under the chat messages: the
thing every Member gets, whether or not they have linked anything, whether or not their Workspace has
connected a chat tool at all.

**The honest sequencing point.** In-app is written here *before* anyone has asked for it, because the
four chat cards are about to decide where the three events are raised from, what those events carry, and
whether anything is stored. Those are the expensive parts to change afterwards. §8 says exactly what
this changes about #213 — which is less than it sounds, and is worth ten minutes before that card
starts.

## 2. Who it is for, and what they get

| | |
| --- | --- |
| **Who** | Every Member of a Workspace. Not Admins only, not linked people only |
| **Where** | A bell in the Member navbar, on every page a Member uses |
| **When** | The moment something in §3 happens to them, visible within a minute |
| **What it costs them** | Nothing. There is no setting to find, no account to link, no email to confirm |

## 3. What a person is told about

The same three events `ADR-0035` §7 chose for a direct message, because they are the same three events —
one reader, who is a party to the thing:

1. **Somebody asked you for Feedback.** → opens that Ask, answer box ready
2. **Somebody answered a request you sent.** → opens that request, with the answer on it
3. **Somebody wrote Feedback to you**, unasked or shared with you. → opens that Feedback

Nothing else. In particular, not: somebody reacted, somebody joined, somebody's Role changed, somebody
mentioned you. §5 says why each is out and which is most likely to arrive next.

## 4. What a person can do

> **PM walk** (brain `ADR-0011`): every line here is checkable in a browser by two people in one
> Workspace, with no chat tool connected to anything.

1. Sign in as Member B. The bell in the navbar shows nothing — no count, no dot.
2. As Member A, open **Home → Request feedback**, pick B, write a Request message, send.
3. As B, within a minute and **without reloading the page**, the bell shows **1**.
4. Press the bell. A panel lists one line: *"Nut asked you for feedback"*, with how long ago.
5. Press that line. Land on the Ask, with the answer box open. The bell no longer shows **1**.
6. Answer it. As A, the bell shows **1**: *"Ploy answered your request"*. Press it, land on the request
   with the answer on it.
7. As A, open **Home → Give feedback**, write Feedback for B, **Only them**, send. B's bell shows
   *"Nut wrote feedback to you"*.
8. As B, press **Mark all as read**. The count goes, the lines stay, and they read as already-seen.
9. Reload. The count is still gone and the lines are still there.
10. As B, open the bell with nothing unread. It says so in a sentence, rather than showing an empty box.

**And the one that matters for trust:** nothing in that panel is ever anybody else's. There is no
address, no setting and no amount of fiddling that shows B what A was told.

## 5. Scope

### In

- A stored Notification per Member per event, for the three events in §3
- A bell in the Member navbar carrying the unread count
- A panel listing the most recent Notifications, newest first, with their read state
- Pressing one opens the thing it is about, and marks that one read
- **Mark all as read**
- Notifications for the Workspace the person is currently in

### Out, and why

| Out | Why |
| --- | --- |
| **Reminders** about an unanswered Ask | `ADR-0035` §7. Nothing in Thrive can do something later — no clock, no queue, no scheduled work. `BE_18` is `todo`. It is the single most valuable thing here and it needs a scheduler first |
| **Email Notifications** | NO-1 names them and they are real work: an unsubscribe, a digest decision, and Resend's **100 emails a day shared across every feature** (`PROJECT.md` §4). Its own card, after this one |
| **Notification Preferences** | `ADR-0035` §6 chose one switch per Member for chat, and §6 of this document makes in-app have no switch at all. The glossary's `NotificationPreference` stays unbuilt |
| **A full-page notification history** | The panel holds the most recent. Nobody has asked to scroll a year of them; add it when somebody does |
| **Workspace events** — invited, Role changed, Deactivated, somebody left | `domain-map.md` has Notifications listening for `InvitationSent`, so this is anticipated, not rejected. It is a different set of events with a different audience and it does not need to ride with the first slice |
| **Mentions** (`ADR-0037`) | The most likely fourth event, and deliberately not the first. Mentions are read-only today; telling somebody they were named is a product decision nobody has made |
| **Reactions**, and anything about the Workspace feed | Nobody asked, and it is the event most likely to make a bell feel like noise |
| **Notifications about your own actions** | You know. §6 |
| **Mobile push** | Epic #13's own scope line. There is no app |

## 6. The rules

These are the product rules. The technical design implements them; it does not get to choose them.

1. **In-app cannot be switched off.** It is not a preference, it is the product: it is how a person
   finds out something is waiting for them. Linking a chat tool adds a second place to be told
   (`ADR-0035` §6) — it never replaces this one.
2. **A Notification is a pointer, not a copy.** It names who did something and what it concerns, and
   carries **none of the words** — not the Request message, not the Feedback message. Following it, behind
   a sign-in, is how you read those. This is the same reasoning `#214` already took for the chat message
   ("Nothing of what was written is in the message").
3. **Never your own action.** The person who asked is not told they asked.
4. **One event, one line.** Somebody who is both the Receiver of a piece of Feedback and named under
   *Selected people* gets **one** Notification, not two — the same rule #215 already states for chat.
5. **It belongs to a Workspace.** One Account can be a Member of several (`ADR-0034`). The bell shows the
   Workspace the person is in now, and nothing from the others. *(Accepted gap — §7 question 2.)*
6. **A Deactivated Member is told nothing and sees nothing** (`ADR-0047`), consistent with `0021` D7.
7. **Nobody sees anybody else's**, by any route. Not an Admin, not a teammate.
8. **A Notification outlives what it points at.** If the thing it names becomes unreadable, the line
   stays and following it lands on the ordinary "not found" the rest of Thrive already shows. It does not
   silently vanish, because a count that changes on its own is worse than a dead link.
9. **Being told must never be able to stop the thing happening.** Asking for Feedback, answering an Ask
   and giving Feedback succeed even if the notification cannot be written at all — the same promise
   `ADR-0035` §8 made for Discord.

## 7. Product questions — four settled, two open

**Settled by naroebordin, 2026-10-24.** These are now rules, not proposals; §6 and §9 are written to
them. A lasting record of them belongs in a brain ADR when this card is built.

| # | Question | **Decided** |
| --- | --- | --- |
| 1 | Can a Member turn in-app Notifications off? | **No.** It is the floor; an off switch makes "nobody told me" possible again and brings `NotificationPreference` into scope. Rule 1 |
| 2 | Does the bell show Notifications from the person's **other** Workspaces? | **No.** Home is one Workspace's, and a count mixing two is a lie about where pressing it will take you. The chat DM already names its Workspace (`0021` D11) and covers the person looking elsewhere. Rule 5 |
| 3 | How long is a Notification kept? | **Forever, for now.** ~90,000 rows and under 10 MB a year for a whole Workspace. No deletion is built until there is a reason to build it |
| 5 | Read on being **seen**, or on being **pressed**? | **Pressed**, plus an explicit *Mark all as read*. Marking on sight means the count disappears for somebody who glanced at the panel on the way past |

**Still open.**

| # | Question | Where it stands | Owner |
| --- | --- | --- | --- |
| 4 | Are **Mentions** the fourth event? | **Direction decided** (naroebordin, 2026-10-24): a Mention adds the person to Selected people — brain **`ADR-0042`**, `proposed`. Not in this slice; blocked on that ADR, which is kritpavin's to accept. §7.1 | kritpavin |
| 6 | Does this change Epic #13's **Low** priority? | §7.2 below — why it is load-bearing rather than housekeeping | kritpavin |

### 7.1 Question 4 — Mentions as a fourth event

**The scenario.** A writes Feedback to B and types `@` to name C — "`@ann.lee` saw this too". Today
(`ADR-0037`) C is never told. The Mention makes the text read better for whoever already reads it, and
nothing else. So the person most likely to care that they were named is the one person who does not
find out.

**What already exists, and it is most of it.** `TagsService.boundIn()` (`apps/api/src/modules/feedback/application/service/tags.service.ts`)
already returns `mentions: [{ accountId, slug, displayName }]`, already filtered to **active Members of
that Workspace**, and it is already called on every send. The recipient list is in hand before the write.
`FeedbackMention` and `FeedbackRequestMention` are stored tables.

**Does being mentioned put you on the Feedback's Visibility? No.** Asked 2026-10-24 and checked in the
code rather than taken from the ADR, because the whole of question 4 turns on it:

| Evidence | What it says |
| --- | --- |
| brain `ADR-0037`, option **C** | *"A Mention shares the Feedback with the person named"* was **considered and rejected** — "a word in the text quietly widening it would be a privacy surprise". The Decision says outright: a Mention "never changes Visibility and notifies nobody" |
| `domain/value-object/visibility.vo.ts` | the selected people **belong to** the `Visibility` and are built only from `selectedAccountIds`, the list chosen on the send form. A Mention has no way to reach it |
| `infrastructure/query/prisma-feedback-request.query.ts:234-238` | *Shared with me* filters `visibility: 'SELECTED_PEOPLE'` + `selectedPeople: { some: { accountId: reader } }`. **Mentions appear in no `where` clause anywhere** — only in the projection, to render the name in the text |

So a Mention is **purely typographic**. Who may read is `Giver` + `Receiver` + whatever the Visibility
says, and nothing else.

**Which makes this the trap — and the answer taken was to remove the trap rather than manage it.**
You can be named in Feedback you may not read, specifically when the Visibility is `ONLY_ME`, or
`SELECTED_PEOPLE` and you are not one of them.

**Decided by naroebordin, 2026-10-24: a Mention adds the person to Selected people**, as a chip the
sender sees and can remove before sending. Their reasoning: being named in Feedback *means* being
involved in it. Written up as brain **`ADR-0042`** — `proposed`, because it supersedes half of
`ADR-0037`, which is kritpavin's and is about the privacy model. **It needs kritpavin's yes before
anything here is built.**

Three alternatives were rejected on the way, and the ADR holds why: notifying only the people who could
already read (leaves the hole open), granting access silently (the "privacy surprise" `ADR-0037`
rejected), and granting it with a warning but no way to undo it.

**What it does to this design: the problem disappears instead of being handled.** Every mentioned person
can read what they are named in, by construction — so there is **no Visibility filtering to write**, no
link that can land on *not found*, and nothing for Notifications to evaluate about another module's
rules. The §7.1 trap is gone rather than mitigated.

**What it does not change:** `ADR-0022` still has the sender choosing the Visibility, fixed at send.
`ADR-0042` changes how that control gets filled in — not who decides, or when.

**A second rule needed:** somebody who is mentioned *and* is the Receiver gets **one** Notification, not
two. The unique index cannot do this, because the two would carry different types — it is an explicit
suppression in the fan-out, like `requirement.md` rule 4.

**Cost, assuming NO-0005 has shipped:**

| | |
| --- | --- |
| brain `ADR-0042` accepted by kritpavin | **the real work, and it is a conversation, not engineering** |
| `ADR-0042` itself — the chip in the compose form, and `ONLY_ME` + a Mention becoming `SELECTED_PEOPLE` on screen | ~1 day, **web only**. The API needs nothing: a mentioned person arrives in `selectedAccountIds`, which already validates and already filters (`prisma-feedback-request.query.ts:234`) |
| Then the notification: two types — `MENTIONED_IN_FEEDBACK`, `MENTIONED_IN_REQUEST` — one port method, chat copy | ~0.5 day |
| ~~Visibility filtering in Feedback~~ | **not needed under `ADR-0042`** — every mentioned person can read it |
| The suppression rule: mentioned **and** Receiver is one Notification, not two | ~2 hours |
| Two entries in the web copy map | ~1 hour |
| Tests: suppression, both subject kinds, the chip, Gherkin | ~0.5 day |
| **Total** | **`ADR-0042` an `S` card of its own (~1 day, web); the notification another `S` (~1 day) on top** |

**Before NO-0005 it is roughly double and shaped wrong**, because there is no bell to show a Mention in
and the only channel would be chat — which would tell people with Discord linked and nobody else, for an
event that is purely informational.

**Still not in the first slice**, and now for a second reason as well as the original one. The original:
it is the first event that is *not* "something is waiting for you", which is where a bell starts feeling
like noise. The second: it is **blocked on `ADR-0042`**, which is kritpavin's to accept and which is
worth building on its own merits — it closes a real hole in the privacy model whether or not anybody is
ever notified about a Mention.

### 7.2 Question 6 — why Epic #13's priority is load-bearing

This is not board housekeeping. `ADR-0006` decision 4 moved #13 from **High** to **Low**, and the same
ADR's *Consequences* flagged it as the thing to watch:

> **Decision 4 is the risk to watch.** Epic #7 says it worked if at least half of Asks are answered
> within two weeks. With Notifications at Low, the only way a Giver learns of an Ask is by opening the
> app. If the answer rate comes in low, Notifications is the first thing to re-prioritise — not the
> feedback flow.

And it pre-registered its own reversal: *"A low answer rate traced to people never opening Thrive
(reverses 4)."* `vision.md` O-8 says the same thing in one line — **"An Ask nobody notices is an Ask
nobody answers."**

**Four things have changed since that decision, and all four point the same way:**

1. **The loop is finished.** O-2's whole scope has been built and whole in a browser since 2026-10-13
   (`STATE.md`). Decision 4 was taken when there was nothing to not-be-notified about.
2. **The reversal condition cannot be measured.** It needs an answer rate, which needs users — and
   Thrive has zero users, zero interviews, and no analytics at all (`FE_24` is `todo`; nothing records
   a view or a press). **Waiting for the evidence means waiting for something that cannot arrive.**
   The evidence would first exist during a first-customer trial, which is the most expensive possible
   moment to discover it.
3. **#13 is already being built, under another Epic's momentum.** Three of the four cards in flight —
   #213, #214, #215 — are #13's outcome (`ADR-0035` §9). An Epic marked `Low` that the team is actively
   building makes the board describe something other than what is happening.
4. **This half reaches everybody.** The chat cards reach only people who link an account, in Workspaces
   that connected a server. In-app has no precondition at all — which is exactly the gap `0021` §10
   named: *"somebody who never links is told nothing at all."*

**The cost of each answer, plainly.** Raising it costs sequencing one card that is now designed. Leaving
it `Low` costs the risk `ADR-0006` itself described: a first trial where the core loop looks broken for
a reason that is not the loop. **kritpavin's call, and `ADR-0006` decision 4 is what it would supersede.**

**Unaffected by this document:** `ADR-0035`'s open question about somebody who links two chat tools
(`0021` D12). That is about chat delivery; in-app has exactly one place to put a Notification.

## 8. What this changes about the four cards in flight

Short version: **less than it looks, and only if it is read before #213.**

`0021` already put the port in a Notifications module and already named it `PersonNotifierPort` rather
than anything about chat. That holds. What changes:

| | Change | Cost if done at #213 | Cost if retrofitted |
| --- | --- | --- | --- |
| 1 | Port methods carry **`actorAccountId`** beside the already-planned ready-made name, and the subject's id | One field per method, three call sites that already pass the data | Re-opening Feedback's three call sites after they have shipped |
| 2 | The copy service is shaped for **two renderings** from the start — chat carries the Request message, in-app carries none (rule 2) | None; it is one more method on a service being written anyway | Rewriting the service once in-app needs it |
| 3 | `0021` **D6** ("unreachable is not stored") is narrowed to mean *chat delivery* is not stored. The Notification itself **is** | A sentence in the design | An ADR superseding one that was never right |

**What is explicitly *not* being proposed:** building the table at #213 and leaving nothing to read it.
That is a schema designed with no screen to check it against, which is how the shape gets wrong, and it
is against `PROJECT.md` §2. The recommendation is to **lock the port signature at #213 and build the
table with its bell**, as one card, afterwards. The technical design argues this in its D14.

## 9. The card

One card, because it is one vertical slice and `ADR-0011` wants it walkable in a browser.

> **NO-0005 · See in Thrive that somebody asked me, answered me, or wrote to me**
> `Area: Notifications` · `Type: Task` · Size **M** · Parent #13
> **Blocked by:** nothing. Not #199, not #211 — that is the point of it.

**Acceptance criteria**

- [ ] A Member gets one Notification when somebody asks them for Feedback, when somebody answers a
      request they sent, and when Feedback is written to or shared with them
- [ ] The bell shows how many are unread, and updates within a minute without the page being reloaded
- [ ] Pressing one opens the Ask, the request or the Feedback it names, and marks that one read
- [ ] **Mark all as read** clears the count and keeps the lines
- [ ] A Notification carries no Request message and no Feedback message — only who, what kind, and when
- [ ] Nobody is notified about their own action
- [ ] Somebody who is both the Receiver and a Selected person is notified once
- [ ] Notifications are the current Workspace's only
- [ ] No Member can see any other Member's, by any address
- [ ] A Deactivated Member gets none and sees none
- [ ] Asking, answering and giving Feedback all still succeed when the Notification cannot be written

**Definition of Done** — as every card: criteria checked, merged and working on the test site, the PM
walked §4, tests at the level the behaviour lives at, and the brain updated (`Notification` moves from a
planned glossary row to a built one; any lasting decision becomes an ADR).

## 10. How we know it worked

**Honestly: we cannot measure it yet.** There is no analytics in Thrive — `FE_24` is `todo` and nothing
records a page view or a press. So the test is the one Epic #13 already wrote: *Reminders measurably
raise the share of Asks answered* — and Reminders are out of this scope.

What is checkable without analytics, and worth checking by hand with the first customer:

- An Ask sent to somebody who has never opened Thrive that day is answered **without the Requester
  chasing them in person**. That is the whole behaviour change.
- Nobody asks "how do I turn this off" — if they do, question 1 was answered wrong.
