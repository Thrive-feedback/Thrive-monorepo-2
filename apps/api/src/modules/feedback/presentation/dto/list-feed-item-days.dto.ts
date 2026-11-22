import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { FEED_ITEM_SHOWS } from '../../application/types/feedback-request.types';
import { HOME_DAYS } from '../../application/use-cases/list-feed-item-days.use-case';

export const listFeedItemDaysQuerySchema = z.strictObject({
  /** Which of what the caller reads on Home: everything unless it says otherwise. */
  show: z.enum(FEED_ITEM_SHOWS).default('ALL'),
});
export class ListFeedItemDaysQueryDto extends createZodDto(
  listFeedItemDaysQuerySchema,
) {}

const countsShape = {
  /** Feedback given without being asked. */
  offeredFeedback: z.number().int().nonnegative(),
  /** Feedback written to answer an Ask. */
  requestedFeedback: z.number().int().nonnegative(),
  /** Always 0 under Shared with me, which holds no Kudos (ADR 0090). */
  kudos: z.number().int().nonnegative(),
};

const feedItemDaySchema = z.object({
  /** `YYYY-MM-DD`, on the one clock every calendar is read on: UTC+7 (ADR 0095). */
  day: z.iso.date(),
  ...countsShape,
});

/** One summary of the caller's Home, so it is not paged (`BE_07` R5). */
export const listFeedItemDaysResponseSchema = z.object({
  /** Today and the six days before it, oldest first, every one of them even when it holds nothing. */
  days: z.array(feedItemDaySchema).length(HOME_DAYS),
  /** The same days added up. */
  totals: z.object(countsShape),
});
export class ListFeedItemDaysResponseDto extends createZodDto(
  listFeedItemDaysResponseSchema,
) {}
