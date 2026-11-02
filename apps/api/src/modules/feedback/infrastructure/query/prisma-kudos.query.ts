import type { Prisma } from '@app/infrastructure/database/generated/client';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import {
  type KudosMonthRow,
  type KudosPageRow,
  KudosQuery,
} from '../../application/query-port/kudos.query-port';
import type {
  CursorPageRequest,
  FeedPageRequest,
  FeedPosition,
} from '../../application/types/kudos.types';
import {
  KUDOS_MONTH_UTC_OFFSET_HOURS,
  type KudosMonthRange,
} from '../../domain/value-object/kudos-month.vo';
import { olderThan } from '../mapper/feed-position.mapper';
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

type KudosRecord = Prisma.KudosGetPayload<{ select: typeof KUDOS_FIELDS }>;

/** One row was read past the page, only to tell whether another follows (ADR 0059). */
function toKudosPage(
  records: readonly KudosRecord[],
  limit: number,
): KudosPageRow {
  return {
    items: records.slice(0, limit).map((record) => ({
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
    hasMore: records.length > limit,
  };
}

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
    within: KudosMonthRange | null,
  ): Promise<KudosPageRow> {
    // One row more than asked for, only to tell whether another page follows (ADR 0059).
    const records = await this.prismaTransactionContext.client.kudos.findMany({
      where: {
        workspaceId,
        ...(within && {
          createdAt: { gte: within.from, lt: within.until },
        }),
      },
      orderBy: NEWEST_FIRST,
      take: page.limit + 1,
      ...(page.afterId === null
        ? {}
        : { cursor: { id: page.afterId }, skip: 1 }),
      select: KUDOS_FIELDS,
    });
    return toKudosPage(records, page.limit);
  }

  async onHome(
    workspaceId: string,
    page: FeedPageRequest,
    recipientAccountId: string | null,
  ): Promise<KudosPageRow> {
    const records = await this.prismaTransactionContext.client.kudos.findMany({
      where: {
        AND: [
          {
            workspaceId,
            ...(recipientAccountId !== null && {
              recipients: { some: { accountId: recipientAccountId } },
            }),
          },
          olderThan(page.after),
        ],
      },
      orderBy: NEWEST_FIRST,
      take: page.limit + 1,
      select: KUDOS_FIELDS,
    });
    return toKudosPage(records, page.limit);
  }

  async givenBy(
    workspaceId: string,
    giverAccountId: string,
    page: FeedPageRequest,
  ): Promise<KudosPageRow> {
    const records = await this.prismaTransactionContext.client.kudos.findMany({
      where: {
        AND: [{ workspaceId, giverAccountId }, olderThan(page.after)],
      },
      orderBy: NEWEST_FIRST,
      take: page.limit + 1,
      select: KUDOS_FIELDS,
    });
    return toKudosPage(records, page.limit);
  }

  async positionOf(
    workspaceId: string,
    kudosId: string,
  ): Promise<FeedPosition | null> {
    return this.prismaTransactionContext.client.kudos.findFirst({
      where: { id: kudosId, workspaceId },
      select: { id: true, createdAt: true },
    });
  }

  /**
   * Raw because Prisma cannot group by a computed month. `createdAt` is UTC with no zone, so adding
   * the clock's offset to it gives the month `KudosMonth` would put it in (ADR 0076).
   */
  async monthsIn(workspaceId: string): Promise<readonly KudosMonthRow[]> {
    return this.prismaTransactionContext.client.$queryRaw<KudosMonthRow[]>`
      SELECT
        to_char(
          "createdAt" + make_interval(hours => ${KUDOS_MONTH_UTC_OFFSET_HOURS}::int),
          'YYYY-MM'
        ) AS "month",
        COUNT(*)::int AS "count"
      FROM "kudos"
      WHERE "workspaceId" = ${workspaceId}
      GROUP BY 1
      ORDER BY 1 DESC
    `;
  }
}
