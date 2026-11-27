import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import { OneOnOneMeetingQuery } from '../../application/query-port/one-on-one-meeting.query-port';
import type {
  OneOnOneMeetingCursorPageRequest,
  OneOnOneMeetingProjection,
} from '../../application/types/one-on-one-meeting.types';
import { toMeetingProjection } from '../mapper/one-on-one-meeting.mapper';

const WITH_TOPICS = { topics: true } as const;

@Injectable()
export class PrismaOneOnOneMeetingQuery extends OneOnOneMeetingQuery {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async findLive(
    workspaceId: string,
    oneOnOneId: string,
  ): Promise<OneOnOneMeetingProjection | null> {
    const record =
      await this.prismaTransactionContext.client.oneOnOneMeeting.findFirst({
        where: { oneOnOneId, workspaceId, finishedAt: null },
        include: WITH_TOPICS,
      });
    return record ? toMeetingProjection(record) : null;
  }

  async findLastFinished(
    workspaceId: string,
    oneOnOneId: string,
  ): Promise<OneOnOneMeetingProjection | null> {
    const record =
      await this.prismaTransactionContext.client.oneOnOneMeeting.findFirst({
        where: { oneOnOneId, workspaceId, finishedAt: { not: null } },
        orderBy: { finishedAt: 'desc' },
        include: WITH_TOPICS,
      });
    return record ? toMeetingProjection(record) : null;
  }

  async listHeldFor(
    workspaceId: string,
    oneOnOneId: string,
  ): Promise<readonly Date[]> {
    const records =
      await this.prismaTransactionContext.client.oneOnOneMeeting.findMany({
        where: {
          workspaceId,
          oneOnOneId,
          finishedAt: { not: null },
          occursAt: { not: null },
        },
        select: { occursAt: true },
      });
    return records.flatMap(({ occursAt }) => (occursAt ? [occursAt] : []));
  }

  async listFinished(
    workspaceId: string,
    oneOnOneId: string,
    page: OneOnOneMeetingCursorPageRequest,
  ): Promise<{
    readonly items: readonly OneOnOneMeetingProjection[];
    readonly nextAfterId: string | null;
  }> {
    // Ids are UUID v7, so descending ids are the newest first; a meeting is finished in the order
    // it was opened, as a 1:1 has one open at a time.
    const records =
      await this.prismaTransactionContext.client.oneOnOneMeeting.findMany({
        where: {
          workspaceId,
          oneOnOneId,
          finishedAt: { not: null },
          ...(page.afterId === null ? {} : { id: { lt: page.afterId } }),
        },
        orderBy: { id: 'desc' },
        take: page.limit + 1,
        include: WITH_TOPICS,
      });
    const items = records.slice(0, page.limit).map(toMeetingProjection);
    return {
      items,
      nextAfterId:
        records.length > page.limit ? (items.at(-1)?.id ?? null) : null,
    };
  }
}
