import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Only the shape is checked here. Trimming, "not blank" and the length limit belong to the
 * answer itself, each with its own code — one free-text answer, no Questions and no ratings
 * (`ADR-0022`).
 */
export const answerFeedbackAskRequestSchema = z.strictObject({
  /** The Feedback message. Up to 4,000 characters once trimmed. */
  message: z.string(),
});
export class AnswerFeedbackAskRequestDto extends createZodDto(
  answerFeedbackAskRequestSchema,
) {}

export const answerFeedbackAskResponseSchema = z.object({
  feedbackId: z.uuid(),
});
export class AnswerFeedbackAskResponseDto extends createZodDto(
  answerFeedbackAskResponseSchema,
) {}
