import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import {
  MyCountsQuery,
  type MyCountsRow,
} from '../../application/query-port/my-counts.query-port';
import type { SeenListValue } from '../../domain/value-object/seen-list.vo';
import {
  answersToRequestsByWhere,
  feedItemsWhere,
  kudosNamingWhere,
  offeredToWhere,
  waitingAsksWhere,
} from '../mapper/personal-items-where.mapper';

/** Only what came after the last open, or everything when the list was never opened. */
function after(seenAt: Date | undefined) {
  return seenAt === undefined ? {} : { createdAt: { gt: seenAt } };
}

/**
 * Two round trips however much there is: the times this Member last opened each list, then the
 * counts at once. Each count is the list's own `where`, so a number never names a row the list it
 * sits beside would not show — except My requests, whose list is read in SQL and is held to this
 * count by an integration test instead.
 */
@Injectable()
export class PrismaMyCountsQuery extends MyCountsQuery {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async countsFor(
    workspaceId: string,
    accountId: string,
  ): Promise<MyCountsRow> {
    const { client } = this.prismaTransactionContext;
    const seen = await client.listSeen.findMany({
      where: { workspaceId, accountId },
      select: { list: true, seenAt: true },
    });
    const seenAt = new Map<SeenListValue, Date>(
      seen.map((row) => [row.list, row.seenAt]),
    );
    const [waitingAsks, newAnswers, newOffered, newKudos, newShared] =
      await Promise.all([
        client.feedbackAsk.count({
          where: waitingAsksWhere(workspaceId, accountId),
        }),
        client.feedback.count({
          where: {
            AND: [
              answersToRequestsByWhere(workspaceId, accountId),
              after(seenAt.get('RECEIVED_REQUESTS')),
            ],
          },
        }),
        client.feedback.count({
          where: {
            AND: [
              offeredToWhere(workspaceId, accountId),
              after(seenAt.get('RECEIVED_OFFERED')),
            ],
          },
        }),
        client.kudos.count({
          where: {
            AND: [
              kudosNamingWhere(workspaceId, accountId),
              after(seenAt.get('RECEIVED_KUDOS')),
            ],
          },
        }),
        client.feedback.count({
          where: {
            AND: [
              feedItemsWhere(workspaceId, accountId, 'SHARED_WITH_ME'),
              after(seenAt.get('SHARED_WITH_ME')),
            ],
          },
        }),
      ]);
    return { waitingAsks, newAnswers, newOffered, newKudos, newShared };
  }
}
