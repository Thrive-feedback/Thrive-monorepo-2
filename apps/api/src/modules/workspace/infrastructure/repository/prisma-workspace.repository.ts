import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import type { Workspace } from '../../domain/entity/workspace.entity';
import { WorkspaceRepository } from '../../domain/repository/workspace-repository.port';
import { toWorkspace, toWorkspaceRecord } from '../mapper/workspace.mapper';

/** Reads and writes through `client`, so it joins the unit of work it is called in. */
@Injectable()
export class PrismaWorkspaceRepository extends WorkspaceRepository {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async findById(id: string): Promise<Workspace | null> {
    const record =
      await this.prismaTransactionContext.client.workspace.findUnique({
        where: { id },
        include: { members: { orderBy: { createdAt: 'asc' } } },
      });
    return record ? toWorkspace(record) : null;
  }

  async findByMemberAccount(accountId: string): Promise<Workspace | null> {
    const record =
      await this.prismaTransactionContext.client.workspace.findFirst({
        where: { members: { some: { userId: accountId } } },
        orderBy: { createdAt: 'asc' },
        include: { members: { orderBy: { createdAt: 'asc' } } },
      });
    return record ? toWorkspace(record) : null;
  }

  async save(workspace: Workspace): Promise<void> {
    const record = toWorkspaceRecord(workspace);
    await this.prismaTransactionContext.client.workspace.create({
      data: {
        ...record.workspace,
        members: { create: [...record.members] },
      },
    });
  }
}
