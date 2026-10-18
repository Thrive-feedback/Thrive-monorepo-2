import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import { ConnectionQuery } from '../../application/query-port/connection.query-port';
import type {
  ConnectionPage,
  PageRequest,
} from '../../application/types/connection.types';
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
}
