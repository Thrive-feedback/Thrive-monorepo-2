import { WorkspaceMembershipPort } from '@app/modules/workspace';
import { Injectable } from '@nestjs/common';
import { WorkspaceGoalQuery } from '../query-port/workspace-goal.query-port';
import type {
  PageRequest,
  WorkspaceGoalPage,
} from '../types/workspace-goal.types';

export interface ListWorkspaceGoalsInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always. */
  readonly accountId: string;
  readonly page: PageRequest;
}

/**
 * A query: the Workspace's Workspace Goals, as Settings lists them. Admins, who hide and show
 * them, are answered the hidden ones too; every other Member only the active ones (`ADR-0036`).
 */
@Injectable()
export class ListWorkspaceGoalsUseCase {
  constructor(
    private readonly workspaceGoalQuery: WorkspaceGoalQuery,
    private readonly workspaceMembershipPort: WorkspaceMembershipPort,
  ) {}

  async execute(input: ListWorkspaceGoalsInput): Promise<WorkspaceGoalPage> {
    const includeHidden = await this.workspaceMembershipPort.isAdminOf({
      workspaceId: input.workspaceId,
      accountId: input.accountId,
    });
    return this.workspaceGoalQuery.listInWorkspace(
      input.workspaceId,
      { includeHidden },
      input.page,
    );
  }
}
