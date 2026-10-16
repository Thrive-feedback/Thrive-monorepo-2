import {
  pageQueryShape,
  pageResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { FEEDBACK_ORIGINS } from '../../domain/entity/feedback.entity';

export const listSharedFeedbackQuerySchema = z.strictObject(pageQueryShape);
export class ListSharedFeedbackQueryDto extends createZodDto(
  listSharedFeedbackQuerySchema,
) {}

const personSchema = z.object({
  accountId: z.uuid(),
  /** `null` while they have not introduced themselves. */
  name: z.string().nullable(),
});

/**
 * One piece of Feedback shared with the caller. Both people are nested objects, as on the route
 * that opens one piece: a nullable name must sit below the response root, because
 * `@nestjs/swagger` reads nestjs-zod's `type: ['string', 'null']` as "array of"
 * (`docs/design/0016` §10).
 */
const sharedFeedbackSchema = z.object({
  id: z.uuid(),
  /** `REQUESTED` answered an Ask; `OFFERED` was given without being asked. */
  origin: z.enum(FEEDBACK_ORIGINS),
  /** The request it answers, or `null` for Feedback given without being asked. */
  feedbackRequestId: z.uuid().nullable(),
  topic: z.string(),
  giver: personSchema,
  receiver: personSchema,
  body: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
});

export const listSharedFeedbackResponseSchema = z.object({
  /** What the caller was selected to read, newest first. Who they are is never a parameter. */
  items: z.array(sharedFeedbackSchema),
  ...pageResultShape,
});
export class ListSharedFeedbackResponseDto extends createZodDto(
  listSharedFeedbackResponseSchema,
) {}
