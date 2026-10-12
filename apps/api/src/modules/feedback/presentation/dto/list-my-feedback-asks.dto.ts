import {
  pageQueryShape,
  pageResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ASK_STATUSES } from '../../domain/value-object/ask-status.vo';
import { feedbackAskSchema } from './get-feedback-ask.dto';

export const listMyFeedbackAsksQuerySchema = z.strictObject({
  ...pageQueryShape,
  /**
   * Which state to list. The waiting list is the Pending ones, which is why they are the
   * default; the other two are #27 and #39 and need no second route.
   */
  status: z.enum(ASK_STATUSES).default('PENDING'),
});
export class ListMyFeedbackAsksQueryDto extends createZodDto(
  listMyFeedbackAsksQuerySchema,
) {}

export const listMyFeedbackAsksResponseSchema = z.object({
  /** The caller's own Asks, newest first. Whose they are is never a query parameter. */
  items: z.array(feedbackAskSchema),
  ...pageResultShape,
});
export class ListMyFeedbackAsksResponseDto extends createZodDto(
  listMyFeedbackAsksResponseSchema,
) {}
