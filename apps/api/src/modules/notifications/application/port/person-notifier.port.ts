/** What every notification carries: which Workspace it is about, and who caused it. */
interface PersonEvent {
  readonly workspaceId: string;
  /** Who did the thing. Never notified about their own action. */
  readonly actorAccountId: string;
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
  /** Who it was written to. */
  readonly receiverAccountId: string;
  /** Anyone else it was shared with. The Receiver is never counted twice. */
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
 * **Nothing a person does may fail because somebody could not be told.** Every method resolves
 * rather than rejecting; an unreachable person is logged once and skipped (`ADR-0035` §8).
 */
export abstract class PersonNotifierPort {
  abstract askReceived(event: AskReceived): Promise<void>;

  abstract askAnswered(event: AskAnswered): Promise<void>;

  abstract feedbackWritten(event: FeedbackWritten): Promise<void>;
}
