import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import { WorkspaceNamePort } from '../../domain/port/workspace-name.port';

/**
 * Reads the Workspace's own row for its name and nothing else. Workspace owns that table, so
 * this is a read inside the module rather than across a boundary (`BE_03` R7).
 */
@Injectable()
export class PrismaWorkspaceNameAdapter extends WorkspaceNamePort {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async nameOf(workspaceId: string): Promise<string | null> {
    const found =
      await this.prismaTransactionContext.client.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true },
      });
    return found?.name ?? null;
  }
}
