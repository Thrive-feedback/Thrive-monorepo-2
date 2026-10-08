import { HasProfilePort } from '@app/modules/identity';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { Workspace } from '../../domain/entity/workspace.entity';
import { WorkspaceRepository } from '../../domain/repository/workspace-repository.port';
import { TeamSize } from '../../domain/value-object/team-size.vo';
import { WorkspaceName } from '../../domain/value-object/workspace-name.vo';
import {
  AlreadyInAWorkspaceError,
  ProfileRequiredError,
} from '../workspace.errors';

export interface CreateWorkspaceInput {
  readonly accountId: string;
  readonly name: string;
  readonly teamSize: string | null;
}

export interface CreateWorkspaceResult {
  readonly id: string;
}

/** The founder creates their company's Workspace and becomes its only Owner. */
@Injectable()
export class CreateWorkspaceUseCase {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly hasProfilePort: HasProfilePort,
    private readonly unitOfWork: UnitOfWork,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: CreateWorkspaceInput): Promise<CreateWorkspaceResult> {
    const name = WorkspaceName.of(input.name);
    const teamSize =
      input.teamSize === null ? null : TeamSize.of(input.teamSize);

    if (!(await this.hasProfilePort.hasProfile(input.accountId))) {
      throw new ProfileRequiredError();
    }

    // Serialized per Account: two tabs creating at once would both pass the membership
    // check, so the second waits for the first to commit and then sees its Workspace.
    return this.unitOfWork.run(
      async () => {
        if (
          (await this.workspaceRepository.findByMemberAccount(
            input.accountId,
          )) !== null
        ) {
          throw new AlreadyInAWorkspaceError();
        }
        const workspace = Workspace.found({
          id: this.idGenerator.next(),
          name,
          teamSize,
          founder: {
            memberId: this.idGenerator.next(),
            accountId: input.accountId,
          },
        });
        await this.workspaceRepository.save(workspace);
        return { id: workspace.snapshot().id };
      },
      { serializeOn: `workspace-founder:${input.accountId}` },
    );
  }
}
