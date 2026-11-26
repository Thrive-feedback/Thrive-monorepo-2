import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import { OneOnOneQuery } from '../../application/query-port/one-on-one.query-port';
import type {
  OneOnOneCursorPageRequest,
  OneOnOneRow,
  OneOnOneRowPage,
} from '../../application/types/one-on-one.types';
import { toOneOnOneRow } from '../mapper/one-on-one.mapper';
import { MEETING_IN_PROGRESS } from './meeting-in-progress.record';

@Injectable()
export class PrismaOneOnOneQuery extends OneOnOneQuery {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async listFor(
    workspaceId: string,
    accountId: string,
    page: OneOnOneCursorPageRequest,
    declinedSince: Date,
  ): Promise<OneOnOneRowPage> {
    const records =
      await this.prismaTransactionContext.client.oneOnOne.findMany({
        where: {
          workspaceId,
          ...(page.afterId === null ? {} : { id: { gt: page.afterId } }),
          OR: [
            {
              // Ended ones stay, so what was written in them can still be read by both.
              status: { in: ['INVITED', 'ACTIVE', 'ENDED'] },
              OR: [
                { startedByAccountId: accountId },
                { invitedAccountId: accountId },
              ],
            },
            // A 1:1 turned down stays a while with whoever started it, so they learn the answer.
            {
              status: 'DECLINED',
              startedByAccountId: accountId,
              answeredAt: { gte: declinedSince },
            },
          ],
        },
        // Ids are UUID v7, so this is the order they were started in.
        orderBy: { id: 'asc' },
        take: page.limit + 1,
        // One query with the page, not one per 1:1 (BE_06 R9).
        include: MEETING_IN_PROGRESS,
      });
    const items = records.slice(0, page.limit).map(toOneOnOneRow);
    const hasMore = records.length > page.limit;
    return {
      items,
      nextAfterId: hasMore ? (items.at(-1)?.id ?? null) : null,
    };
  }

  async findFor(
    workspaceId: string,
    oneOnOneId: string,
    accountId: string,
  ): Promise<OneOnOneRow | null> {
    const record =
      await this.prismaTransactionContext.client.oneOnOne.findFirst({
        where: {
          id: oneOnOneId,
          workspaceId,
          OR: [
            { startedByAccountId: accountId },
            { invitedAccountId: accountId },
          ],
        },
        include: MEETING_IN_PROGRESS,
      });
    return record === null ? null : toOneOnOneRow(record);
  }
}
