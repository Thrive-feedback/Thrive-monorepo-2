# 0092 — Opening a page reads the bell lines that lead to it

Status:   accepted
Date:     2026-11-15
Deciders: kritpavin

## Context

ADR 0091 moved the navigation's counts off the bell. They are now read from the Asks, Feedback and
Kudos themselves, so reading the bell no longer clears them. The opposite gap remained: opening the
page a line points at did not read the line. Someone who opened their Kudos still had a bell telling
them about the same Kudos, which put every event on screen twice.

The product owner kept the bell and its number, and decided that seeing the thing reads the line about
it.

## Decision

**A bell line is read when the person opens the page it leads to.** Each kind's page is the page its
`destinationFor` opens. The web records this in `readIn` beside the sentence and destination of each
kind (`notification-copy.constant.ts`).

| Opened | Lines read | Count |
|---|---|---|
| Waiting for me | `ASK_RECEIVED` | stays: it is the Asks still waiting, which only answering takes down |
| Received → My requests | `ASK_ANSWERED` | goes, as ADR 0091 |
| Received → Given to me | `FEEDBACK_RECEIVED` | goes |
| Received → Kudos | `KUDOS_RECEIVED` | goes |
| Home → Shared with me | `FEEDBACK_SHARED` | goes |

- **Choosing All reads nothing**, on Received or on Home, for the same reason it clears no count.
- **Only lines that exist when the mark arrives are read.** A line that arrives while the page stays
  open is not on that page yet, so it stays unread until the page is opened again.
- **`POST /v1/workspaces/{workspaceId}/notifications/read` takes an optional body `{ types }`.**
  With no body it marks every kind, which is Mark all as read as before. With `types` it marks only
  those kinds, for this caller in this Workspace. The body is optional in the contract, so the
  existing call without a body still matches it.
- **The web makes one server action, `markPlaceOpened(place)`, for each opening.** It reads the
  Workspace once, then sends `notifications/read { types }` and, for a list with a count,
  `me/seen { list }` together. That costs three API calls. The bell marks its own lines read at once
  and takes its number down by as many lines as it holds.
- **The mark is sent from the browser once the page is on screen**, never while the server renders
  it, because a prefetched link renders the page too. Waiting for me does this through a component
  that draws nothing.

## Consequences

- An event shows on the bell until its page is opened, and then on neither the bell nor that list's
  count. Waiting for me is the exception on purpose: its count stays while the Ask waits.
- Notifications and Feedback are written by two separate calls. If one fails, its number stays wrong
  until the next poll reads the truth back. Neither module reads the other's tables (BE_03).
- When a page opens, the bell's number drops by the matching lines it has loaded. Lines older than
  the pages the bell has loaded are read on the server but only leave the number on the next poll,
  which happens past a hundred lines at most.
- Opening a page of one kind costs three API calls, one more than the seen mark alone.
- **The same window as ADR 0091.** The mark reads every unread line of those kinds when it arrives,
  which is after the page has drawn. A line whose subject committed between the two was never on
  the page, yet is read. In practice the outbox writes such a line after the mark, so it stays
  unread; the gap is the rare line written inside that window.

## Alternatives rejected

- **Feedback marks the lines through a port of the Notifications module.** That would mean one call
  from the web, but Waiting for me has no seen mark in Feedback to hang the call on. It would also
  make Feedback own a decision about the bell.
- **A dot on the bell instead of a number.** The owner kept the number. Reading lines on open
  already removes most of the double counting.
- **Reading every kind on All.** The bell and the chips would disagree about the same item.
- **Reading new lines continuously while a page stays open.** That would read lines the page does
  not show until it is reloaded.

## Links

- ADR 0091 (where the counts come from)
- Design 0022 requirement §5 question 5 (read on being pressed, plus Mark all as read), amended
- Brain `ADR-0055` (the product decision this builds)
