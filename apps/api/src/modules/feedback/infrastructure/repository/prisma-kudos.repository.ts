import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import type { Kudos } from '../../domain/entity/kudos.entity';
import { KudosRepository } from '../../domain/repository/kudos-repository.port';
import {
  toKudosMentionRecords,
  toKudosRecipientRecords,
  toKudosRecord,
  toKudosWorkspaceGoalRecords,
} from '../mapper/kudos.mapper';

/** Writes through `client`, so a save inside a unit of work joins its transaction. */
@Injectable()
export class PrismaKudosRepository extends KudosRepository {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async save(kudos: Kudos): Promise<void> {
    // One statement, so a Kudos is never stored without what it names.
    await this.prismaTransactionContext.client.kudos.create({
      data: {
        ...toKudosRecord(kudos),
        recipients: { create: toKudosRecipientRecords(kudos) },
        workspaceGoals: { create: toKudosWorkspaceGoalRecords(kudos) },
        mentions: { create: toKudosMentionRecords(kudos) },
      },
    });
  }
}
