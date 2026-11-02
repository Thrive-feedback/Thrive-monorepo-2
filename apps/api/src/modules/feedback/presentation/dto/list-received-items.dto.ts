import {
  cursorQueryShape,
  cursorResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { VISIBILITIES } from '../../domain/value-object/visibility.vo';
import {
  feedItemRequestSchema,
  feedItemSchema,
  kudosFeedItemSchema,
} from './list-feed-items.dto';
import { answerPostcardSchema, postcardSchema } from './postcard.dto';

export const listReceivedItemsQuerySchema = z.strictObject(cursorQueryShape);
export class ListReceivedItemsQueryDto extends createZodDto(
  listReceivedItemsQuerySchema,
) {}

/** The request an answer was written on, as on Home, and the rest of the card it sits on. */
const receivedRequestSchema = feedItemRequestSchema.extend({
  /** How the card looks, or `null` when the request was not written on a postcard. */
  postcard: postcardSchema.nullable(),
  /** How the answer's own words look, or `null` when it was not written on the postcard. */
  answerPostcard: answerPostcardSchema.nullable(),
});

/** One piece of Feedback, as on Home, at any Visibility, with the card it was written on. */
const receivedFeedbackSchema = feedItemSchema.extend({
  /** Who else may read it. Only me is here: the caller is one of those it is between. */
  visibility: z.enum(VISIBILITIES),
  /** How it looks, or `null` when it was not written on a postcard, or is an answer. */
  postcard: postcardSchema.nullable(),
  /** The card an answer is on, or `null` for Feedback given without being asked. */
  request: receivedRequestSchema.nullable(),
});

/** One thing in a Member's own list, Received or Given. */
export const personalItemSchema = z.discriminatedUnion('kind', [
  receivedFeedbackSchema,
  kudosFeedItemSchema,
]);

export const listReceivedItemsResponseSchema = z.object({
  /** Whose list this is, so a reader can tell themselves among the people a piece names. */
  readerAccountId: z.uuid(),
  /** What was written to the caller, newest first. Whose it is is never a query parameter. */
  items: z.array(personalItemSchema),
  ...cursorResultShape,
});
export class ListReceivedItemsResponseDto extends createZodDto(
  listReceivedItemsResponseSchema,
) {}
