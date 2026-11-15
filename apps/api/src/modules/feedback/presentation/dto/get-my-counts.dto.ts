import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * What the navigation draws beside Waiting for me and each kind of Received: numbers, and nothing
 * that says who asked or wrote what. The web asks for it on a timer, so it stays this small.
 */
export const getMyCountsResponseSchema = z.object({
  /** Every Ask still waiting on the caller. */
  waitingAsks: z.number().int(),
  /** Answers to the caller's requests since they last opened their requests. */
  newAnswers: z.number().int(),
  /** Feedback given to the caller unasked since they last opened it. */
  newOffered: z.number().int(),
  /** Kudos naming the caller since they last opened their Kudos. */
  newKudos: z.number().int(),
  /** Feedback somebody selected the caller to read since they last opened Shared with me. */
  newShared: z.number().int(),
});
export class GetMyCountsResponseDto extends createZodDto(
  getMyCountsResponseSchema,
) {}
