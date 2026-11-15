import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import {
  type ListOpened,
  ListSeenRepository,
} from '../../domain/repository/list-seen-repository.port';

@Injectable()
export class PrismaListSeenRepository extends ListSeenRepository {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async markSeen(opened: ListOpened, seenAt: Date): Promise<void> {
    const { workspaceId, accountId, list } = opened;
    await this.prismaTransactionContext.client.listSeen.upsert({
      where: { workspaceId_accountId_list: { workspaceId, accountId, list } },
      create: { workspaceId, accountId, list, seenAt },
      update: { seenAt },
    });
  }
}
