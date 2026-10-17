/** One piece of Feedback written to the signed-in person, as Feedback for me shows it. */
export type ReceivedFeedback = {
  readonly id: string;
  /** What it is about: the Topic they were asked about, or the Giver's own. */
  readonly topic: string;
  /** Given without being asked, rather than in answer to one of this person's requests. */
  readonly offered: boolean;
  /** The Giver, by the name on their Profile, or `null` while they have none. */
  readonly giverName: string | null;
  /** Deactivated in this Workspace, so shown as inactive; what they wrote stays. */
  readonly giverInactive: boolean;
  /** What they wrote, as they wrote it — line breaks and all. */
  readonly body: string;
  /** ISO 8601, formatted where it is shown. */
  readonly writtenAt: string;
};
