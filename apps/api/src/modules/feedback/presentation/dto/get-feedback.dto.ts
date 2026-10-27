import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { FEEDBACK_ORIGINS } from '../../domain/entity/feedback.entity';
import { personSchema } from './person.dto';
import { tagsSchema } from './tags.dto';

/** A Member a piece of Feedback names, with the name they introduced themselves by. */

/**
 * One piece of Feedback, the same for every reader its Visibility lets in. The Giver and the Receiver are
 * grouped with their names, because a nullable string on a response root generates as an array
 * (`docs/design/0016` §10), and because a reader who is neither needs to know whom it is about.
 */
export const getFeedbackResponseSchema = z.object({
  id: z.uuid(),
  /** `REQUESTED` answered an Ask; `OFFERED` was given without being asked. */
  origin: z.enum(FEEDBACK_ORIGINS),
  /** The request this answers, or `null` for Feedback given without being asked. */
  feedbackRequestId: z.uuid().nullable(),
  giver: personSchema,
  /** Deprecated: the first of `receivers`, kept for clients built before Feedback could have several. */
  receiver: personSchema,
  /** Everyone it is for, in the order the Giver chose them: one for Requested Feedback. */
  receivers: z.array(personSchema).min(1),
  /** The Feedback message. */
  message: z.string(),
  /** What its Giver wrote was bound to when it was sent. */
  tags: tagsSchema,
  createdAt: z.iso.datetime({ offset: true }),
});
export class GetFeedbackResponseDto extends createZodDto(
  getFeedbackResponseSchema,
) {}
