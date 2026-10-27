# 0062 — Integrations publishes what a channel is told, and Feedback calls it beside the person notifier

Status:   accepted
Date:     2026-10-27
Deciders: naroebordin

## Context

A Workspace can connect a Discord channel (#199, merged 2026-10-23) and disconnect it (#200). The
channel has been told exactly one thing ever: the test message `ChooseChannelUseCase` posts before it
stores the Connection. **Nothing else in the application calls `ChatPoster` at all.**

So #201 — public Feedback appears in that channel — is unbuilt, and Kudos (ADR 0060, merged
2026-10-25) is announced nowhere either: its own consequences say "Nobody is notified of a Kudos."
A Member who gives Workspace-visible Feedback, or gives Kudos, sees nothing arrive in Discord. That
is the bug reported on 2026-10-27, and it is a missing feature rather than a fault.

What to post is settled in the brain and is not this record's question: `ADR-0040` for Feedback (the
Giver, the Receiver and a link — never the words) and `ADR-0045` for Kudos (the message, because a
Kudos has no Visibility and is praise written to be read).

**Where the code goes is this record's question**, and the obvious answer is the wrong one.
`FanOutPersonNotifier` already turns one event into a bell line and a direct message, and its own
comment invites a third channel. But brain `ADR-0035` §9 is explicit:

> Integrations owns the connection to Discord **and what the channel is told**. Notifications owns
> what an individual person is told and when.

A channel is not a person. None of the three rules `NotificationRecipients` exists to enforce — the
actor is never told, one person gets one notification, a Deactivated Member is never told — mean
anything for a room. Routing a room post through a port named `PersonNotifierPort`, past a service
that de-duplicates recipients, would make both lie.

## Decision

**Integrations publishes a second port, `ChannelAnnouncerPort`, and owns everything behind it.**

```ts
// modules/integrations/index.ts
export abstract class ChannelAnnouncerPort {
  abstract feedbackPublished(event: FeedbackPublished): Promise<void>;
  abstract kudosGiven(event: KudosGiven): Promise<void>;
}
```

Three things follow:

1. **Feedback calls it beside `PersonNotifierPort`**, after its own transaction commits, never
   awaited, with the same `void … .catch(warn)` shape its three existing call sites already use
   (`BE_05` R9). `GiveKudosUseCase` gains its first such call.
2. **Integrations needs no new port into anybody.** It already owns the `integration_connection`
   table, so it reads its own channel through its own `ConnectionQuery`, which gains
   `postableChannelsOf(workspaceId)`. It posts through `ChatPoster` in `shared/application/`, which
   design `0020` D2 put there for exactly this.
3. **Notifications does not change at all.** `PersonNotifierPort`, `FanOutPersonNotifier`,
   `ChatPersonNotifier` and `NotificationRecipients` are untouched.

Two methods rather than one with a kind flag, because the two posts carry different things and are
decided by different records — `GEN_16` R7.

**Feedback decides what is public; Integrations decides what a room is told.** `feedbackPublished`
means *this Feedback was shown to the whole Workspace*, and Feedback calls it only for Visibility
`EVERYONE`. The Visibility itself does not cross the boundary: it is Feedback's concept, and a
string Integrations had to understand would be that vocabulary copied into a second module
(`BE_03` R9). Nothing about a Feedback Request is ever announced.

Names come from Identity's published `AccountSummaryPort.summariesOf`, in one call however many
people a post names — Offered Feedback has several Receivers since ADR 0061, and a Kudos is for
everybody it @mentions.

## Consequences

- **Feedback's use cases each gain a second fire-and-forget call.** Two ports, two `.catch` blocks,
  one for people and one for the room. That is more code at the call site than one combined port
  would be, and it is the price of each port's contract staying true.
- **A channel post cannot fail anything.** Unreachable is logged once at `warn` and forgotten, as
  `ADR-0035` §8 requires of a direct message. There is no delivery state and no retry: `BE_17` is
  still `todo`, and the thing being announced has already committed.
- **Requested answers are included.** `AnswerFeedbackAskUseCase` fires `askAnswered` and its commit
  result carries neither Visibility nor Receivers, so it has to widen to call this. A Feedback set to
  Everyone appears on the Workspace feed whatever its origin, and a channel that disagreed with the
  feed would be the surprising thing.
- **A Kudos post links to Home, not to the Kudos.** There is no `GET` route for one Kudos and no
  permalink — `ROUTES.homeKudos` is the toast shown after giving one. Noted in `ADR-0045`; a
  permalink is its own card and matters less here, because the post already carries the words.
- **Integrations imports `IdentityModule`.** New edge, no cycle: Identity depends on neither.
- **Rollback:** delete the port, its adapter and its copy service, and the two call sites. Nothing is
  stored, so nothing is migrated.

## Alternatives rejected

- **A third channel inside `FanOutPersonNotifier`.** The smallest diff, and it contradicts brain
  `ADR-0035` §9. It would also put a room behind a port whose every method is documented as telling
  one person about something that happened *to them*, and past the three recipient rules, which
  would then need a path around them.
- **Notifications reads the channel through a new `WorkspaceChannelPort` on Integrations.** Keeps one
  port at the call site, and inverts the ownership `ADR-0035` §9 states: the module that owns the
  Connection would hand out its channel for another module to post into, and the channel copy would
  live beside the direct-message copy that `ADR-0040` exists to keep it different from.
- **One `announce(event)` method with a kind.** `GEN_16` R7 — a thing that needs a flag to serve both
  callers is two things.
- **An event bus.** Nothing else in the application has one, and two consumers do not pay for it
  (`PROJECT.md` §2).

## Links

- Brain `ADR-0035` §5, §8, §9; brain `ADR-0040`; brain `ADR-0045`
- ADR 0060 (Kudos), ADR 0061 (Feedback has Receivers)
- `docs/design/0020-connect-a-discord-channel.md` §13 — the question this closes
- `BE_03` R2, R5, R6; `BE_05` R5, R9; `GEN_16` R7
