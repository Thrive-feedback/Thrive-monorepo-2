import { z } from 'zod';

/**
 * `signedIn=1` is added by the API to the address Google sends someone accepting an Invitation
 * back to, so the page can say once that they are signed in. Any other value is ignored.
 */
export const InvitationSearchParams = z.object({
  signedIn: z.literal('1').optional().catch(undefined),
});
