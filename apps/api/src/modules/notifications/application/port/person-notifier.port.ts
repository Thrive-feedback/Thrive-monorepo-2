import type { NotificationAudience } from '../../domain/value-object/notification-audience.vo';

/** What every notification carries: which Workspace it is about, and who caused it. */
export interface PersonEvent {
  readonly workspaceId: string;
  /** Who did the thing. Never notified about their own action. */
  readonly actorAccountId: string;
  /**
   * Who can read what the line points at, said only to people allowed to know it: the Feedback
   * Request's Visibility for its Requester, the Feedback's own for its Receivers and the people it
   * was shared with. Fixed once written, so the bell can keep it.
   *
   * Absent for an Ask's Givers unless the answer goes on the Workspace feed, because a Giver is
   * not told who else reads their answer (brain `ADR-0046` decision 4), and on an event enqueued
   * before it was sent. Either is recorded with none, and the bell draws no icon.
   */
  readonly audience?: NotificationAudience;
}

/**
 * **Ids only, deliberately.** `0021` D11 planned to pass the Workspace's name and the actor's
 * name as arguments, on the grounds that the caller already held both. That is true of
 * Integrations, whose guard resolves a whole membership — and **false of Feedback**, whose guard
 * only asks whether the caller is a Member (`modules/feedback/presentation/workspace-member.guard.ts`).
 * Found while building #213.
 *
 * So Notifications resolves both itself, through what Workspace and Identity publish. It costs
 * two reads per event, after the transaction has committed and off the path of anything a person
 * is waiting for — and it keeps Feedback's call sites to the ids they already hold, which is
 * what stops them being reopened every time a message changes.
 */

export interface AskReceived extends PersonEvent {
  /** The Members asked. One notification each. */
  readonly giverAccountIds: readonly string[];
  /** What was asked about, for a chat message. In-app carries none of the words. */
  readonly requestMessage: string;
  /** The Ask each Giver opens, by Giver. */
  readonly askIdByGiver: Readonly<Record<string, string>>;
}

export interface AskAnswered extends PersonEvent {
  /** The Requester, and nobody else — not the other Givers on the same request. */
  readonly requesterAccountId: string;
  /** The request they open. Nothing of what was written travels with this. */
  readonly feedbackRequestId: string;
}

export interface FeedbackWritten extends PersonEvent {
  /** Everyone it was written to: one or more (brain `ADR-0044`). */
  readonly receiverAccountIds: readonly string[];
  /** Anyone else it was shared with. A Receiver is never counted twice. */
  readonly sharedWithAccountIds: readonly string[];
  /** The Feedback they open. None of its words travel with this. */
  readonly feedbackId: string;
}

/**
 * Telling one person something happened to them — somebody asked them for Feedback, answered a
 * request they sent, or wrote Feedback to them.
 *
 * **Published.** Feedback calls it after its own transaction commits, and never learns how
 * anybody is reached: whether that is a bell inside Thrive, a chat tool, or both is this
 * module's business. Methods are named after the thing that happened rather than after a
 * message, because composing the words needs the recipient's language, which lives on a Profile
 * Feedback does not own (design 0021 D2).
 *
 * **Nothing a person does may fail because somebody could not be told** (`ADR-0035` §8) — and
 * since ADR 0076 that holds because the caller is the outbox relay rather than a use case.
 * Feedback commits and enqueues; whether anybody was reached is settled afterwards.
 *
 * So these **reject when the bell line could not be written**, which the relay retries: the row
 * is unique per person per thing, so a second write is a no-op. A chat message that could not be
 * delivered is still logged once and dropped, because it cannot be unsent.
 */
export abstract class PersonNotifierPort {
  abstract askReceived(event: AskReceived): Promise<void>;

  abstract askAnswered(event: AskAnswered): Promise<void>;

  abstract feedbackWritten(event: FeedbackWritten): Promise<void>;
}
