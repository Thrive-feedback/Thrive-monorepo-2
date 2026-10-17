import type { AskStatus } from './ask-status.constant';

/** One Ask waiting for the signed-in person, as Waiting for me lists it. */
export type MyAsk = {
  readonly askId: string;
  readonly topic: string;
  /** The Member who asked, or `null` while they have not introduced themselves. */
  readonly requesterName: string | null;
  /** Deactivated in this Workspace, so shown as inactive; what they wrote stays. */
  readonly requesterInactive: boolean;
  /** ISO 8601, formatted where it is shown. */
  readonly askedAt: string;
  readonly status: AskStatus;
};
