import type { components } from '@repo/api';
import type { BadgeTone } from '@/components/atoms/badge';

/** Where one Ask stands, as the API names it. */
export type AskStatus =
  components['schemas']['ListMyFeedbackAsksResponseDto_Output']['items'][number]['status'];

export const ASK_STATUS_NAMES: Readonly<Record<AskStatus, string>> = {
  PENDING: 'Pending',
  ANSWERED: 'Answered',
};

/**
 * Each status as a Badge tone for where it stands: waiting or done, the tones Members gives an
 * Invitation too. The word carries the same meaning, so nothing depends on seeing the colour.
 */
export const ASK_STATUS_TONES: Readonly<Record<AskStatus, BadgeTone>> = {
  PENDING: 'warning',
  ANSWERED: 'success',
};

/**
 * Each status as a ring round the face of somebody asked: solid green once they answered, dashed
 * and grey while Pending, which stays neutral (design FB-4-S4). The word says the same beside it, so
 * nothing depends on seeing the ring.
 */
export const ASK_STATUS_RINGS: Readonly<Record<AskStatus, string>> = {
  PENDING: 'outline-2 outline-offset-1 outline-border-strong outline-dashed',
  ANSWERED: 'outline-2 outline-offset-1 outline-solid outline-status-success',
};
