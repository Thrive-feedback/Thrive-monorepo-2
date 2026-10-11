import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** One Member may be asked per request in this release; #30 raises the limit. */
const MAX_GIVERS = 1;

/**
 * Only the shape is checked here. Trimming, the length limit and "not blank" belong to the
 * Topic, and "not yourself" and "not twice" to the Feedback Request, each with its own code.
 */
export const sendFeedbackRequestRequestSchema = z.strictObject({
  /** What the Feedback is about. Up to 200 characters once spaces are collapsed. */
  topic: z.string(),
  /** The Accounts of the Members being asked. Each must be a Member of this Workspace. */
  giverAccountIds: z.array(z.uuid()).min(1).max(MAX_GIVERS),
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
