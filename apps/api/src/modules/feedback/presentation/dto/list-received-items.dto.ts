import {
  cursorResultShape,
  positionCursorQueryShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { RECEIVED_ITEM_SHOWS } from '../../application/types/personal-item.types';
import { ASK_STATUSES } from '../../domain/value-object/ask-status.vo';
import { VISIBILITIES } from '../../domain/value-object/visibility.vo';
import { answerSchema } from './get-feedback-request.dto';
import {
  feedItemRequestSchema,
  feedItemSchema,
  kudosFeedItemSchema,
} from './list-feed-items.dto';
import { personSchema } from './person.dto';
import { answerPostcardSchema, postcardSchema } from './postcard.dto';
import { tagsSchema } from './tags.dto';

export const listReceivedItemsQuerySchema = z.strictObject({
  /**
   * Which kind of thing to list: everything unless it says otherwise. `OFFERED` is Feedback given
   * without being asked; an answer is inside its request, under `REQUESTS`.
   */
  show: z.enum(RECEIVED_ITEM_SHOWS).default('ALL'),
  ...positionCursorQueryShape,
});
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

/** What one Ask of the caller's request sent back, on the postcard its Giver answered on. */
const sentRequestAnswerSchema = answerSchema.extend({
  /** The Feedback it is, which opens its postcard. */
  id: z.uuid(),
  /** How its words look, or `null` when it was not written on the postcard. */
  postcard: answerPostcardSchema.nullable(),
});

const sentRequestAskSchema = z.object({
  person: personSchema,
  status: z.enum(ASK_STATUSES),
  /** What they sent back, or `null` while the Ask is waiting. */
  answer: sentRequestAnswerSchema.nullable(),
});

/** A request the caller sent, with everyone it asked and every answer, which are nowhere else here. */
const sentRequestItemSchema = z.object({
  kind: z.literal('REQUEST'),
  id: z.uuid(),
  /** The Request message. */
  message: z.string(),
  /** What the Request message was bound to when it was sent. */
  tags: tagsSchema,
  visibility: z.enum(VISIBILITIES),
  /** The caller, who sent it: the card is signed by them. */
  requester: personSchema,
  /** Who it was shared with under Selected people, and nobody otherwise. */
  selectedPeople: z.array(personSchema),
  /** How the card looks, or `null` when the request was not written on a postcard. */
  postcard: postcardSchema.nullable(),
  /** When it was sent. */
  createdAt: z.iso.datetime({ offset: true }),
  /** Its newest answer, or when it was sent while nobody has answered: where it sits in the list. */
  latestActivityAt: z.iso.datetime({ offset: true }),
  /** Everyone asked, in the order they were asked. */
  asked: z.array(sentRequestAskSchema).min(1),
});

/** One thing in the caller's Received: what Given holds, and the requests they sent. */
const receivedItemSchema = z.discriminatedUnion('kind', [
  receivedFeedbackSchema,
  kudosFeedItemSchema,
  sentRequestItemSchema,
]);

export const listReceivedItemsResponseSchema = z.object({
  /** Whose list this is, so a reader can tell themselves among the people a piece names. */
  readerAccountId: z.uuid(),
  /**
   * What came back to the caller, newest first, a request at its latest activity. Whose it is is
   * never a query parameter. A request can move up between two pages, and is then not repeated on
   * the next one; a client still keeps one copy of each id it holds.
   */
  items: z.array(receivedItemSchema),
  ...cursorResultShape,
});
export class ListReceivedItemsResponseDto extends createZodDto(
  listReceivedItemsResponseSchema,
) {}
