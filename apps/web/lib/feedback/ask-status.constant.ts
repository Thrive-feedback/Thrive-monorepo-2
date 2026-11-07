import type { components } from '@repo/api';
import type { StatusTone } from '@/components/atoms/status-text';

/** Where one Ask stands, as the API names it. */
export type AskStatus =
  components['schemas']['ListMyFeedbackAsksResponseDto_Output']['items'][number]['status'];

export const ASK_STATUS_NAMES: Readonly<Record<AskStatus, string>> = {
  PENDING: 'Pending',
  ANSWERED: 'Answered',
};

/**
 * Each status as the tone of its word, or of its Badge where one is still drawn: waiting or done,
 * the tones Teammates gives an Invitation too. The word carries the same meaning, so nothing
 * depends on seeing the colour.
 */
export const ASK_STATUS_TONES: Readonly<Record<AskStatus, StatusTone>> = {
  PENDING: 'warning',
  ANSWERED: 'success',
};

/**
 * Each status as a ring just inside the edge of the face of somebody asked, in the colours its Badge
 * has: solid green once they answered, solid yellow while Pending. Inside, so a stack of ringed faces
 * overlaps as any stack does without the next face covering the ring. The word says the same beside
 * it, so nothing depends on seeing the ring.
 */
export const ASK_STATUS_RINGS: Readonly<Record<AskStatus, string>> = {
  PENDING: 'outline-2 -outline-offset-2 outline-solid outline-status-warning',
  ANSWERED: 'outline-2 -outline-offset-2 outline-solid outline-status-success',
};
