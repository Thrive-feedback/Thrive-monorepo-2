import {
  pageQueryShape,
  pageResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PERSON_STATUSES } from '../../application/types/feedback-request.types';
import { FEEDBACK_ORIGINS } from '../../domain/entity/feedback.entity';
import { answeredRequestSchema } from './answered-request.dto';
import { personSchema } from './person.dto';
import { tagsSchema } from './tags.dto';

export const listReceivedFeedbackQuerySchema = z.strictObject(pageQueryShape);
export class ListReceivedFeedbackQueryDto extends createZodDto(
  listReceivedFeedbackQuerySchema,
) {}

/**
 * One piece of Feedback on the wire. `giverName` is nullable and sits inside `items`, one
 * level down: a nullable primitive on a response root is generated as an array of that type,
 * because `@nestjs/swagger` reads nestjs-zod's `type: ['string', 'null']` as "array of"
 * (`docs/design/0016` §10). Nested, it generates correctly.
 */
const receivedFeedbackSchema = z.object({
  id: z.uuid(),
  /** `REQUESTED` answered one of the caller's Asks; `OFFERED` was given without being asked. */
  origin: z.enum(FEEDBACK_ORIGINS),
  /** The request this answers, or `null` for Feedback given without being asked. */
  feedbackRequestId: z.uuid().nullable(),
  giverAccountId: z.uuid(),
  /** `null` while the Giver has not introduced themselves. */
  giverName: z.string().nullable(),
  /** The Giver's Google photo, or `null` when they have none. */
  giverPhotoUrl: z.url().nullable(),
  /** `DEACTIVATED` once the Giver was Deactivated in this Workspace; their Feedback stays. */
  giverStatus: z.enum(PERSON_STATUSES),
  /**
   * Everyone else it was written to, in the order the Giver chose them — empty when it was for
   * the caller alone (brain `ADR-0044`).
   */
  otherReceivers: z.array(personSchema),
  /** The Feedback message. */
  message: z.string(),
  /** What its Giver wrote was bound to when it was sent. */
  tags: tagsSchema,
  createdAt: z.iso.datetime({ offset: true }),
  /**
   * The caller's own request an answer responds to, with everyone it asked, or `null` for
   * Feedback given without being asked.
   */
  request: answeredRequestSchema.nullable(),
});

export const listReceivedFeedbackResponseSchema = z.object({
  /** What was written to the caller, newest first. Whose it is is never a query parameter. */
  items: z.array(receivedFeedbackSchema),
  ...pageResultShape,
});
export class ListReceivedFeedbackResponseDto extends createZodDto(
  listReceivedFeedbackResponseSchema,
) {}
