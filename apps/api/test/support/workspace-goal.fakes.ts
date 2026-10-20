import { WorkspaceGoalQuery } from '@app/modules/workspace-goal/application/query-port/workspace-goal.query-port';
import type {
  PageRequest,
  WorkspaceGoalPage,
} from '@app/modules/workspace-goal/application/types/workspace-goal.types';
import type { WorkspaceGoal } from '@app/modules/workspace-goal/domain/entity/workspace-goal.entity';
import { WorkspaceGoalRepository } from '@app/modules/workspace-goal/domain/repository/workspace-goal-repository.port';
import type { WorkspaceGoalName } from '@app/modules/workspace-goal/domain/value-object/workspace-goal-name.vo';

/** Keeps the Workspace Goals saved, so a test can read back what a use case stored. */
export class FakeWorkspaceGoalRepository extends WorkspaceGoalRepository {
  private readonly stored = new Map<string, WorkspaceGoal>();

  with(...workspaceGoals: WorkspaceGoal[]): this {
    for (const workspaceGoal of workspaceGoals) {
      this.stored.set(workspaceGoal.snapshot().id, workspaceGoal);
    }
    return this;
  }

  saved(id: string): WorkspaceGoal | undefined {
    return this.stored.get(id);
  }

  get count(): number {
    return this.stored.size;
  }

  async findById(
    workspaceId: string,
    workspaceGoalId: string,
  ): Promise<WorkspaceGoal | null> {
    const found = this.stored.get(workspaceGoalId);
    return found?.snapshot().workspaceId === workspaceId ? found : null;
  }

  async existsWithName(
    workspaceId: string,
    name: WorkspaceGoalName,
  ): Promise<boolean> {
    return [...this.stored.values()].some((workspaceGoal) => {
      const snapshot = workspaceGoal.snapshot();
      return (
        snapshot.workspaceId === workspaceId && snapshot.nameKey === name.key()
      );
    });
  }

  async save(workspaceGoal: WorkspaceGoal): Promise<void> {
    this.stored.set(workspaceGoal.snapshot().id, workspaceGoal);
  }
}

/** Answers the page it was given, and records whether hidden ones were asked for. */
export class FakeWorkspaceGoalQuery extends WorkspaceGoalQuery {
  readonly asked: { workspaceId: string; includeHidden: boolean }[] = [];

  constructor(
    private readonly page: WorkspaceGoalPage = { items: [], total: 0 },
  ) {
    super();
  }

  async listInWorkspace(
    workspaceId: string,
    options: { readonly includeHidden: boolean },
    _page: PageRequest,
  ): Promise<WorkspaceGoalPage> {
    this.asked.push({ workspaceId, includeHidden: options.includeHidden });
    return this.page;
  }
}
