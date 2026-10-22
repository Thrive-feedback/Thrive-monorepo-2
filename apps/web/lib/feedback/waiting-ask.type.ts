import type { AskStatus } from './ask-status.constant';
import type { TextTags } from './text-tags.type';

/** One Ask as the Member it waits on reads it, in the dialog where they answer it. */
export type WaitingAsk = {
  readonly askId: string;
  readonly feedbackRequestId: string;
  /** The Request message. */
  readonly message: string;
  /** What the Request message was bound to when the request was sent. */
  readonly messageTags: TextTags;
  /** The Member who asked, or `null` while they have not introduced themselves. */
  readonly requesterName: string | null;
  /** Deactivated in this Workspace, so shown as inactive; what they wrote stays. */
  readonly requesterInactive: boolean;
  readonly status: AskStatus;
};
