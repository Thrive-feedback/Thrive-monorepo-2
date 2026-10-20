import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import { WorkspaceGoalQuery } from '../../application/query-port/workspace-goal.query-port';
import type {
  PageRequest,
  WorkspaceGoalPage,
} from '../../application/types/workspace-goal.types';
import { toWorkspaceGoalView } from '../mapper/workspace-goal.mapper';

@Injectable()
export class PrismaWorkspaceGoalQuery extends WorkspaceGoalQuery {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async listInWorkspace(
    workspaceId: string,
    options: { readonly includeHidden: boolean },
    page: PageRequest,
  ): Promise<WorkspaceGoalPage> {
    const where = options.includeHidden
      ? { workspaceId }
      : { workspaceId, status: 'ACTIVE' as const };
    const [records, total] = await Promise.all([
      this.prismaTransactionContext.client.workspaceGoal.findMany({
        where,
        orderBy: [{ nameKey: 'asc' }, { id: 'asc' }],
        skip: (page.page - 1) * page.pageSize,
        take: page.pageSize,
        select: { id: true, name: true, description: true, status: true },
      }),
      this.prismaTransactionContext.client.workspaceGoal.count({ where }),
    ]);
    return { items: records.map(toWorkspaceGoalView), total };
  }
}
