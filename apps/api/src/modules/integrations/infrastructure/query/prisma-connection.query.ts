import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import { ConnectionQuery } from '../../application/query-port/connection.query-port';
import type {
  ConnectedSpace,
  ConnectionPage,
  PageRequest,
  PostableChannel,
} from '../../application/types/connection.types';
import {
  INTEGRATION_PROVIDERS,
  type IntegrationProviderValue,
} from '../../domain/value-object/integration-provider.vo';
import { toConnectionView } from '../mapper/connection.mapper';

/** Reads through `client`, so a read inside a unit of work joins its transaction. */
@Injectable()
export class PrismaConnectionQuery extends ConnectionQuery {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async connectionsOfWorkspace(
    workspaceId: string,
    page: PageRequest,
  ): Promise<ConnectionPage> {
    const where = { workspaceId };
    const [connections, total] = await Promise.all([
      this.prismaTransactionContext.client.integrationConnection.findMany({
        where,
        orderBy: [{ connectedAt: 'asc' }, { id: 'asc' }],
        skip: (page.page - 1) * page.pageSize,
        take: page.pageSize,
        select: {
          provider: true,
          externalWorkspaceName: true,
          externalChannelName: true,
          connectedByAccountId: true,
          connectedAt: true,
        },
      }),
      this.prismaTransactionContext.client.integrationConnection.count({
        where,
      }),
    ]);
    return { items: connections.map(toConnectionView), total };
  }

  async connectedSpace(
    workspaceId: string,
    provider: IntegrationProviderValue,
  ): Promise<ConnectedSpace | null> {
    const connection =
      await this.prismaTransactionContext.client.integrationConnection.findUnique(
        {
          where: { workspaceId_provider: { workspaceId, provider } },
          select: { externalWorkspaceId: true },
        },
      );
    return (
      connection && { externalWorkspaceId: connection.externalWorkspaceId }
    );
  }

  async postableChannelsOf(
    workspaceId: string,
  ): Promise<readonly PostableChannel[]> {
    const connections =
      await this.prismaTransactionContext.client.integrationConnection.findMany(
        {
          where: { workspaceId },
          orderBy: [{ connectedAt: 'asc' }, { id: 'asc' }],
          select: { provider: true, externalChannelId: true },
        },
      );
    return connections.filter(isKnownProvider);
  }
}

/**
 * The column is text, as every provider value is stored. Only rows this release knows how to post
 * through are answered, so a tool that has been retired reads as nothing rather than as a value
 * the registry would throw on.
 */
function isKnownProvider<Row extends { readonly provider: string }>(
  row: Row,
): row is Row & { readonly provider: IntegrationProviderValue } {
  return (INTEGRATION_PROVIDERS as readonly string[]).includes(row.provider);
}
