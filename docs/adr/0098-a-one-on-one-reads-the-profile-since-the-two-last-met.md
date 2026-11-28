# 0098 — A 1:1 reads the other person's Profile since the two last met, and checks what is brought from it

Status:   proposed — accept or change it on review
Date:     2026-11-28
Deciders: kritpavin

## Context

Before a meeting, a 1:1's *Before you meet* shows each person the other's Profile as they read it:
the same tabs and the same items, bounded to the time since the two last met. Either person can
bring an item onto the agenda (brain ADR-0063, proposed). ADR 0097 gives a Profile its lists:
*Everyone sees* (Feedback, Kudos) and *For you* (Between you two, Shared with you, Open asks).
It also gives them a `since` bound and their counts.

The rule is that the two screens are one experience and differ only in time, in loading and in card
size. This needs to be settled in code:

- how the 1:1 reads the Profile's lists;
- who works out "since the two last met";
- how a topic remembers the item it came from;
- how an item id sent by a client is trusted.

## Decision

**The 1:1's web page reads the Profile's own routes, with a `since` it works out from the meetings it
already holds. The API keeps no 1:1 read of its own. A topic names its source by kind and id. Feedback
publishes one port that answers whether that item is on the other person's Profile for the caller.**

- **One read, two screens.** *Before you meet* calls
  `GET …/members/{accountId}/profile-items?show=…&since=…` for each tab, and
  `GET …/members/{accountId}/profile-item-counts?since=…` for the numbers on the tabs. Open asks
  never take `since` (ADR 0097).
  - The 1:1 has no route of its own for this, so the two screens cannot drift apart.
  - A Profile and a 1:1 differ only in what the web page passes and in how it draws the cards.
- **The page works out `since`.**
  - It is the `startedAt` of the newest finished meeting, which the page already reads for Past
    meetings.
  - Before the first finished meeting, it is the start of the calendar day 30 days back on the
    schedule's clock. Skipped days have no meeting, so they never move it.
  - `since` only narrows a list the reader may already read, so a wrong one shows less, never more.
- **A topic names its source.**
  - `one_on_one_topic` has `broughtFromKind` (`FEEDBACK`, `KUDOS` or `ASK`) and `broughtFromId`.
  - They are nullable, with no foreign key into Feedback's tables (`BE_03` R7).
  - The topic keeps its own text, so an item that later goes leaves a topic that still reads.
  - Carrying a topic over, or using a template, copies only the text.
- **A source is checked, not trusted.**
  - `AddTopicUseCase` asks `FeedbackAboutPersonPort.isOnProfileFor`, published by Feedback
    (`BE_03` R5), whether the item is on the other person's Profile for the caller.
  - The adapter answers with the very filters those lists read, with the id ANDed on
    (`isFeedbackOnProfileFor`, `isKudosOnProfileFor`, `isAskOpenBetween`), so the check cannot
    disagree with the Profile.
  - An item it does not find is refused as `ONE_ON_ONE_TOPIC_SOURCE_NOT_FOUND`. That is the same
    answer whether the item does not exist or is not the caller's to see.
  - The same source twice on one agenda is refused as `ONE_ON_ONE_TOPIC_ALREADY_ON_AGENDA`.

## Consequences

- **Migrations.** There are two, both expand-only (`BE_15`).
  - `one_on_one_topic_brought_from` adds the enum and the two columns.
  - `one_on_one_topic_brought_from_ask` adds `ASK` to the enum.
  - Rollback: drop the two columns and the enum, once no code reads them.
- **The contract is additive** (`GEN_08` R7): `broughtFrom` on the add-topic body and on every
  topic, and two error codes.
- **Round trips.** *Before you meet* makes up to six reads (five tabs and the counts). It makes them
  after the meeting reads, because `since` comes from Past meetings. ADR 0097 measured the counts for
  30 days at about 12 ms.
- **Dependency.** One-on-one depends on Feedback through one port. Feedback does not depend on it.

## Alternatives considered

- **A 1:1 route that reads Feedback for the 1:1.** Built first, then removed. It gave the 1:1 a
  second list of its own, with its own trust rules, which ADR-0063's "one experience" rules out.
- **The API works out `since`.** That would need a 1:1 route again, only to read one timestamp the
  page already has.
- **Trust the id the client sends.** A topic could then name an item its author could not read, and a
  later screen resolving it would leak. The check costs one indexed read.
