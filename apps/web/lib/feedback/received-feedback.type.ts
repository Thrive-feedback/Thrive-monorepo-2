import type { FeedbackPerson } from './feedback-person.util';
import type { TextTags } from './text-tags.type';

/** One piece of Feedback written to the signed-in person, as Feedback for me shows it. */
export type ReceivedFeedback = {
  readonly id: string;
  /** Given without being asked, rather than in answer to one of this person's requests. */
  readonly offered: boolean;
  /** The Giver, by the name on their Profile, or `null` while they have none. */
  readonly giverName: string | null;
  /** The Giver's Google photo, or `null` when they have none. */
  readonly giverPhotoUrl: string | null;
  /** Deactivated in this Workspace, so shown as inactive; what they wrote stays. */
  readonly giverInactive: boolean;
  /** Everyone else it was written to, in the order the Giver chose them; empty when only them. */
  readonly otherReceivers: readonly FeedbackPerson[];
  /** The Feedback message, as they wrote it — line breaks and all. */
  readonly message: string;
  /** What the Feedback message was bound to. */
  readonly messageTags: TextTags;
  /** ISO 8601, formatted where it is shown. */
  readonly writtenAt: string;
};
