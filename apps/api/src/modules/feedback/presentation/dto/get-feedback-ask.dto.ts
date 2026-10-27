import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PERSON_STATUSES } from '../../application/types/feedback-request.types';
import { ASK_STATUSES } from '../../domain/value-object/ask-status.vo';
import { tagsSchema } from './tags.dto';

/**
 * The Member who asked, as the Giver sees them. Their name is held beside their id rather
 * than flattened onto the Ask: a nullable string directly on a response root is turned into
 * an array of strings by the OpenAPI generator (nestjs-zod 5.5 hands `type: ['string',
 * 'null']` to `@nestjs/swagger`, which reads an array `type` as "array of"). Nested, it is
 * generated correctly — and the Requester's id and name belong together anyway.
 */
const requesterSchema = z.object({
  accountId: z.uuid(),
  /** `null` while the Requester has not introduced themselves. */
  name: z.string().nullable(),
  /** Their Google photo, or `null` when they have none. */
  photoUrl: z.url().nullable(),
  /** `DEACTIVATED` once they were Deactivated in this Workspace; their Feedback stays. */
  status: z.enum(PERSON_STATUSES),
});

/** One Ask as the Member asked reads it. The waiting list sends the same shape. */
export const feedbackAskSchema = z.object({
  askId: z.uuid(),
  feedbackRequestId: z.uuid(),
  /** The Request message. */
  message: z.string(),
  /** What the Request message was bound to when it was sent; highlight these and nothing else. */
  tags: tagsSchema,
  requester: requesterSchema,
  status: z.enum(ASK_STATUSES),
  createdAt: z.iso.datetime({ offset: true }),
});

export const getFeedbackAskResponseSchema = feedbackAskSchema;
export class GetFeedbackAskResponseDto extends createZodDto(
  getFeedbackAskResponseSchema,
) {}
