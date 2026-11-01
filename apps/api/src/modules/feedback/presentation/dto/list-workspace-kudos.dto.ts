import {
  cursorQueryShape,
  cursorResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { kudosCardSchema } from './kudos-card.dto';
import { personSchema } from './person.dto';
import { tagsSchema } from './tags.dto';

/** A calendar month, `YYYY-MM`, on the one clock the board reads (ADR 0076). */
const kudosMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export const listWorkspaceKudosQuerySchema = z.strictObject({
  ...cursorQueryShape,
  /** Only the Kudos of this month. Left out, every Kudos. */
  month: kudosMonthSchema.optional(),
});
export class ListWorkspaceKudosQueryDto extends createZodDto(
  listWorkspaceKudosQuerySchema,
) {}

/**
 * One Kudos. People are nested objects, as on the feed: a nullable name must sit below the
 * response root (`docs/design/0016` §10).
 */
export const kudosSchema = z.object({
  id: z.uuid(),
  giver: personSchema,
  /** Everyone it names, never the Giver. Empty: it is for the whole Workspace (ADR 0074). */
  recipients: z.array(personSchema),
  /** What the Giver wrote. */
  message: z.string(),
  /** What the message was bound to when it was sent. */
  tags: tagsSchema,
  /** How it looks, or `null` when there is no card to draw. */
  card: kudosCardSchema.nullable(),
  createdAt: z.iso.datetime({ offset: true }),
});

export const listWorkspaceKudosResponseSchema = z.object({
  /** This Workspace's Kudos, newest first. */
  items: z.array(kudosSchema),
  ...cursorResultShape,
});
export class ListWorkspaceKudosResponseDto extends createZodDto(
  listWorkspaceKudosResponseSchema,
) {}

/**
 * A Workspace's Kudos counted. One summary rather than a collection, so it is not paged: it grows by
 * twelve rows a year at most (ADR 0076).
 */
export const listKudosMonthsResponseSchema = z.object({
  /** Every Kudos of this Workspace. */
  total: z.number().int(),
  /** The months that hold a Kudos, newest first. */
  months: z.array(
    z.object({
      month: kudosMonthSchema,
      count: z.number().int(),
    }),
  ),
});
export class ListKudosMonthsResponseDto extends createZodDto(
  listKudosMonthsResponseSchema,
) {}
