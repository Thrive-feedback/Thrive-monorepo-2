import {
  pageQueryShape,
  pageResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { feedbackRequestSchema } from './get-feedback-request.dto';

export const listSentFeedbackRequestsQuerySchema =
  z.strictObject(pageQueryShape);
export class ListSentFeedbackRequestsQueryDto extends createZodDto(
  listSentFeedbackRequestsQuerySchema,
) {}

export const listSentFeedbackRequestsResponseSchema = z.object({
  /** The caller's own requests, newest first. Whose they are is never a query parameter. */
  items: z.array(feedbackRequestSchema),
  ...pageResultShape,
});
export class ListSentFeedbackRequestsResponseDto extends createZodDto(
  listSentFeedbackRequestsResponseSchema,
) {}
