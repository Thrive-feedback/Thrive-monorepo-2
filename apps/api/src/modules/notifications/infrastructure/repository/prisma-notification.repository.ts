import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import {
  type NotificationOfRecipient,
  NotificationRepository,
  type NotificationToRecord,
} from '../../domain/repository/notification-repository.port';

/** Writes through `client`, so a write inside a unit of work joins its transaction. */
@Injectable()
export class PrismaNotificationRepository extends NotificationRepository {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async recordAll(
    notifications: readonly NotificationToRecord[],
  ): Promise<void> {
    if (notifications.length === 0) {
      return;
    }
    // One statement for the whole fan-out: a request asking five people costs one round trip,
    // not five. `skipDuplicates` leaves the unique index to decide which rows are new, so a
    // retried or double-submitted write cannot put a second line in anybody's bell — and
    // nothing has to read first, which two writers could both do and both win.
    await this.prismaTransactionContext.client.notification.createMany({
      data: notifications.map((notification) => ({
        id: notification.id,
        workspaceId: notification.workspaceId,
        recipientAccountId: notification.recipientAccountId,
        type: notification.type,
        actorAccountId: notification.actorAccountId,
        subjectId: notification.subjectId,
      })),
      skipDuplicates: true,
    });
  }

  async markRead(
    notification: NotificationOfRecipient,
    readAt: Date,
  ): Promise<boolean> {
    // `updateMany` rather than `update`: the recipient belongs in the match, and this answers
    // how many rows it reached instead of throwing when it reached none. Somebody else's id and
    // one that never existed both reach none, which is what makes them one answer to a caller.
    const { count } =
      await this.prismaTransactionContext.client.notification.updateMany({
        where: {
          id: notification.notificationId,
          workspaceId: notification.workspaceId,
          recipientAccountId: notification.recipientAccountId,
        },
        data: { readAt },
      });
    return count > 0;
  }

  async markAllRead(
    recipient: {
      readonly workspaceId: string;
      readonly recipientAccountId: string;
    },
    readAt: Date,
  ): Promise<void> {
    await this.prismaTransactionContext.client.notification.updateMany({
      // The Workspace is in the match, so a Member of several clears the bell they are looking
      // at and not the others. `readAt: null` keeps an already-empty bell from rewriting every
      // row a Member has ever been sent.
      where: {
        workspaceId: recipient.workspaceId,
        recipientAccountId: recipient.recipientAccountId,
        readAt: null,
      },
      data: { readAt },
    });
  }
}
