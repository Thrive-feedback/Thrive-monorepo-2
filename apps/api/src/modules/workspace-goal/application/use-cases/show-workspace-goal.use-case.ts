import { WorkspaceMembershipPort } from '@app/modules/workspace';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { WorkspaceGoalRepository } from '../../domain/repository/workspace-goal-repository.port';
import {
  NotAllowedToManageWorkspaceGoalsError,
  WorkspaceGoalNotFoundError,
} from '../workspace-goal.errors';

export interface ShowWorkspaceGoalInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always. */
  readonly accountId: string;
  readonly workspaceGoalId: string;
}

/**
 * An Admin shows a hidden Workspace Goal again, so every Member sees it and can write it.
 */
@Injectable()
export class ShowWorkspaceGoalUseCase {
  constructor(
    private readonly workspaceGoalRepository: WorkspaceGoalRepository,
    private readonly workspaceMembershipPort: WorkspaceMembershipPort,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: ShowWorkspaceGoalInput): Promise<void> {
    const isAdmin = await this.workspaceMembershipPort.isAdminOf({
      workspaceId: input.workspaceId,
      accountId: input.accountId,
    });
    if (!isAdmin) {
      throw new NotAllowedToManageWorkspaceGoalsError();
    }
    await this.unitOfWork.run(async () => {
      const workspaceGoal = await this.workspaceGoalRepository.findById(
        input.workspaceId,
        input.workspaceGoalId,
      );
      if (!workspaceGoal) {
        throw new WorkspaceGoalNotFoundError();
      }
      workspaceGoal.show();
      await this.workspaceGoalRepository.save(workspaceGoal);
    });
  }
}
