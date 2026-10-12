import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ASK_STATUSES } from '../../domain/value-object/ask-status.vo';
import { VISIBILITIES } from '../../domain/value-object/visibility.vo';

const askSchema = z.object({
  askId: z.uuid(),
  giverAccountId: z.uuid(),
  /** `null` while that Member has not introduced themselves. */
  giverName: z.string().nullable(),
  status: z.enum(ASK_STATUSES),
});

/** One Feedback Request on the wire. The list of them sends the same shape, so it is one. */
export const feedbackRequestSchema = z.object({
  id: z.uuid(),
  topic: z.string(),
  visibility: z.enum(VISIBILITIES),
  /** One per Member asked, oldest first. */
  asks: z.array(askSchema),
  createdAt: z.iso.datetime({ offset: true }),
});

export const getFeedbackRequestResponseSchema = feedbackRequestSchema;
export class GetFeedbackRequestResponseDto extends createZodDto(
  getFeedbackRequestResponseSchema,
) {}
