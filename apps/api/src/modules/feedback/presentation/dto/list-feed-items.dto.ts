import {
  cursorQueryShape,
  cursorResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  FEED_ITEM_SHOWS,
  FEED_ITEM_VISIBILITIES,
} from '../../application/types/feedback-request.types';
import { FEEDBACK_ORIGINS } from '../../domain/entity/feedback.entity';
import { ASK_STATUSES } from '../../domain/value-object/ask-status.vo';
import { answerSchema } from './get-feedback-request.dto';
import { personSchema } from './person.dto';
import { tagsSchema } from './tags.dto';

export const listFeedItemsQuerySchema = z.strictObject({
  /** Which of what the caller reads on Home: everything unless it says otherwise. */
  show: z.enum(FEED_ITEM_SHOWS).default('ALL'),
  ...cursorQueryShape,
});
export class ListFeedItemsQueryDto extends createZodDto(
  listFeedItemsQuerySchema,
) {}

const feedItemAskSchema = z.object({
  person: personSchema,
  status: z.enum(ASK_STATUSES),
  /** What they wrote, or `null` while the Ask is waiting. */
  answer: answerSchema.nullable(),
});

/** What an answer responds to. Whoever may read the answer reads the others asked too. */
const feedItemRequestSchema = z.object({
  /** The Request message. */
  message: z.string(),
  /** What the Request message was bound to when it was sent. */
  tags: tagsSchema,
  requester: personSchema,
  /** Everyone asked, in the order they were asked, the Giver of this answer among them. */
  asked: z.array(feedItemAskSchema).min(1),
});

/**
 * One piece of Feedback on Home. People are nested objects, as on the feed: a nullable name must
 * sit below the response root (`docs/design/0016` §10).
 */
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
  /** Who can read it. Only me is never on Home. */
  visibility: z.enum(FEED_ITEM_VISIBILITIES),
  /** The request an answer responds to, or `null` for Feedback given without being asked. */
  request: feedItemRequestSchema.nullable(),
});

export const listFeedItemsResponseSchema = z.object({
  /** Whose Home this is, so a reader can tell themselves among the people a piece names. */
  readerAccountId: z.uuid(),
  /** Newest first. */
  items: z.array(feedItemSchema),
  ...cursorResultShape,
});
export class ListFeedItemsResponseDto extends createZodDto(
  listFeedItemsResponseSchema,
) {}
