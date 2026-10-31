import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { FEEDBACK_ORIGINS } from '../../domain/entity/feedback.entity';
import { answerSchema } from './get-feedback-request.dto';
import { personSchema } from './person.dto';
import { answerPostcardSchema, postcardSchema } from './postcard.dto';
import { tagsSchema } from './tags.dto';

/** One answer on a request's card. */
const openedAnswerSchema = answerSchema.extend({
  id: z.uuid(),
  giver: personSchema,
  /** What it decided about how it looks, or `null` when it was not written on the card. */
  postcard: answerPostcardSchema.nullable(),
});

/** The card an answer is on, with every answer the caller may read, in the order they were asked. */
const openedRequestSchema = z.object({
  /** The Request message. */
  message: z.string(),
  /** What the Request message was bound to when it was sent. */
  tags: tagsSchema,
  requester: personSchema,
  /** How the card looks, or `null` when the request was not written on a postcard. */
  postcard: postcardSchema.nullable(),
  answers: z.array(openedAnswerSchema).min(1),
});

/** A Member a piece of Feedback names, with the name they introduced themselves by. */

/**
 * One piece of Feedback, the same for every reader its Visibility lets in. The Giver and the Receiver are
 * grouped with their names, because a nullable string on a response root generates as an array
 * (`docs/design/0016` §10), and because a reader who is neither needs to know whom it is about.
 */
export const getFeedbackResponseSchema = z.object({
  /** Who is reading, so a reader can tell themselves among the people a piece names. */
  readerAccountId: z.uuid(),
  id: z.uuid(),
  /** `REQUESTED` answered an Ask; `OFFERED` was given without being asked. */
  origin: z.enum(FEEDBACK_ORIGINS),
  /** The request this answers, or `null` for Feedback given without being asked. */
  feedbackRequestId: z.uuid().nullable(),
  giver: personSchema,
  /** Everyone it is for, in the order the Giver chose them: one for Requested Feedback. */
  receivers: z.array(personSchema).min(1),
  /** The Feedback message. */
  message: z.string(),
  /** How it looks, or `null` when it was not written on a postcard, or is an answer. */
  postcard: postcardSchema.nullable(),
  /** What its Giver wrote was bound to when it was sent. */
  tags: tagsSchema,
  createdAt: z.iso.datetime({ offset: true }),
  /** The card an answer is on, or `null` for Feedback given without being asked. */
  request: openedRequestSchema.nullable(),
});
export class GetFeedbackResponseDto extends createZodDto(
  getFeedbackResponseSchema,
) {}
