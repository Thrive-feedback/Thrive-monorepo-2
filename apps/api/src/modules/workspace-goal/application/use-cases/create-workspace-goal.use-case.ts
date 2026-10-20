import { WorkspaceMembershipPort } from '@app/modules/workspace';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { WorkspaceGoal } from '../../domain/entity/workspace-goal.entity';
import { WorkspaceGoalRepository } from '../../domain/repository/workspace-goal-repository.port';
import { WorkspaceGoalDescription } from '../../domain/value-object/workspace-goal-description.vo';
import { WorkspaceGoalName } from '../../domain/value-object/workspace-goal-name.vo';
import { WorkspaceGoalNameTakenError } from '../../domain/workspace-goal.errors';
import { NotAllowedToManageWorkspaceGoalsError } from '../workspace-goal.errors';

export interface CreateWorkspaceGoalInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always. */
  readonly accountId: string;
  readonly name: string;
  readonly description?: string;
}

export interface CreateWorkspaceGoalResult {
  readonly id: string;
}

/**
 * An Admin adds a Workspace Goal, active at once. A name the Workspace already has — in any
 * letter case, shown or hidden — is refused: the Admin shows the hidden one again instead.
 */
@Injectable()
export class CreateWorkspaceGoalUseCase {
  constructor(
    private readonly workspaceGoalRepository: WorkspaceGoalRepository,
    private readonly workspaceMembershipPort: WorkspaceMembershipPort,
    private readonly idGenerator: IdGenerator,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    input: CreateWorkspaceGoalInput,
  ): Promise<CreateWorkspaceGoalResult> {
    const isAdmin = await this.workspaceMembershipPort.isAdminOf({
      workspaceId: input.workspaceId,
      accountId: input.accountId,
    });
    if (!isAdmin) {
      throw new NotAllowedToManageWorkspaceGoalsError();
    }
    const name = WorkspaceGoalName.of(input.name);
    const description =
      input.description === undefined
        ? null
        : WorkspaceGoalDescription.of(input.description);
    const workspaceGoal = WorkspaceGoal.create({
      id: this.idGenerator.next(),
      workspaceId: input.workspaceId,
      name,
      description,
    });

    await this.unitOfWork.run(async () => {
      if (
        await this.workspaceGoalRepository.existsWithName(
          input.workspaceId,
          name,
        )
      ) {
        throw new WorkspaceGoalNameTakenError();
      }
      await this.workspaceGoalRepository.save(workspaceGoal);
    });
    return { id: workspaceGoal.snapshot().id };
  }
}
