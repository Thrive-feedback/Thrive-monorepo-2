import {
  pageQueryShape,
  pageResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PERSON_STATUSES } from '../../application/types/feedback-request.types';
import { FEEDBACK_ORIGINS } from '../../domain/entity/feedback.entity';

export const listWorkspaceFeedQuerySchema = z.strictObject(pageQueryShape);
export class ListWorkspaceFeedQueryDto extends createZodDto(
  listWorkspaceFeedQuerySchema,
) {}

const personSchema = z.object({
  accountId: z.uuid(),
  /** `null` while they have not introduced themselves. */
  name: z.string().nullable(),
  /** `DEACTIVATED` once they were Deactivated in this Workspace; their Feedback stays. */
  status: z.enum(PERSON_STATUSES),
});

/**
 * One piece of Feedback on the feed. Both people are nested objects, as on the routes that open
 * one piece and list what was shared: a nullable name must sit below the response root, because
 * `@nestjs/swagger` reads nestjs-zod's `type: ['string', 'null']` as "array of"
 * (`docs/design/0016` §10).
 */
const feedItemSchema = z.object({
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

export const listWorkspaceFeedResponseSchema = z.object({
  /** Everything set to Everyone in this Workspace, newest first. */
  items: z.array(feedItemSchema),
  ...pageResultShape,
});
export class ListWorkspaceFeedResponseDto extends createZodDto(
  listWorkspaceFeedResponseSchema,
) {}
