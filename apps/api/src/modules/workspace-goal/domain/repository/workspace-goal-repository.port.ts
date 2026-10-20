import type { WorkspaceGoal } from '../entity/workspace-goal.entity';
import type { WorkspaceGoalName } from '../value-object/workspace-goal-name.vo';

export abstract class WorkspaceGoalRepository {
  /** `null` when there is none with this id in this Workspace — another's is never found. */
  abstract findById(
    workspaceId: string,
    workspaceGoalId: string,
  ): Promise<WorkspaceGoal | null>;

  /** Whether the Workspace already has one by this name, ignoring letter case, active or hidden. */
  abstract existsWithName(
    workspaceId: string,
    name: WorkspaceGoalName,
  ): Promise<boolean>;

  /**
   * Stores a new one, or its new status. A new one whose name was taken in the meantime is
   * refused by the store's unique index, and surfaces as the domain's "already taken".
   */
  abstract save(workspaceGoal: WorkspaceGoal): Promise<void>;
}
