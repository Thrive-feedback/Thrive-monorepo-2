# Requirement · PR-1 Erasing a person

**Epic:** none yet — this belongs under Auth and Workspace
([#9](https://github.com/Thrive-feedback/Thrive-monorepo-2/issues/9)) or a Privacy Epic of its own; §9
argues for the latter
**Glossary term it builds:** **Erase** (`glossary.md:66`) — *"Permanently delete a person's personal
data on their request, as PDPA and GDPR require. Cannot be undone; not the same as Deactivate."* Code
name `account.erase()`. The row exists; nothing implements it
**Conventions it is written under:** `GEN_09` R3 and R5 (`stable`, P1) · `GEN_04` · `GEN_13` ·
`BE_03` R7 · `BE_21` · `BE_15` · interpreting `todo` entries `BE_16` and `BE_22` (§8)
**Status:** draft, 2026-10-31 · **Author:** naroebordin (with Claude)
**Blocked on a product decision:** §7 questions 1–4 are **open and nobody has answered them**. Nothing
in §5 "In" is buildable until Q1–Q3 are decided. They are a conversation, not engineering

---

## 1. Why this exists

Three things are true at once, and together they are the whole argument.

**First, Thrive has already promised this.** `glossary.md:66` defines **Erase** as a thing the product
does, names its code form `account.erase()`, and says explicitly that it is *not* Deactivate. That row
has been in the glossary since the ubiquitous language was drafted. **Nothing implements it.** A search
of `apps/api/src` for a hand-written delete returns only generated Prisma model files — there is no
erase path, no delete path, and no route that removes a person's data. The glossary describes a product
that does not exist yet, which is normal for a planned row, and this document is how that row stops
being planned.

**Second, two `stable` P1 rules are currently unmet across the whole schema.** `GEN_09` is the security
and privacy baseline, it is `stable`, and two of its ten rules bind here:

> R3 — *Classify data before you store it, and write the classification down next to the field.*
> R5 — *Collect the least you can, and be able to state when it is deleted.*

`apps/api/prisma/schema.prisma` has rich `///` documentation on most fields — what a value means, which
ADR decided it, when it is null. **Not one field carries a data classification**, and no field anywhere
states a retention period. So for every column in Thrive today, the answer to "is this safe to log,
export, or copy into a fixture" and "when does this go away" is *ask somebody*. R3's own Enforcement
line admits a lint rule cannot judge this — but it can check the comment exists, and `GEN_09`'s Open
questions already name that as the candidate guardrail.

The concrete instance found while writing this: `Session.ipAddress` and `Session.userAgent`
(`schema.prisma:37`) are written by Better Auth on every session and **read by nothing in Thrive's
code** — zero non-generated hits in `apps/api/src`. No feature uses them, no retention is stated, and
expired session rows are never pruned. That is collected personal data with no purpose, which is exactly
what R5 forbids, and deleting the two columns costs nothing because nothing reads them.

**Third — and this is the part that makes it urgent rather than tidy — the obvious implementation is
wrong in a way that is hard to see.** `docs/adr/0037` decided Feedback names people by Account and holds
**no foreign key** into another module's tables. The schema confirms it: `Feedback.giverAccountId`
(`:270`), `FeedbackReceiver.accountId` (`:305`), `FeedbackMention.accountId` (`:378`) are bare strings.
Meanwhile `User` cascades into `Session`, `Account`, `Profile`, `Member` and `Invitation`.

So "delete the Account row" would wipe their identity and memberships and leave **every** Feedback,
Ask, Kudos, Receiver, Selected-person and Notification row standing, each holding an id that now
resolves to nobody. And worse: `FeedbackMention`, `FeedbackRequestMention` and `KudosMention` each store
a denormalised **`displayName` and `slug`** (`:352`, `:379`) — a copy of the person's real name, sitting
inside Feedback's tables, which survives the deletion of the Profile that would have let you find it.

The failure mode is the dangerous direction: you would report the erasure as done, the person's name
would still be in the database, and every screen that renders a Giver would need a new empty state it
does not have. **ADR 0037 is not the bug** — the no-FK rule is precisely what makes a good answer
possible, because it lets authorship be severed without destroying the recipient's record. The gap is
that nobody has decided the policy, and every new Feedback table makes the eventual migration larger.

**Why now, with zero users.** Because the cost curve is one-directional. The classification is cheap
while there are ~30 tables and free to keep current afterwards; retrofitting it across a live schema is
an audit. The erasure policy is a conversation now and a migration-plus-backfill later. And the first
time it is genuinely needed — a Member who quits angry, or a customer's own PDPA obligation landing on
Thrive as their processor — is the worst possible moment to discover that nobody chose.

## 2. Who it is for, and what they get

| | |
| --- | --- |
| **Who** | Any Account holder. Not Admins only — this is a right, not a permission |
| **Where** | Settings → Account, below the existing Linked Account controls |
| **When** | On request, taking effect immediately and irreversibly |
| **What it costs them** | Their access to Thrive, permanently. §7 Q4 decides whether the address can ever be used again |
| **Who else notices** | Other Members see an erased person as a fixed placeholder wherever their name used to be — **not** a blank, and not a vanished card |

Deactivate and Erase are deliberately different and the glossary already says so. Deactivate ends access
to **one Workspace**, is reversible by an Admin, and keeps the person's name visible in grey with
"(inactive)". Erase ends the **Account** everywhere, cannot be undone, and takes the name away.

## 3. What Erase does

Three things, which §7 exists to confirm are the right three:

1. **Ends the ability to sign in.** Sessions and sign-in methods are deleted, so the person is signed
   out everywhere and cannot return.
2. **Removes their personal details.** Profile — full name, Display name, slug, photo link — is deleted,
   and the Account's own name and email are replaced by a placeholder. Every denormalised copy of their
   name, in every module, is scrubbed to the same placeholder.
3. **Leaves what other people are owed.** Feedback they wrote about colleagues, and Feedback written
   about them, keeps its words. Authorship is severed, not deleted. **This is the part that needs a
   product decision, not an engineering one — see §7 Q1.**

## 4. What a person can do

> **PM walk** (brain `ADR-0011`): checkable in a browser by two people in one Workspace, using the seed
> command (`bun run --cwd apps/api db:seed`, #173) for the Feedback history.

1. Sign in as Member A. Give Feedback to Member B, **Everyone**, mentioning B by name in the text.
   Ask B for Feedback and have B answer it.
2. As B, confirm the Workspace feed shows A's Feedback with A's name and photo, and that *Feedback for
   me* shows A's answer.
3. As A, open **Settings → Account → Erase my account**. A confirmation explains, in a sentence each:
   that it cannot be undone, that their name disappears from everything, and that the Feedback they
   wrote stays so the people they wrote it about keep it.
4. A types their own email address to confirm — not a checkbox, because a checkbox is pressed by
   accident.
5. A is signed out immediately and lands on the signed-out page. Signing in again with the same Google
   account does **not** restore anything (§7 Q4 decides whether it is refused outright or starts a new
   empty Account).
6. As B, reload the feed. A's Feedback is **still there, with its words**, attributed to a placeholder
   — no name, no photo, no link to a Profile.
7. The Mention inside the text of that Feedback renders as the same placeholder, **not** as A's old
   name. *(This is the step that fails under a naive implementation — §1.)*
8. *Feedback for me* still shows the answer A gave B, attributed the same way.
9. The teammate picker, the Members list and the Mention autocomplete do not offer A at all.
10. As an Admin, open Settings → Members. A is gone from the list entirely — not greyed out, which is
    what Deactivate does.

**And the one that matters for trust:** nowhere in the product, by any address or any amount of
fiddling, does A's name or photo still appear.

## 5. Scope

### In

- A data classification comment on **every** persisted field in `schema.prisma`, in the four classes
  `GEN_09` R3 defines (`public`, `internal`, `personal`, `sensitive`), plus a retention statement on
  every field classified `personal` or `sensitive` (`GEN_09` R5)
- An automated check that a new persisted field cannot merge without one — the guardrail `GEN_09`'s own
  Open questions propose, in the style of the existing `apps/api/scripts/check-architecture.mjs`
- Dropping `Session.ipAddress` and `Session.userAgent`, and pruning expired sessions
- A self-service **Erase** on Settings → Account, with a typed confirmation
- A `ForgetPersonPort` published by every module holding personal data, and an Identity-owned sequence
  that calls them, resumable and idempotent
- An `ErasureRequest` audit record — who, when, which steps completed

### Out, and why

| Out | Why |
| --- | --- |
| **Who the data controller is, and the DPA** | Not engineering. It is brain Open decision #2 (company vs SkillLane) wearing a different hat, and until an entity exists there is nobody to sign a Data Processing Agreement. It blocks selling, not building, and it is kritpavin's |
| **The cross-border transfer basis** | Supabase is in `ap-southeast-1` (Singapore), so Feedback written in Thailand already leaves Thailand (ADR 0020). PDPA restricts that and wants a documented basis. A Thai lawyer's question, not this document's — but it must be answered before a first customer, and nothing currently records it |
| **A privacy notice and a consent surface** | `FE_24` (analytics, tracking & consent) is `todo` and there is no analytics to consent to yet. Revisit when the first tracking call is proposed |
| **Rate limiting, CORS, headers, audit trail generally** | `BE_22` is `todo` and owns all of it. Its own binding text names "audit trail", which this document borrows for `ErasureRequest` only. Rate limiting is a real gap — nothing throttles the Invitation route against Resend's 100-a-day shared quota — and it deserves its own card, not a ride on this one |
| **Repository visibility** | `Thrive-monorepo-2` is public by inheritance from the fork, which both `STATE.md` and `PROJECT.md` call unresolved. A decision worth making deliberately; it changes no code |
| **Erasing on an Admin's behalf** | §7 Q2. An Admin erasing somebody else is a different feature with a different abuse profile, and Deactivate already covers the legitimate "this person left" case |
| **Exporting a person's data before erasing** | PDPA's portability right is real and separate. It needs its own screen and its own format decision; nothing is lost by sequencing it after |
| **Erasing one Workspace's data but not another's** | An Account spans Workspaces (`ADR-0034`). Partial erasure is a per-Workspace Deactivate, which already exists |
| **Retroactively scrubbing Discord** | A channel post cannot be taken back — brain `ADR-0045` already accepted exactly this, on the record, for Kudos. Erase cannot and does not promise to reach a third party's server |

## 6. The rules

Product rules. The technical design implements them; it does not get to choose them.

1. **Erase is not Deactivate.** Deactivate is per Workspace, reversible, and keeps the name visible
   (`glossary.md:65`). Erase is per Account, irreversible, and removes the name. Neither is built on the
   other.
2. **Other people's records survive.** Feedback a person wrote about a colleague, and Feedback written
   about them, keeps its words. Erasing one person must not silently rewrite what another person was
   told about themselves. *(Subject to §7 Q1.)*
3. **Every copy of the name goes, including the denormalised ones.** `FeedbackMention.displayName`,
   `FeedbackRequestMention.displayName` and `KudosMention.displayName` are personal data living outside
   Identity. An erasure that misses them has not happened.
4. **One placeholder, everywhere.** An erased person reads the same in the feed, in a Mention, on an
   answer and in *Feedback for me*. Not a blank, not a missing card, not a different word per screen.
5. **It cannot be undone, and the person is told that before it happens**, in the confirmation, in
   plain words.
6. **It must be resumable.** `AGENTS.md` §6 forbids a cross-module transaction, so erasure is a sequence
   of per-module steps. A crash halfway must be resumable to completion, never leave a half-erased
   person, and never need a human to inspect the database.
7. **A Workspace never loses its last Admin to an erasure.** Every Admin having the same powers and a
   Workspace always keeping one active Admin are existing invariants (`glossary.md:61`, ADR 0046, ADR
   0047). Erase is at least as destructive as Deactivate and must respect them under the same lock.
   *(§7 Q3 decides whether it refuses or forces a hand-over.)*
8. **The erasure itself is recorded.** Not the data — the fact: who asked, when, which steps finished.
   `GEN_09` R3 wants access to sensitive data recorded, and rule 6 cannot be delivered without it.
9. **Erasing must never be able to fail silently.** If a module's step cannot complete, the request stays
   open and visible, rather than being reported as done.

## 7. Product questions — all open

**Nobody has answered any of these.** They are the reason this document is `draft` and the reason
nothing in §5 is buildable yet. Each carries my recommendation and its cost; none is mine to decide.

| # | Question | Recommendation | Owner |
| --- | --- | --- | --- |
| 1 | What happens to Feedback the erased person **wrote** about others? | **Keep the words, sever the author** | kritpavin |
| 2 | Can an **Admin** erase somebody else? | **No** | kritpavin |
| 3 | What if the person is a Workspace's **last Admin**? | **Refuse, and say why** | kritpavin |
| 4 | Can the same email address sign up again afterwards? | **Yes, as a brand-new empty Account** | naroebordin |

### 7.1 Q1 — the one that matters

**The tension, stated plainly.** B received Feedback from A. It is about B's work, B was promised it,
and for B it may be the only written record of something. A then erases their Account. Deleting A's
Feedback destroys B's record of their own performance — the thing the product exists to give them.
Keeping it attributed to A leaves A's name in the system, which is the opposite of erasure.

**Recommended: keep the words, sever the author.** Replace `giverAccountId` with a tombstone, scrub
every denormalised name, delete the Profile. B keeps the Feedback; A is no longer identifiable from it.
This is the standard reading of an erasure right — the data subject's *identifier* is what must go, not
every record they ever touched, particularly when the record is also about somebody else who has their
own interest in it.

**What makes it defensible rather than convenient:** Thrive already took the same shape for Deactivate.
`glossary.md:65` defines Deactivate as ending access *"keeping the Feedback they gave and received"*.
Erase going further on identity but not on other people's records is a consistent position, not a
special case invented to save work.

**The honest counter-argument, which kritpavin should weigh.** Feedback is free text. A person can
write something that identifies them regardless of the byline — *"as your manager since January, I
think…"*. Severing the author does not scrub the body, and Thrive will not read 4,000-character
messages to find out. So the recommendation is *erasure of the identifier*, and it should be described
to users in exactly those words rather than as "everything you wrote disappears", which would be a
promise the product cannot keep.

**The alternatives, and what each costs:**

| Option | What it means for B | Why not recommended |
| --- | --- | --- |
| Delete every piece of Feedback A wrote | B loses Feedback about B's own work, with no notice and no way to recover it | Destroys a third party's record to satisfy a second party's request. The most likely source of a furious support email |
| Keep it fully attributed, erase only sign-in | B's view is unchanged | Not an erasure. The name stays; the glossary row promises it goes |
| Ask A which pieces to keep | Maximum respect for A | A screen listing everything A ever wrote, at the moment they are leaving angry. High effort, and it hands A an edit right over B's record |

### 7.2 Q2 — Admin-initiated erasure

**Recommended: no.** Deactivate already covers "this person has left the company" — it is reversible,
it keeps the record, and an Admin can already do it. Erase is irreversible and removes data other
Members can see; giving one Member a button that permanently destroys another Member's identity is a
large abuse surface for a case that is already served.

**The counter-argument worth hearing:** under PDPA the *customer* is the controller and may be obliged
to erase an ex-employee who will never sign in again to ask. If that obligation is real, the answer is
probably an Admin **request** that Thrive fulfils out of band, not a button — which is a support
process, not a feature, and does not block this card.

### 7.3 Q3 — the last Admin

A Workspace always keeps at least one active Admin (`glossary.md:61`), enforced under an advisory lock
for both Role changes (ADR 0046) and Deactivate (ADR 0047). Erase is strictly more destructive, so it
inherits the invariant — the only question is the behaviour when it bites.

**Recommended: refuse, and say why** — *"You are the only Admin of Acme. Make somebody else an Admin
first, or Deactivate the Workspace."* The alternative, auto-promoting the longest-serving Member, hands
somebody administrative powers over their colleagues' Workspace without either party choosing it.

**The gap this exposes, which is not this card's to fix:** there is no way to delete a Workspace. A sole
founder with no teammates cannot erase themselves under any answer to Q3, because there is nobody to
hand Admin to and nothing to hand it over. That is a real hole and it deserves its own card.

### 7.4 Q4 — coming back

**Recommended: yes, as a brand-new empty Account.** Refusing the address forever means keeping a
permanent record of *"this email erased itself"*, which is itself personal data retained for the sole
purpose of denying service. Allowing a fresh sign-up keeps no such list.

**The consequence to accept:** the erased person's old email must be released by the Account row, and
their old Memberships are gone, so an Admin has to invite them again and they come back as a stranger
with no history. That is the correct outcome and the confirmation copy should say so.

## 8. What this changes elsewhere

| | Change | Where |
| --- | --- | --- |
| 1 | Every read that renders a person must tolerate a tombstone Account | `AccountSummaryPort`, `ProfileNamePort`. The technical design's D2 is chosen specifically so this is **no change at all** — the row still exists and still answers |
| 2 | Two `todo` conventions get interpreted rather than written | §8 of the technical design names both, per `AGENTS.md` §2 |
| 3 | A brain ADR records the Q1–Q4 answers | `Thrive-brain/decisions/ADR-0049-*`, next free number. Append-only; this document is not a substitute for it |
| 4 | The glossary's **Erase** row moves from planned to built, and gains the Q1 answer | `glossary.md:66` |
| 5 | `STATE.md` loses "No PDPA data map" from *Deliberately not done yet* | brain `STATE.md` |

## 9. The cards

Four, because the first two are independently valuable and **not blocked on §7**, while the last two
cannot start until kritpavin answers Q1–Q3. Splitting them is what lets the unblocked work proceed now.

> **PR-0001 · Classify every stored field, and keep it classified**
> `Area: Foundation` · `Type: Task` · Size **S** · **Blocked by: nothing**
> Every field in `schema.prisma` carries a `GEN_09` R3 class; `personal` and `sensitive` also carry a
> retention line; a check script fails CI on a new field without one. No behaviour change, no migration.

> **PR-0002 · Stop collecting what nothing reads**
> `Area: Foundation` · `Type: Task` · Size **S** · **Blocked by: PR-0001**
> Drop `Session.ipAddress` and `Session.userAgent`, turn off Better Auth's capture of them, prune
> expired sessions, and state the session retention. Satisfies `GEN_09` R5 for the one case already
> found in violation.

> **PR-0003 · A person can erase their Account**
> `Area: Auth and Workspace` · `Type: Task` · Size **L** · **Blocked by: brain ADR-0049, PR-0001**
> The `ForgetPersonPort` in each module, the Identity-owned sequence, `ErasureRequest`, the tombstone,
> the route, and the Gherkin scenarios.

> **PR-0004 · Erase from Settings → Account**
> `Area: Auth and Workspace` · `Type: Task` · Size **M** · **Blocked by: PR-0003**
> The screen, the typed confirmation, the sign-out, and the §4 walk end to end.

**Acceptance criteria for PR-0003 and PR-0004 together** — the §4 walk, plus:

- [ ] After erasure no screen, route or API response carries the person's name, Display name, slug or
      photo
- [ ] Feedback they wrote keeps its words and renders as the placeholder
- [ ] A Mention of them inside another person's text renders as the placeholder, not their old name
- [ ] They cannot sign in; their sessions are gone immediately, not at expiry
- [ ] A Workspace is never left without an active Admin
- [ ] Interrupting the sequence halfway and re-running it completes, and running it twice is harmless
- [ ] An `ErasureRequest` records who, when, and which steps completed
- [ ] Nothing in `apps/api` logs the erased person's personal data on the way out (`GEN_09` R4)

## 10. How we know it worked

**Honestly: there is nothing to measure.** Zero users, no analytics (`FE_24` is `todo`), and a feature
nobody should ever need to use is a bad candidate for a metric. The checks that mean something:

- The §4 walk passes, step 7 included — that step is the one a naive implementation fails.
- `grep` for the erased person's Display name across a seeded database returns nothing, in any table.
  This is the only acceptance criterion that cannot be faked by a passing test, and it should be run by
  hand once.
- The classification check blocks a deliberately unclassified field in CI. Proven with a fixture, the
  way every `dependency-cruiser` rule already is under `scripts/arch-fixtures/`.
- A year from now, a new engineer adding a table writes a classification without being asked, because
  the check tells them to.
