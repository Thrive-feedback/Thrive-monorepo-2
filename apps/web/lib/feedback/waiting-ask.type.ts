import type { AskStatus } from './ask-status.constant';

/** One Ask as the Member it waits on reads it, in the dialog where they answer it. */
export type WaitingAsk = {
  readonly askId: string;
  readonly feedbackRequestId: string;
  readonly topic: string;
  /** The Member who asked, or `null` while they have not introduced themselves. */
  readonly requesterName: string | null;
  readonly status: AskStatus;
};
