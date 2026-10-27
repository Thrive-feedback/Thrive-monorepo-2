import { z } from 'zod';
import { PERSON_STATUSES } from '../../application/types/feedback-request.types';

/**
 * One person a piece of Feedback names — its Giver or one of its Receivers — on every route that
 * shows one. Nested below the response root, because a nullable name there would be generated as
 * an array (`docs/design/0016` §10).
 */
export const personSchema = z.object({
  accountId: z.uuid(),
  /** `null` while they have not introduced themselves. */
  name: z.string().nullable(),
  /** Their Google photo, or `null` when they have none. */
  photoUrl: z.url().nullable(),
  /** `DEACTIVATED` once they were Deactivated in this Workspace; their Feedback stays. */
  status: z.enum(PERSON_STATUSES),
});
