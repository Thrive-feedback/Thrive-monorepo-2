import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Only the shape is checked here. How many people one send may invite, and which addresses
 * are the same person, belong to the invited addresses, which answer with their own error codes.
 */
export const sendInvitationsRequestSchema = z.strictObject({
  /** One address per person, each sent its own Invitation. Up to 10 people per send. */
  emails: z.array(z.string().trim().pipe(z.email())),
});
export class SendInvitationsRequestDto extends createZodDto(
  sendInvitationsRequestSchema,
) {}

const invitationResultSchema = z.discriminatedUnion('outcome', [
  z.object({
    email: z.string(),
    /** The Invitation was stored and its email sent. */
    outcome: z.literal('invited'),
    invitationId: z.uuid(),
    expiresAt: z.iso.datetime({ offset: true }),
  }),
  z.object({
    email: z.string(),
    /**
     * `already_member`: the address is already in this Workspace. `already_invited`: it already
     * has a Pending Invitation. `failed`: its email could not be sent, so nothing was kept;
     * sending again tries afresh.
     */
    outcome: z.enum(['already_member', 'already_invited', 'failed']),
  }),
]);

export const sendInvitationsResponseSchema = z.object({
  /** One per distinct address, in the order they were sent, lowercased. */
  results: z.array(invitationResultSchema),
});
export class SendInvitationsResponseDto extends createZodDto(
  sendInvitationsResponseSchema,
) {}
