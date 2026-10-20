import { Injectable } from '@nestjs/common';
import {
  type ActiveWorkspaceGoal,
  ActiveWorkspaceGoalPort,
} from '../../domain/port/active-workspace-goal.port';
import { FindActiveWorkspaceGoalsUseCase } from '../use-cases/find-active-workspace-goals.use-case';

/** Answers every port Workspace Goal publishes, each by delegating to a use case. */
@Injectable()
export class WorkspaceGoalAdapter implements ActiveWorkspaceGoalPort {
  constructor(
    private readonly findActiveWorkspaceGoalsUseCase: FindActiveWorkspaceGoalsUseCase,
  ) {}

  activeAmong(query: {
    readonly workspaceId: string;
    readonly names: readonly string[];
  }): Promise<ActiveWorkspaceGoal[]> {
    return this.findActiveWorkspaceGoalsUseCase.execute(query);
  }
}
