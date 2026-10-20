import type { WorkspaceGoal as WorkspaceGoalRecord } from '@app/infrastructure/database/generated/client';
import type { WorkspaceGoalView } from '../../application/types/workspace-goal.types';
import { WorkspaceGoal } from '../../domain/entity/workspace-goal.entity';
import { WorkspaceGoalDescription } from '../../domain/value-object/workspace-goal-description.vo';
import { WorkspaceGoalName } from '../../domain/value-object/workspace-goal-name.vo';
import { WorkspaceGoalStatus } from '../../domain/value-object/workspace-goal-status.vo';

/** The only place that knows both the stored row and the Workspace Goal entity. */

/** The audit timestamps are the database's to set. */
export function toWorkspaceGoalRecord(
  workspaceGoal: WorkspaceGoal,
): Omit<WorkspaceGoalRecord, 'createdAt' | 'updatedAt'> {
  const snapshot = workspaceGoal.snapshot();
  return {
    id: snapshot.id,
    workspaceId: snapshot.workspaceId,
    name: snapshot.name,
    nameKey: snapshot.nameKey,
    description: snapshot.description,
    status: snapshot.status,
  };
}

export function toWorkspaceGoal(record: WorkspaceGoalRecord): WorkspaceGoal {
  return WorkspaceGoal.restore({
    id: record.id,
    workspaceId: record.workspaceId,
    name: WorkspaceGoalName.of(record.name),
    description:
      record.description === null
        ? null
        : WorkspaceGoalDescription.of(record.description),
    status: WorkspaceGoalStatus.of(record.status),
  });
}

export function toWorkspaceGoalView(
  record: Pick<WorkspaceGoalRecord, 'id' | 'name' | 'description' | 'status'>,
): WorkspaceGoalView {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    status: record.status,
  };
}
