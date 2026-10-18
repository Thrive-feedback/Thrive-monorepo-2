import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import {
  ConnectionRepository,
  type ConnectionToStore,
} from '../../domain/repository/connection-repository.port';

/** Writes through `client`, so a save inside a unit of work joins its transaction. */
@Injectable()
export class PrismaConnectionRepository extends ConnectionRepository {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async save(connection: ConnectionToStore): Promise<void> {
    const stored = {
      externalWorkspaceId: connection.externalWorkspaceId,
      externalWorkspaceName: connection.externalWorkspaceName,
      externalChannelId: connection.externalChannelId,
      externalChannelName: connection.externalChannelName,
      connectedByAccountId: connection.connectedByAccountId,
    };
    // One statement: connecting again replaces the Workspace's Connection to that tool in
    // place, so the unique index decides the outcome rather than a read followed by a write.
    await this.prismaTransactionContext.client.integrationConnection.upsert({
      where: {
        workspaceId_provider: {
          workspaceId: connection.workspaceId,
          provider: connection.provider,
        },
      },
      create: {
        id: connection.id,
        workspaceId: connection.workspaceId,
        provider: connection.provider,
        ...stored,
      },
      // The minted id is left out on purpose: a replacement keeps the row it replaces.
      update: stored,
    });
  }
}
