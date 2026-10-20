import { Prisma } from '@app/infrastructure/database/generated/client';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import type { WorkspaceGoal } from '../../domain/entity/workspace-goal.entity';
import { WorkspaceGoalRepository } from '../../domain/repository/workspace-goal-repository.port';
import type { WorkspaceGoalName } from '../../domain/value-object/workspace-goal-name.vo';
import { WorkspaceGoalNameTakenError } from '../../domain/workspace-goal.errors';
import {
  toWorkspaceGoal,
  toWorkspaceGoalRecord,
} from '../mapper/workspace-goal.mapper';

const UNIQUE_VIOLATION = 'P2002';
const ONE_NAME_PER_WORKSPACE_INDEX = 'workspace_goal_workspaceId_nameKey_key';

/**
 * Two Admins adding the same name at once both pass the use case's check; the unique index
 * refuses the second. With a driver adapter, Prisma names the violated index only deep inside
 * `meta`, in a shape it does not type, so the name is looked for in the whole of it — as
 * Feedback's request repository does.
 */
function isNameTaken(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== UNIQUE_VIOLATION
  ) {
    return false;
  }
  return JSON.stringify(error.meta ?? {}).includes(
    ONE_NAME_PER_WORKSPACE_INDEX,
  );
}

/** Writes through `client`, so a save inside a unit of work joins its transaction. */
@Injectable()
export class PrismaWorkspaceGoalRepository extends WorkspaceGoalRepository {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async findById(
    workspaceId: string,
    workspaceGoalId: string,
  ): Promise<WorkspaceGoal | null> {
    const record =
      await this.prismaTransactionContext.client.workspaceGoal.findFirst({
        where: { id: workspaceGoalId, workspaceId },
      });
    return record === null ? null : toWorkspaceGoal(record);
  }

  async existsWithName(
    workspaceId: string,
    name: WorkspaceGoalName,
  ): Promise<boolean> {
    const found =
      await this.prismaTransactionContext.client.workspaceGoal.findUnique({
        where: {
          workspaceId_nameKey: { workspaceId, nameKey: name.key() },
        },
        select: { id: true },
      });
    return found !== null;
  }

  async save(workspaceGoal: WorkspaceGoal): Promise<void> {
    const { id, status, ...created } = toWorkspaceGoalRecord(workspaceGoal);
    try {
      // Only the status ever changes after creation, so that is all an update writes.
      await this.prismaTransactionContext.client.workspaceGoal.upsert({
        where: { id },
        create: { id, status, ...created },
        update: { status },
      });
    } catch (error) {
      if (isNameTaken(error)) {
        throw new WorkspaceGoalNameTakenError();
      }
      throw error;
    }
  }
}
