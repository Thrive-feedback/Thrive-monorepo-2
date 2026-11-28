import type { Prisma } from '@app/infrastructure/database/generated/client';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import {
  type KudosMonthRow,
  type KudosPageRow,
  KudosQuery,
  type ProfileKudosCountsRow,
} from '../../application/query-port/kudos.query-port';
import type {
  CursorPageRequest,
  FeedPageRequest,
  FeedPosition,
} from '../../application/types/kudos.types';
import {
  CALENDAR_UTC_OFFSET_HOURS,
  type InstantRange,
} from '../../domain/value-object/calendar-clock.vo';
import { notBefore, olderThan } from '../mapper/feed-position.mapper';
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

/**
 * The Kudos on Home: all of a Workspace's, every Member reads them. The list and the count of its
 * days both read through this, so they cannot disagree (ADR 0095).
 */
function kudosOnHomeWhere(workspaceId: string): Prisma.KudosWhereInput {
  return { workspaceId };
}

/** The Kudos naming one person: Received's, and a Profile's list and its count. */
function kudosNamingWhere(
  workspaceId: string,
  recipientAccountId: string,
): Prisma.KudosWhereInput {
  return {
    ...kudosOnHomeWhere(workspaceId),
    recipients: { some: { accountId: recipientAccountId } },
  };
}

/**
 * The Kudos between a reader and one Member: given by one naming the other, or by somebody else
 * naming both. A Profile's list and its count read this. One read, unlike Feedback's two: a
 * Workspace's Kudos are few enough that walking them newest first on their own index, and stopping
 * once a page is full, cost less than first fetching every Kudos either was given (ADR 0097).
 */
function kudosBetweenWhere(
  workspaceId: string,
  readerAccountId: string,
  memberAccountId: string,
): Prisma.KudosWhereInput {
  const naming = (accountId: string) => ({
    recipients: { some: { accountId } },
  });
  return {
    workspaceId,
    OR: [
      { giverAccountId: readerAccountId, ...naming(memberAccountId) },
      { giverAccountId: memberAccountId, ...naming(readerAccountId) },
      { AND: [naming(readerAccountId), naming(memberAccountId)] },
    ],
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
    within: InstantRange | null,
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
    since: Date | null = null,
  ): Promise<KudosPageRow> {
    const records = await this.prismaTransactionContext.client.kudos.findMany({
      where: {
        AND: [
          // Received and a Profile narrow it to the Kudos that name one person.
          recipientAccountId === null
            ? kudosOnHomeWhere(workspaceId)
            : kudosNamingWhere(workspaceId, recipientAccountId),
          notBefore(since),
          olderThan(page.after),
        ],
      },
      orderBy: NEWEST_FIRST,
      take: page.limit + 1,
      select: KUDOS_FIELDS,
    });
    return toKudosPage(records, page.limit);
  }

  async kudosBetween(
    workspaceId: string,
    readerAccountId: string,
    memberAccountId: string,
    page: FeedPageRequest,
    since: Date | null,
  ): Promise<KudosPageRow> {
    const between = kudosBetweenWhere(
      workspaceId,
      readerAccountId,
      memberAccountId,
    );
    // One row more than asked for, only to tell whether another page follows (ADR 0059).
    const records = await this.prismaTransactionContext.client.kudos.findMany({
      where: { AND: [between, notBefore(since), olderThan(page.after)] },
      orderBy: NEWEST_FIRST,
      take: page.limit + 1,
      select: KUDOS_FIELDS,
    });
    return toKudosPage(records, page.limit);
  }

  async profileCounts(
    workspaceId: string,
    readerAccountId: string | null,
    memberAccountId: string,
    since: Date | null,
  ): Promise<ProfileKudosCountsRow> {
    const { client } = this.prismaTransactionContext;
    const from = notBefore(since);
    const count = (where: Prisma.KudosWhereInput) =>
      client.kudos.count({ where: { AND: [where, from] } });
    const [naming, between] = await Promise.all([
      count(kudosNamingWhere(workspaceId, memberAccountId)),
      readerAccountId === null
        ? 0
        : count(
            kudosBetweenWhere(workspaceId, readerAccountId, memberAccountId),
          ),
    ]);
    return { naming, between };
  }

  async onHomeGivenIn(
    workspaceId: string,
    within: InstantRange,
  ): Promise<readonly Date[]> {
    const records = await this.prismaTransactionContext.client.kudos.findMany({
      where: {
        AND: [
          kudosOnHomeWhere(workspaceId),
          { createdAt: { gte: within.from, lt: within.until } },
        ],
      },
      select: { createdAt: true },
    });
    return records.map((record) => record.createdAt);
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
          "createdAt" + make_interval(hours => ${CALENDAR_UTC_OFFSET_HOURS}::int),
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
