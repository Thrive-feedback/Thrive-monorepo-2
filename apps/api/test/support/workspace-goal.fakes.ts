import { WorkspaceGoalQuery } from '@app/modules/workspace-goal/application/query-port/workspace-goal.query-port';
import type {
  ActiveWorkspaceGoalView,
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

/**
 * Answers the page it was given, and the active Workspace Goals it was given whose key is asked
 * for. Records what was asked, so a test can see a name was never looked up.
 */
export class FakeWorkspaceGoalQuery extends WorkspaceGoalQuery {
  readonly asked: { workspaceId: string; includeHidden: boolean }[] = [];
  readonly keysAsked: { workspaceId: string; nameKeys: string[] }[] = [];

  constructor(
    private readonly page: WorkspaceGoalPage = { items: [], total: 0 },
    private readonly active: readonly ActiveWorkspaceGoalView[] = [],
  ) {
    super();
  }

  async activeWithKeys(
    workspaceId: string,
    nameKeys: readonly string[],
  ): Promise<ActiveWorkspaceGoalView[]> {
    this.keysAsked.push({ workspaceId, nameKeys: [...nameKeys] });
    return this.active.filter((workspaceGoal) =>
      nameKeys.includes(workspaceGoal.name.toLowerCase()),
    );
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
