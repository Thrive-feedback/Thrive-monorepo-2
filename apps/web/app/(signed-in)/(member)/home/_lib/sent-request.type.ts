import type { AskStatus } from '@/app/(signed-in)/(member)/feedback/_lib/ask-status.constant';

/** One Member asked, as My requests lists them. */
export type SentAsk = {
  readonly askId: string;
  /** The Member asked, by the name on their Profile, or their Account id while they have none. */
  readonly giverName: string | null;
  readonly status: AskStatus;
};

/** One Feedback Request the signed-in person sent, as My requests lists it. */
export type SentRequest = {
  readonly id: string;
  readonly topic: string;
  /** ISO 8601, formatted where it is shown. */
  readonly sentAt: string;
  readonly asks: readonly SentAsk[];
};
