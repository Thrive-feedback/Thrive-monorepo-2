import type { TextTags } from './text-tags.type';

/** One piece of Feedback the signed-in person wrote, as Feedback I've given shows it. */
export type GivenFeedback = {
  readonly id: string;
  /** What it is about: the Topic they were asked about, or their own. */
  readonly topic: string;
  /** What the Topic was bound to: theirs if Offered, the request's if it answers one. */
  readonly topicTags: TextTags;
  /** Given without being asked, rather than in answer to somebody's request. */
  readonly offered: boolean;
  /** The Receiver, by the name on their Profile, or `null` while they have none. */
  readonly receiverName: string | null;
  /** Deactivated in this Workspace, so shown as inactive; what was written stays. */
  readonly receiverInactive: boolean;
  /** What they wrote, as they wrote it — line breaks and all. */
  readonly body: string;
  /** What they wrote was bound to. */
  readonly bodyTags: TextTags;
  /** ISO 8601, formatted where it is shown. */
  readonly writtenAt: string;
};
