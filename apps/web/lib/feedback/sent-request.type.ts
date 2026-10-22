import type { AskStatus } from './ask-status.constant';
import type { TextTags } from './text-tags.type';

/** One Member asked, as My requests lists them. */
export type SentAsk = {
  readonly askId: string;
  /** The Member asked, by the name on their Profile, or their Account id while they have none. */
  readonly giverName: string | null;
  /** Deactivated in this Workspace, so shown as inactive; what they wrote stays. */
  readonly giverInactive: boolean;
  readonly status: AskStatus;
};

/** One Feedback Request the signed-in person sent, as My requests lists it. */
export type SentRequest = {
  readonly id: string;
  /** The Request message. */
  readonly message: string;
  /** What the Request message was bound to when the request was sent. */
  readonly messageTags: TextTags;
  /** ISO 8601, formatted where it is shown. */
  readonly sentAt: string;
  readonly asks: readonly SentAsk[];
};
