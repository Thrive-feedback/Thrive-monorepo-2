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

export const getFeedbackRequestResponseSchema = z.object({
  id: z.uuid(),
  topic: z.string(),
  visibility: z.enum(VISIBILITIES),
  /** One per Member asked, oldest first. */
  asks: z.array(askSchema),
  createdAt: z.iso.datetime({ offset: true }),
});
export class GetFeedbackRequestResponseDto extends createZodDto(
  getFeedbackRequestResponseSchema,
) {}
