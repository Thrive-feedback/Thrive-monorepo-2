import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import type { OneOnOne } from '../../domain/entity/one-on-one.entity';
import { OneOnOneRepository } from '../../domain/repository/one-on-one-repository.port';
import { toOneOnOne, toOneOnOneRecord } from '../mapper/one-on-one.mapper';
import { MEETING_IN_PROGRESS } from '../query/meeting-in-progress.record';

/** The states in which a 1:1 is not over. */
const OPEN_STATUSES = ['INVITED', 'ACTIVE'] as const;

/** Writes through `client`, so a save inside a unit of work joins its transaction. */
@Injectable()
export class PrismaOneOnOneRepository extends OneOnOneRepository {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async findById(
    workspaceId: string,
    oneOnOneId: string,
  ): Promise<OneOnOne | null> {
    const record =
      await this.prismaTransactionContext.client.oneOnOne.findFirst({
        where: { id: oneOnOneId, workspaceId },
      });
    return record === null ? null : toOneOnOne(record);
  }

  async existsOpenBetween(
    workspaceId: string,
    firstAccountId: string,
    secondAccountId: string,
    at: Date,
  ): Promise<boolean> {
    // At most a few rows per pair; whether a one-time meeting is over is the schedule's to say.
    const found = await this.prismaTransactionContext.client.oneOnOne.findMany({
      where: {
        workspaceId,
        status: { in: [...OPEN_STATUSES] },
        OR: [
          {
            startedByAccountId: firstAccountId,
            invitedAccountId: secondAccountId,
          },
          {
            startedByAccountId: secondAccountId,
            invitedAccountId: firstAccountId,
          },
        ],
      },
      include: MEETING_IN_PROGRESS,
    });
    return found.some((record) =>
      toOneOnOne(record).isOpenAt(at, record.meetings.length > 0),
    );
  }

  async save(oneOnOne: OneOnOne): Promise<void> {
    const { id, workspaceId, ...rest } = toOneOnOneRecord(oneOnOne);
    await this.prismaTransactionContext.client.oneOnOne.upsert({
      where: { id },
      create: { id, workspaceId, ...rest },
      update: rest,
    });
  }
}
