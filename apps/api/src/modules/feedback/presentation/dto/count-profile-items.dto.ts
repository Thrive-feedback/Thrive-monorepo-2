import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { profileSinceSchema } from './list-profile-items.dto';

export const countProfileItemsQuerySchema = z.strictObject({
  /** Count only what was written at or after this instant. Open Asks are counted however old. */
  since: profileSinceSchema,
});
export class CountProfileItemsQueryDto extends createZodDto(
  countProfileItemsQuerySchema,
) {}

const count = z.number().int().nonnegative();

/**
 * How many items each list `GET …/profile-items` reads for the caller holds, one per `show`: from
 * `since` on, and every Ask still open. On the caller's own Profile their own lists are `0`.
 */
export const countProfileItemsResponseSchema = z.object({
  feedback: count,
  kudos: count,
  betweenUs: count,
  sharedWithMe: count,
  openAsks: count,
});
export class CountProfileItemsResponseDto extends createZodDto(
  countProfileItemsResponseSchema,
) {}
