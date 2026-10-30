import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { VISIBILITIES } from '../../domain/value-object/visibility.vo';
import { postcardSchema } from './postcard.dto';

/**
 * More than a Workspace Thrive is sold to holds (20–50 people), so a real choice always fits
 * and a body cannot ask for thousands of membership checks. Everyone is the choice for more.
 */
const MAX_SELECTED_PEOPLE = 50;

/**
 * Only the shape is checked here. Trimming, the length limit and "not blank" belong to the
 * Request message; "not yourself" and "not twice" to the Feedback Request; and which Visibility takes
 * selected people, and how many, to the Visibility — each with its own code.
 */
export const sendFeedbackRequestRequestSchema = z.strictObject({
  /** The Request message the people asked read. Up to 1,000 characters once trimmed. */
  message: z.string(),
  /**
   * The Accounts of the Members being asked, one Ask each. Each must be a Member of this
   * Workspace. There is deliberately no upper bound: a Requester may ask as many teammates as
   * they choose (#30).
   */
  giverAccountIds: z.array(z.uuid()).min(1),
  /** Who besides the Requester and the Members asked may read the answers. Fixed once sent. */
  visibility: z.enum(VISIBILITIES),
  /** The Members who may read the answers. Only with `SELECTED_PEOPLE`, and then at least one. */
  selectedAccountIds: z.array(z.uuid()).max(MAX_SELECTED_PEOPLE).optional(),
  /** How it looks, when it was written on a postcard. */
  postcard: postcardSchema.optional(),
});
export class SendFeedbackRequestRequestDto extends createZodDto(
  sendFeedbackRequestRequestSchema,
) {}

export const sendFeedbackRequestResponseSchema = z.object({
  id: z.uuid(),
});
export class SendFeedbackRequestResponseDto extends createZodDto(
  sendFeedbackRequestResponseSchema,
) {}
