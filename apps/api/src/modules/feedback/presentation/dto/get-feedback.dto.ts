import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PERSON_STATUSES } from '../../application/types/feedback-request.types';
import { FEEDBACK_ORIGINS } from '../../domain/entity/feedback.entity';

/** A Member a piece of Feedback names, with the name they introduced themselves by. */
const personSchema = z.object({
  accountId: z.uuid(),
  /** `null` while that Member has not introduced themselves. */
  name: z.string().nullable(),
  /** `DEACTIVATED` once they were Deactivated in this Workspace; their Feedback stays. */
  status: z.enum(PERSON_STATUSES),
});

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
  topic: z.string(),
  giver: personSchema,
  receiver: personSchema,
  body: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
});
export class GetFeedbackResponseDto extends createZodDto(
  getFeedbackResponseSchema,
) {}
