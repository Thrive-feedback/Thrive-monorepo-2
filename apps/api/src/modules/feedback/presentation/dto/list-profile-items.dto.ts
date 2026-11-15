import {
  cursorQueryShape,
  cursorResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PROFILE_ITEM_SHOWS } from '../../application/types/personal-item.types';
import { personalItemSchema } from './list-received-items.dto';

export const listProfileItemsQuerySchema = z.strictObject({
  /**
   * The Feedback the whole Workspace reads, the Feedback somebody selected the caller to read, or
   * the Kudos that name the Member.
   */
  show: z.enum(PROFILE_ITEM_SHOWS).default('FEEDBACK'),
  ...cursorQueryShape,
});
export class ListProfileItemsQueryDto extends createZodDto(
  listProfileItemsQuerySchema,
) {}

export const listProfileItemsResponseSchema = z.object({
  /** Who is reading, so a reader can tell themselves among the people a piece names. */
  readerAccountId: z.uuid(),
  /**
   * Newest first. Feedback is `EVERYONE` under `FEEDBACK` and `SELECTED_PEOPLE`, with the caller
   * among those selected, under `SHARED_WITH_ME`.
   */
  items: z.array(personalItemSchema),
  ...cursorResultShape,
});
export class ListProfileItemsResponseDto extends createZodDto(
  listProfileItemsResponseSchema,
) {}
