import { Injectable } from '@nestjs/common';
import { WorkspaceGoalName } from '../../domain/value-object/workspace-goal-name.vo';
import { WorkspaceGoalQuery } from '../query-port/workspace-goal.query-port';
import type { ActiveWorkspaceGoalView } from '../types/workspace-goal.types';

export interface FindActiveWorkspaceGoalsInput {
  readonly workspaceId: string;
  /** As written after the `#`, in any letter case. */
  readonly names: readonly string[];
}

/**
 * A query: the active Workspace Goals that some written names stand for. A name no Workspace Goal
 * could ever have is not looked up at all.
 */
@Injectable()
export class FindActiveWorkspaceGoalsUseCase {
  constructor(private readonly workspaceGoalQuery: WorkspaceGoalQuery) {}

  execute(
    input: FindActiveWorkspaceGoalsInput,
  ): Promise<ActiveWorkspaceGoalView[]> {
    const nameKeys = [
      ...new Set(
        input.names.flatMap((name) => WorkspaceGoalName.keyOf(name) ?? []),
      ),
    ];
    return this.workspaceGoalQuery.activeWithKeys(input.workspaceId, nameKeys);
  }
}
