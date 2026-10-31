import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import {
  type KudosPageRow,
  KudosQuery,
} from '../../application/query-port/kudos.query-port';
import type { CursorPageRequest } from '../../application/types/kudos.types';
import { toKudosCardSnapshot } from '../mapper/kudos.mapper';

/** Newest first, `id` breaking ties, so the order is total and a cursor names one place in it. */
const NEWEST_FIRST = [{ createdAt: 'desc' }, { id: 'desc' }] satisfies {
  readonly [key: string]: 'desc';
}[];

const KUDOS_FIELDS = {
  id: true,
  giverAccountId: true,
  message: true,
  card: true,
  createdAt: true,
  recipients: { orderBy: { accountId: 'asc' }, select: { accountId: true } },
  workspaceGoals: { orderBy: { name: 'asc' }, select: { name: true } },
  mentions: {
    orderBy: { slug: 'asc' },
    select: { slug: true, displayName: true },
  },
} as const;

/** Reads through `client`, so a read inside a unit of work joins its transaction. */
@Injectable()
export class PrismaKudosQuery extends KudosQuery {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async publicIn(
    workspaceId: string,
    page: CursorPageRequest,
  ): Promise<KudosPageRow> {
    // One row more than asked for, only to tell whether another page follows (ADR 0059).
    const records = await this.prismaTransactionContext.client.kudos.findMany({
      where: { workspaceId },
      orderBy: NEWEST_FIRST,
      take: page.limit + 1,
      ...(page.afterId === null
        ? {}
        : { cursor: { id: page.afterId }, skip: 1 }),
      select: KUDOS_FIELDS,
    });
    return {
      items: records.slice(0, page.limit).map((record) => ({
        id: record.id,
        giverAccountId: record.giverAccountId,
        recipientAccountIds: record.recipients.map(
          (recipient) => recipient.accountId,
        ),
        message: record.message,
        tags: {
          workspaceGoals: record.workspaceGoals.map((workspaceGoal) => ({
            name: workspaceGoal.name,
          })),
          mentions: record.mentions.map((mention) => ({
            slug: mention.slug,
            displayName: mention.displayName,
          })),
        },
        card: toKudosCardSnapshot(record.card),
        createdAt: record.createdAt,
      })),
      hasMore: records.length > page.limit,
    };
  }
}
