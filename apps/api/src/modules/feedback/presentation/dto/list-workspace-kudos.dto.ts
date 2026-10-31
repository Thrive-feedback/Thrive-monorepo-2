import {
  cursorQueryShape,
  cursorResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PERSON_STATUSES } from '../../application/types/feedback-request.types';
import { kudosCardSchema } from './kudos-card.dto';
import { tagsSchema } from './tags.dto';

export const listWorkspaceKudosQuerySchema = z.strictObject(cursorQueryShape);
export class ListWorkspaceKudosQueryDto extends createZodDto(
  listWorkspaceKudosQuerySchema,
) {}

const personSchema = z.object({
  accountId: z.uuid(),
  /** `null` while they have not introduced themselves. */
  name: z.string().nullable(),
  /** `DEACTIVATED` once they were Deactivated in this Workspace; their Kudos stays. */
  status: z.enum(PERSON_STATUSES),
});

/**
 * One Kudos. People are nested objects, as on the feed: a nullable name must sit below the
 * response root (`docs/design/0016` §10).
 */
const kudosSchema = z.object({
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
