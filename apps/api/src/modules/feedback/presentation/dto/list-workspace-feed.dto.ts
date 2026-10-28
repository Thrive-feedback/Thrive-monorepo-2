import {
  pageQueryShape,
  pageResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { FEEDBACK_ORIGINS } from '../../domain/entity/feedback.entity';
import { personSchema } from './person.dto';
import { tagsSchema } from './tags.dto';

export const listWorkspaceFeedQuerySchema = z.strictObject(pageQueryShape);
export class ListWorkspaceFeedQueryDto extends createZodDto(
  listWorkspaceFeedQuerySchema,
) {}

/**
 * One piece of Feedback on the feed. Both people are nested objects, as on the routes that open
 * one piece and list what was shared: a nullable name must sit below the response root, because
 * `@nestjs/swagger` reads nestjs-zod's `type: ['string', 'null']` as "array of"
 * (`docs/design/0016` §10).
 */
const answeredRequestSchema = z.object({
  /** The Request message. */
  message: z.string(),
  /** What the Request message was bound to when it was sent. */
  tags: tagsSchema,
  requester: personSchema,
  /** Everyone the request asked, in the order they were asked, whatever became of their Ask. */
  asked: z.array(personSchema).min(1),
});

const feedItemSchema = z.object({
  id: z.uuid(),
  /** `REQUESTED` answered an Ask; `OFFERED` was given without being asked. */
  origin: z.enum(FEEDBACK_ORIGINS),
  /** The request it answers, or `null` for Feedback given without being asked. */
  feedbackRequestId: z.uuid().nullable(),
  giver: personSchema,
  /** Everyone it is for, in the order the Giver chose them: one for Requested Feedback. */
  receivers: z.array(personSchema).min(1),
  /** The Feedback message. */
  message: z.string(),
  /** What its Giver wrote was bound to when it was sent. */
  tags: tagsSchema,
  createdAt: z.iso.datetime({ offset: true }),
  /** The request an answer responds to, or `null` for Feedback given without being asked. */
  request: answeredRequestSchema.nullable(),
});

export const listWorkspaceFeedResponseSchema = z.object({
  /** Everything set to Everyone in this Workspace, newest first. */
  items: z.array(feedItemSchema),
  ...pageResultShape,
});
export class ListWorkspaceFeedResponseDto extends createZodDto(
  listWorkspaceFeedResponseSchema,
) {}
