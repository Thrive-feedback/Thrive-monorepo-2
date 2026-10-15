import {
  pageQueryShape,
  pageResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { FEEDBACK_ORIGINS } from '../../domain/entity/feedback.entity';

export const listReceivedFeedbackQuerySchema = z.strictObject(pageQueryShape);
export class ListReceivedFeedbackQueryDto extends createZodDto(
  listReceivedFeedbackQuerySchema,
) {}

/**
 * One piece of Feedback on the wire. `giverName` is nullable and sits inside `items`, one
 * level down: a nullable primitive on a response root is generated as an array of that type,
 * because `@nestjs/swagger` reads nestjs-zod's `type: ['string', 'null']` as "array of"
 * (`docs/design/0016` §10). Nested, it generates correctly.
 */
const receivedFeedbackSchema = z.object({
  id: z.uuid(),
  /** `REQUESTED` answered one of the caller's Asks; `OFFERED` was given without being asked. */
  origin: z.enum(FEEDBACK_ORIGINS),
  /** The request this answers, or `null` for Feedback given without being asked. */
  feedbackRequestId: z.uuid().nullable(),
  topic: z.string(),
  giverAccountId: z.uuid(),
  /** `null` while the Giver has not introduced themselves. */
  giverName: z.string().nullable(),
  body: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
});

export const listReceivedFeedbackResponseSchema = z.object({
  /** What was written to the caller, newest first. Whose it is is never a query parameter. */
  items: z.array(receivedFeedbackSchema),
  ...pageResultShape,
});
export class ListReceivedFeedbackResponseDto extends createZodDto(
  listReceivedFeedbackResponseSchema,
) {}
