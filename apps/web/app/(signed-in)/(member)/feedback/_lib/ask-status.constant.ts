import type { components } from '@repo/api';

/** Where one Ask stands, as the API names it. */
export type AskStatus =
  components['schemas']['ListMyFeedbackAsksResponseDto_Output']['items'][number]['status'];

export const ASK_STATUS_NAMES: Readonly<Record<AskStatus, string>> = {
  PENDING: 'Pending',
  ANSWERED: 'Answered',
  EXPIRED: 'Expired',
};

/**
 * Each status in the colour of where it stands: waiting, done, or lapsed — the roles
 * Members gives an Invitation, too. The status colour itself, not its `-fg` role, which is
 * near-black text meant for a status surface. The word carries the same meaning, so nothing
 * depends on seeing the colour.
 */
export const ASK_STATUS_COLOURS: Readonly<Record<AskStatus, string>> = {
  PENDING: 'text-status-warning',
  ANSWERED: 'text-status-success',
  EXPIRED: 'text-status-error',
};
