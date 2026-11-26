import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import { OneOnOneMeeting } from '../../domain/entity/one-on-one-meeting.entity';
import { OneOnOneMeetingRepository } from '../../domain/repository/one-on-one-meeting-repository.port';
import {
  toMeetingRecord,
  toMeetingSnapshot,
  toTopicRecords,
} from '../mapper/one-on-one-meeting.mapper';

const WITH_TOPICS = { topics: true } as const;

/** Writes through `client`, so a save inside a unit of work joins its transaction. */
@Injectable()
export class PrismaOneOnOneMeetingRepository extends OneOnOneMeetingRepository {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async findById(
    workspaceId: string,
    oneOnOneId: string,
    meetingId: string,
  ): Promise<OneOnOneMeeting | null> {
    const record =
      await this.prismaTransactionContext.client.oneOnOneMeeting.findFirst({
        where: { id: meetingId, oneOnOneId, workspaceId },
        include: WITH_TOPICS,
      });
    return record ? OneOnOneMeeting.restore(toMeetingSnapshot(record)) : null;
  }

  async findLive(
    workspaceId: string,
    oneOnOneId: string,
  ): Promise<OneOnOneMeeting | null> {
    const record =
      await this.prismaTransactionContext.client.oneOnOneMeeting.findFirst({
        where: { oneOnOneId, workspaceId, finishedAt: null },
        include: WITH_TOPICS,
      });
    return record ? OneOnOneMeeting.restore(toMeetingSnapshot(record)) : null;
  }

  async findLastFinished(
    workspaceId: string,
    oneOnOneId: string,
  ): Promise<OneOnOneMeeting | null> {
    const record =
      await this.prismaTransactionContext.client.oneOnOneMeeting.findFirst({
        where: { oneOnOneId, workspaceId, finishedAt: { not: null } },
        orderBy: { finishedAt: 'desc' },
        include: WITH_TOPICS,
      });
    return record ? OneOnOneMeeting.restore(toMeetingSnapshot(record)) : null;
  }

  /**
   * The meeting row, then its agenda as it now stands, in three statements however long the agenda:
   * an agenda is a few dozen short rows at most, so it is written whole rather than diffed. Runs in
   * the caller's unit of work, so nobody reads the agenda half written.
   */
  async save(meeting: OneOnOneMeeting): Promise<void> {
    const snapshot = meeting.snapshot();
    const { id, ...row } = toMeetingRecord(snapshot);
    const client = this.prismaTransactionContext.client;
    await client.oneOnOneMeeting.upsert({
      where: { id },
      create: { id, ...row },
      update: row,
    });
    await client.oneOnOneTopic.deleteMany({ where: { meetingId: id } });
    await client.oneOnOneTopic.createMany({ data: toTopicRecords(snapshot) });
  }
}
