import { z } from 'zod';

/** The Invitation's id, as the email's Accept link carries it. Anything else is no Invitation. */
export const InvitationParams = z.object({
  invitationId: z.uuid(),
});
