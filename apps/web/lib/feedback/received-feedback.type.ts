/** One piece of Feedback written to the signed-in person, as Feedback for me shows it. */
export type ReceivedFeedback = {
  readonly id: string;
  /** What the Giver was asked about. */
  readonly topic: string;
  /** The Giver, by the name on their Profile, or `null` while they have none. */
  readonly giverName: string | null;
  /** What they wrote, as they wrote it — line breaks and all. */
  readonly body: string;
  /** ISO 8601, formatted where it is shown. */
  readonly writtenAt: string;
};
