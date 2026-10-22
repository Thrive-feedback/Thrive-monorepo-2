import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { VISIBILITIES } from '../../domain/value-object/visibility.vo';

/** As for a Feedback Request: more than a Workspace Thrive is sold to holds. */
const MAX_SELECTED_PEOPLE = 50;

/**
 * Only the shape is checked here. Trimming, the length limit and "not blank" belong to the
 * Feedback message; "not yourself" and who may be selected to the Feedback; and which Visibility takes
 * selected people to the Visibility — each with its own code.
 */
export const offerFeedbackRequestSchema = z.strictObject({
  /** The Account of the Member it is for. Must be a Member of this Workspace. */
  receiverAccountId: z.uuid(),
  /** The Feedback message: what the Giver wrote. Up to 4,000 characters once trimmed. */
  message: z.string(),
  /**
   * Who besides the Giver and the Receiver may read it. Fixed once sent. `ONLY_ME` is the
   * audience the Giver is shown as "Only them": nobody besides the two of them.
   */
  visibility: z.enum(VISIBILITIES),
  /** The Members who may read it. Only with `SELECTED_PEOPLE`, and then at least one. */
  selectedAccountIds: z.array(z.uuid()).max(MAX_SELECTED_PEOPLE).optional(),
});
export class OfferFeedbackRequestDto extends createZodDto(
  offerFeedbackRequestSchema,
) {}

export const offerFeedbackResponseSchema = z.object({
  id: z.uuid(),
});
export class OfferFeedbackResponseDto extends createZodDto(
  offerFeedbackResponseSchema,
) {}
