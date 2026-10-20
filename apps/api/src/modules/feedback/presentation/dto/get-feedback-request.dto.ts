import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PERSON_STATUSES } from '../../application/types/feedback-request.types';
import { ASK_STATUSES } from '../../domain/value-object/ask-status.vo';
import { VISIBILITIES } from '../../domain/value-object/visibility.vo';
import { tagsSchema } from './tags.dto';

const answerSchema = z.object({
  body: z.string(),
  /** What its Giver wrote was bound to when it was sent. */
  tags: tagsSchema,
  answeredAt: z.iso.datetime({ offset: true }),
});

const askSchema = z.object({
  askId: z.uuid(),
  giverAccountId: z.uuid(),
  /** `null` while that Member has not introduced themselves. */
  giverName: z.string().nullable(),
  /** `DEACTIVATED` once the Giver was Deactivated in this Workspace; their Ask stays. */
  giverStatus: z.enum(PERSON_STATUSES),
  status: z.enum(ASK_STATUSES),
  /**
   * What was written, or `null`: the Ask is still waiting, the caller may not read it, or the
   * route does not carry answers — the list of sent requests does not.
   */
  answer: answerSchema.nullable(),
});

const selectedPersonSchema = z.object({
  accountId: z.uuid(),
  /** `null` while that Member has not introduced themselves. */
  name: z.string().nullable(),
  /** `DEACTIVATED` once they were Deactivated in this Workspace; their Feedback stays. */
  status: z.enum(PERSON_STATUSES),
});

/**
 * Who besides the Giver and the Requester reads the answers. An object rather than a bare enum
 * so that `null` — a Giver is not told — generates correctly: a nullable primitive on a
 * response root comes out of the contract as an array (`docs/design/0016` §10).
 */
const visibilitySchema = z.object({
  value: z.enum(VISIBILITIES),
  /** The Members picked, ordered by Account; empty unless `value` is `SELECTED_PEOPLE`. */
  selectedPeople: z.array(selectedPersonSchema),
});

/** One Feedback Request on the wire. The list of them sends the same shape, so it is one. */
export const feedbackRequestSchema = z.object({
  id: z.uuid(),
  topic: z.string(),
  /** What the Topic was bound to when it was sent; highlight these and nothing else. */
  topicTags: tagsSchema,
  /** `null` when the caller is a Giver, who is not told who else reads their answer. */
  visibility: visibilitySchema.nullable(),
  /** One per Member asked, oldest first. */
  asks: z.array(askSchema),
  createdAt: z.iso.datetime({ offset: true }),
});

export const getFeedbackRequestResponseSchema = feedbackRequestSchema;
export class GetFeedbackRequestResponseDto extends createZodDto(
  getFeedbackRequestResponseSchema,
) {}
