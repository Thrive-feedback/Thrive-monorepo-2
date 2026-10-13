import type { AskStatus } from '@/app/(signed-in)/(side-nav)/feedback/_lib/ask-status.constant';

/** One Ask waiting for the signed-in person, as Waiting for me lists it. */
export type MyAsk = {
  readonly askId: string;
  readonly topic: string;
  /** The Member who asked, or `null` while they have not introduced themselves. */
  readonly requesterName: string | null;
  /** ISO 8601, formatted where it is shown. */
  readonly askedAt: string;
  readonly status: AskStatus;
};
