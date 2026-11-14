# 0086 — A Kudos tells the people it names

Status:   accepted
Date:     2026-11-14
Deciders: kritpavin

Supersedes the consequence of [ADR 0060](0060-kudos-is-its-own-table-and-the-feed-merges-on-the-web.md)
that reads *"Nobody is notified of a Kudos; `PersonNotifierPort` has no Kudos message yet."*
Everything else in 0060 stands.

## Context

Four things tell a Member something happened to them: being asked for Feedback, an answer to their
request, Feedback written to them, and Feedback shared with them (design 0022). A Kudos told only the
Workspace's channel, through Integrations (ADR 0062), so somebody praised by name learned of it only
if they happened to open the Kudos board or the channel.

## Decision

**A Kudos tells, in person, each Member it @mentions: a line in their bell and, if they linked a chat
tool, a direct message.** It is the fifth notification kind, `KUDOS_RECEIVED`.

- **A Kudos naming nobody tells nobody.** It is for the whole Workspace, every Member reads it on the
  board, and telling all of them would put a line in every bell each time anyone thanks the team.
- **The giver is never told**, and a Deactivated Member is not either. These are the same recipient
  rules as every other kind (`NotificationRecipients`).
- **Neither the line nor the message carries the Kudos's words.** The channel post is the one place
  they travel (brain `ADR-0045`). The line names who gave it, and the link opens Received showing
  Kudos (`/received?show=kudos`), because a Kudos has no address of its own.
- **The line's audience is `EVERYONE`**, because every Member can read every Kudos.

Feedback enqueues `notifications.kudos_received` in the Kudos's own transaction, beside
`integrations.kudos_given` (ADR 0076). It does so only when the Kudos names somebody.

## Alternatives considered

- **Tell every Member about a Kudos for the whole Workspace.** Rejected: it adds a line to every bell
  for something every Member already sees on the board. It is the one shape of notification here
  that grows with the size of the Workspace rather than with what happened to the person.
- **The bell only, no direct message.** Rejected by the owner. Every other kind reaches a linked chat
  tool, and a person who linked one expects the same here. The channel post does not stand in for
  it: not every Workspace connects a channel, and a channel is read by everybody, not by the person
  praised.
- **Open the Kudos board instead of Received.** Rejected: the board is the Workspace's, and Received
  showing Kudos is the list of what was given to *this* person, which is what the line is about.

## Consequences

- A Kudos that mentions three people writes three rows and up to three direct messages, as a
  Feedback Request asking three people does.
- **The new `type` value is breaking for the web that is live before this ships** (`GEN_08` R7: a new
  enum member the consumer must handle). That web has no sentence for `KUDOS_RECEIVED`, and a bell
  that is handed one throws while drawing the line. It ships in one pull request with its consumer
  regardless, against `GEN_08` R8. The window is the minutes between the API and the web finishing
  one deploy run, plus any tab left open from before it, which recovers on reload. That is accepted
  because the product is pre-launch (`PROJECT.md`).
- **The next kind will not be breaking.** The bell now leaves out a line of a kind it has no
  sentence for (`isDrawableKind`), checked in the bundle that draws the line rather than on the
  server that answered, so it covers an API deployed ahead of the web and a tab opened before a
  web deploy alike. Every table of kinds stays keyed by the contract's type, so a new kind still
  fails to compile until it is given one. The API
  already does the same in both directions: it lists only the kinds it knows, and now counts only
  those too, so a rollback past this change cannot leave a badge with no line behind it. What a
  future kind can still do, while the API is ahead of the web, is raise the badge by a line the
  older web leaves out. Nothing breaks, and it clears when the web deploys or on Mark all as read.
- **An old replica can drop a Kudos notification during a deploy.** While the old and new API
  overlap, the old relay has no handler for `notifications.kudos_received` and marks such a row dead
  at once (ADR 0076 covered unknown types left behind, not types written ahead). The window is the
  seconds of overlap, and the row can be replayed. After deploying, check for dead
  `notifications.kudos_received` rows whose `lastError` begins with "no handler". Backing off on a
  missing handler instead of dying is a change to ADR 0076, for its own record.
- `notification.type` is text, so no migration is needed.
- The web's copy, tone and showcase tables are keyed by the contract's type, so they failed to
  compile until each said what a Kudos line is: the sentence "*Name* gave you kudos" and the warm
  (`secondary`) dot.
- Being praised by name is now something a person is told about, unlike being part of a Kudos for
  everybody. That difference is deliberate, and it is the one most likely to be questioned.
