import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import { NotificationQuery } from '../../application/query-port/notification.query-port';
import type {
  NotificationRow,
  NotificationRowPage,
  PageRequest,
} from '../../application/types/notification.types';
import { storedAudience } from '../../domain/value-object/notification-audience.vo';
import { NOTIFICATION_TYPES } from '../../domain/value-object/notification-type.vo';

/** The columns a bell line needs. The Workspace and the recipient are not among them. */
const ROW_FIELDS = {
  id: true,
  type: true,
  actorAccountId: true,
  subjectId: true,
  createdAt: true,
  readAt: true,
  audience: true,
} as const;

/** Reads through `client`, so a read inside a unit of work joins its transaction. */
@Injectable()
export class PrismaNotificationQuery extends NotificationQuery {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async forRecipient(
    workspaceId: string,
    recipientAccountId: string,
    page: PageRequest,
  ): Promise<NotificationRowPage> {
    const where = { workspaceId, recipientAccountId };
    const [rows, total] = await Promise.all([
      this.prismaTransactionContext.client.notification.findMany({
        where,
        // The id breaks a tie: ids are UUIDv7, so two rows written in the same millisecond —
        // which one event's fan-out always is — still come back in a stable order.
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page.page - 1) * page.pageSize,
        take: page.pageSize,
        select: ROW_FIELDS,
      }),
      this.prismaTransactionContext.client.notification.count({ where }),
    ]);
    // The column is text, as every value this application keys a map by is stored; only rows
    // this release knows how to draw are answered, so a type written by a later one reads as
    // nothing rather than as a line the bell has no sentence for.
    return {
      items: rows
        .map((row) => ({ ...row, audience: storedAudience(row.audience) }))
        .filter(isKnownType),
      total,
    };
  }

  async unreadCountFor(
    workspaceId: string,
    recipientAccountId: string,
  ): Promise<number> {
    // The first three columns are the index's, in its order; `type` is checked on the rows they reach.
    // Only the kinds this release can draw are counted, as only those are listed: a row of a kind
    // a newer release wrote, read after a rollback, must not leave a badge with no line behind it.
    return this.prismaTransactionContext.client.notification.count({
      where: {
        workspaceId,
        recipientAccountId,
        readAt: null,
        type: { in: [...NOTIFICATION_TYPES] },
      },
    });
  }
}

function isKnownType(
  row: { readonly type: string } & Omit<NotificationRow, 'type'>,
): row is NotificationRow {
  return (NOTIFICATION_TYPES as readonly string[]).includes(row.type);
}
