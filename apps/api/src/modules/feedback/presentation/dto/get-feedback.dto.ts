import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** A Member a piece of Feedback names, with the name they introduced themselves by. */
const personSchema = z.object({
  accountId: z.uuid(),
  /** `null` while that Member has not introduced themselves. */
  name: z.string().nullable(),
});

/**
 * One piece of Feedback, the same for every reader its Visibility lets in. The Giver and the Receiver are
 * grouped with their names, because a nullable string on a response root generates as an array
 * (`docs/design/0016` §10), and because a reader who is neither needs to know whom it is about.
 */
export const getFeedbackResponseSchema = z.object({
  id: z.uuid(),
  /** The request this answers. Becomes nullable when #29 lands Feedback given unasked. */
  feedbackRequestId: z.uuid(),
  topic: z.string(),
  giver: personSchema,
  receiver: personSchema,
  body: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
});
export class GetFeedbackResponseDto extends createZodDto(
  getFeedbackResponseSchema,
) {}
