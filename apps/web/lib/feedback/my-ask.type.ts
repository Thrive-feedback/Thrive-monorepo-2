import type { AskStatus } from './ask-status.constant';
import type { TextTags } from './text-tags.type';

/** One Ask waiting for the signed-in person, as Waiting for me lists it. */
export type MyAsk = {
  readonly askId: string;
  /** The Request message. */
  readonly message: string;
  /** What the Request message was bound to when the request was sent. */
  readonly messageTags: TextTags;
  /** The Member who asked, or `null` while they have not introduced themselves. */
  readonly requesterName: string | null;
  /** The Requester's Google photo, or `null` when they have none. */
  readonly requesterPhotoUrl: string | null;
  /** Deactivated in this Workspace, so shown as inactive; what they wrote stays. */
  readonly requesterInactive: boolean;
  /** ISO 8601, formatted where it is shown. */
  readonly askedAt: string;
  readonly status: AskStatus;
};
