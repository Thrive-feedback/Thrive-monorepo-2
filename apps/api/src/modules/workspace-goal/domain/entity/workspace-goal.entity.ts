import type { WorkspaceGoalDescription } from '../value-object/workspace-goal-description.vo';
import { WorkspaceGoalName } from '../value-object/workspace-goal-name.vo';
import {
  WorkspaceGoalStatus,
  type WorkspaceGoalStatusValue,
} from '../value-object/workspace-goal-status.vo';

export interface WorkspaceGoalSnapshot {
  readonly id: string;
  readonly workspaceId: string;
  readonly name: string;
  /** The name with letter case folded away, which no two Workspace Goals of one Workspace share. */
  readonly nameKey: string;
  readonly description: string | null;
  readonly status: WorkspaceGoalStatusValue;
}

/**
 * A hashtag an Admin creates for the whole Workspace (glossary: Workspace Goal). Its name and
 * description are fixed once created: it is never renamed and never deleted, only hidden and
 * shown again, so Feedback that used it always reads what was written (`ADR-0036`). Who may
 * create, hide or show one is the use case's question; this holds what may happen to it.
 */
export class WorkspaceGoal {
  private constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private readonly name: WorkspaceGoalName,
    private readonly description: WorkspaceGoalDescription | null,
    private status: WorkspaceGoalStatus,
  ) {}

  /** A new one is active, so every Member can use it straight away. */
  static create(details: {
    readonly id: string;
    readonly workspaceId: string;
    readonly name: WorkspaceGoalName;
    readonly description: WorkspaceGoalDescription | null;
  }): WorkspaceGoal {
    return new WorkspaceGoal(
      details.id,
      details.workspaceId,
      details.name,
      details.description,
      WorkspaceGoalStatus.Active,
    );
  }

  /** Rebuilds one already stored; only the repository calls this. */
  static restore(details: {
    readonly id: string;
    readonly workspaceId: string;
    readonly name: WorkspaceGoalName;
    readonly description: WorkspaceGoalDescription | null;
    readonly status: WorkspaceGoalStatus;
  }): WorkspaceGoal {
    return new WorkspaceGoal(
      details.id,
      details.workspaceId,
      details.name,
      details.description,
      details.status,
    );
  }

  /** Members stop seeing it and can no longer write it. Its name stays taken. */
  hide(): void {
    this.status = this.status.hide();
  }

  show(): void {
    this.status = this.status.show();
  }

  snapshot(): WorkspaceGoalSnapshot {
    return {
      id: this.id,
      workspaceId: this.workspaceId,
      name: this.name.toString(),
      nameKey: this.name.key(),
      description: this.description?.toString() ?? null,
      status: this.status.toString(),
    };
  }
}
