import {
  cursorQueryShape,
  cursorResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  PROFILE_ITEM_SHOWS,
  PROFILE_ITEM_SHOWS_SINCE,
} from '../../application/types/personal-item.types';
import { personalItemSchema } from './list-received-items.dto';
import { personSchema } from './person.dto';
import { postcardSchema } from './postcard.dto';
import { tagsSchema } from './tags.dto';

/** An instant a Profile's lists are read from, or `null` for all of them. */
export const profileSinceSchema = z.iso
  .datetime({ offset: true })
  .optional()
  .transform((since) => (since === undefined ? null : new Date(since)));

export const listProfileItemsQuerySchema = z
  .strictObject({
    /**
     * What everyone sees: the Feedback the whole Workspace reads, or the Kudos that name the Member.
     * What differs by caller: the Feedback and Kudos between the caller and the Member, the Feedback
     * somebody selected the caller to read, or the Asks still open between the two.
     */
    show: z.enum(PROFILE_ITEM_SHOWS).default('FEEDBACK'),
    /**
     * Only what was written at or after this instant. It only narrows. Not with `OPEN_ASKS`, which
     * holds every Ask still open, however long ago it was asked.
     */
    since: profileSinceSchema,
    ...cursorQueryShape,
  })
  .superRefine((query, context) => {
    if (
      query.since !== null &&
      !PROFILE_ITEM_SHOWS_SINCE.includes(query.show)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['since'],
        message: `${query.show} holds every item still open and takes no since.`,
      });
    }
  });
export class ListProfileItemsQueryDto extends createZodDto(
  listProfileItemsQuerySchema,
) {}

/**
 * An Ask still waiting between the caller and the Member: one of them asked, the other has not
 * answered. Only under `BETWEEN_US`. Once answered it is gone, and its answer is listed as Feedback.
 */
const pendingAskItemSchema = z.object({
  kind: z.literal('ASK'),
  /** The Ask's own id. */
  id: z.uuid(),
  feedbackRequestId: z.uuid(),
  /** The Request message. */
  message: z.string(),
  /** What the Request message was bound to when it was sent. */
  tags: tagsSchema,
  /** Who asked: the caller or the Member. */
  requester: personSchema,
  /** Who was asked and has not answered: the other of the two. */
  asked: personSchema,
  /** How the request looks, or `null` when it was not written on a postcard. */
  postcard: postcardSchema.nullable(),
  /** When it was asked, which is where it sits in the list. */
  createdAt: z.iso.datetime({ offset: true }),
});

/** One thing on a Profile. */
const profileItemSchema = z.discriminatedUnion('kind', [
  ...personalItemSchema.options,
  pendingAskItemSchema,
]);

export const listProfileItemsResponseSchema = z.object({
  /** Who is reading, so a reader can tell themselves among the people a piece names. */
  readerAccountId: z.uuid(),
  /**
   * Newest first. Feedback is `EVERYONE` under `FEEDBACK`, `SELECTED_PEOPLE` with the caller among
   * those selected under `SHARED_WITH_ME`, and any Visibility under `BETWEEN_US`, where the caller
   * wrote it or was written to.
   */
  items: z.array(profileItemSchema),
  ...cursorResultShape,
});
export class ListProfileItemsResponseDto extends createZodDto(
  listProfileItemsResponseSchema,
) {}
