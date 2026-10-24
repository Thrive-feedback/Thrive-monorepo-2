import {
  pageQueryShape,
  pageResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NOTIFICATION_TYPES } from '../../domain/value-object/notification-type.vo';

export const listNotificationsQuerySchema = z.strictObject(pageQueryShape);
export class ListNotificationsQueryDto extends createZodDto(
  listNotificationsQuerySchema,
) {}

/**
 * One line of the caller's bell. It carries ids, a type and a name, and none of what anybody
 * wrote: the type is the whole sentence's vocabulary and the web composes the sentence from it,
 * so the Request and Feedback messages stay in the one place they were written (design 0022 D3,
 * D12).
 */
const notificationSchema = z.object({
  id: z.uuid(),
  type: z.enum(NOTIFICATION_TYPES),
  actor: z.object({
    accountId: z.string(),
    /** `null` while they have not introduced themselves, or their Account is gone. */
    name: z.string().nullable(),
  }),
  /**
   * The Ask, Feedback Request or Feedback this is about, raw. Which of the three it is follows
   * from `type`, and the web turns the pair into a link — nothing here is read from Feedback,
   * so a subject that has gone is followed to the ordinary not-found rather than filtered out.
   */
  subjectId: z.uuid(),
  createdAt: z.iso.datetime({ offset: true }),
  /** `null` while the Member has not read it. */
  readAt: z.iso.datetime({ offset: true }).nullable(),
});

export const listNotificationsResponseSchema = z.object({
  items: z.array(notificationSchema),
  ...pageResultShape,
});
export class ListNotificationsResponseDto extends createZodDto(
  listNotificationsResponseSchema,
) {}
