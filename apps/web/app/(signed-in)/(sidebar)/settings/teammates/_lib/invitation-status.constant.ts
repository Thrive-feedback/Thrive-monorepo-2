import type { OpenInvitation } from '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/open-invitation.type';
import type { StatusTone } from '@/components/atoms/status-text';
import { ASK_STATUS_TONES } from '@/lib/feedback/ask-status.constant';

type InvitationStatus = OpenInvitation['status'];

export const INVITATION_STATUS_NAMES: Readonly<
  Record<InvitationStatus, string>
> = {
  PENDING: 'Pending',
  EXPIRED: 'Expired',
};

/**
 * Each status in the colour of where it stands, said as a word in the line as an Ask's standing is:
 * still waiting in the yellow of a Pending Ask, lapsed in red. The word carries the same meaning, so
 * nothing depends on seeing the colour.
 */
export const INVITATION_STATUS_TONES: Readonly<
  Record<InvitationStatus, StatusTone>
> = {
  PENDING: ASK_STATUS_TONES.PENDING,
  EXPIRED: 'error',
};

/** An expired Invitation says when it lapsed; a Pending one, when it will. */
export const INVITATION_EXPIRY_LABELS: Readonly<
  Record<InvitationStatus, string>
> = {
  PENDING: 'Expires',
  EXPIRED: 'Expired',
};
