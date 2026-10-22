import {
  pageQueryShape,
  pageResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PERSON_STATUSES } from '../../application/types/feedback-request.types';
import { FEEDBACK_ORIGINS } from '../../domain/entity/feedback.entity';
import { tagsSchema } from './tags.dto';

export const listGivenFeedbackQuerySchema = z.strictObject(pageQueryShape);
export class ListGivenFeedbackQueryDto extends createZodDto(
  listGivenFeedbackQuerySchema,
) {}

const personSchema = z.object({
  accountId: z.uuid(),
  /** `null` while they have not introduced themselves. */
  name: z.string().nullable(),
  /** `DEACTIVATED` once they were Deactivated in this Workspace; their Feedback stays. */
  status: z.enum(PERSON_STATUSES),
});

/**
 * One piece of Feedback the caller gave. Both people are nested objects, as on the routes that
 * open one piece and list what was shared: a nullable name must sit below the response root,
 * because `@nestjs/swagger` reads nestjs-zod's `type: ['string', 'null']` as "array of"
 * (`docs/design/0016` §10).
 */
const givenFeedbackSchema = z.object({
  id: z.uuid(),
  /** `REQUESTED` answered an Ask; `OFFERED` was given without being asked. */
  origin: z.enum(FEEDBACK_ORIGINS),
  /** The request it answers, or `null` for Feedback given without being asked. */
  feedbackRequestId: z.uuid().nullable(),
  topic: z.string(),
  /** What the Topic was bound to when it was sent; highlight these and nothing else. */
  topicTags: tagsSchema,
  giver: personSchema,
  receiver: personSchema,
  body: z.string(),
  /** What its Giver wrote was bound to when it was sent. */
  tags: tagsSchema,
  createdAt: z.iso.datetime({ offset: true }),
});

export const listGivenFeedbackResponseSchema = z.object({
  /** What the caller wrote, newest first. Whose it is is never a query parameter. */
  items: z.array(givenFeedbackSchema),
  ...pageResultShape,
});
export class ListGivenFeedbackResponseDto extends createZodDto(
  listGivenFeedbackResponseSchema,
) {}
