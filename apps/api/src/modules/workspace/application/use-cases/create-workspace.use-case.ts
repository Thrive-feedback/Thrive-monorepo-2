import { HasProfilePort } from '@app/modules/identity';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { TeamSize } from '../../domain/value-object/team-size.vo';
import { WorkspaceName } from '../../domain/value-object/workspace-name.vo';
import { WorkspaceFounding } from '../port/workspace-founding.port';
import { ProfileRequiredError } from '../workspace.errors';

export interface CreateWorkspaceInput {
  readonly accountId: string;
  /** The founder's `cookie` header, passed through to the store untouched. */
  readonly credential: string;
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
    private readonly workspaceFounding: WorkspaceFounding,
    private readonly hasProfilePort: HasProfilePort,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: CreateWorkspaceInput): Promise<CreateWorkspaceResult> {
    const name = WorkspaceName.of(input.name);
    const teamSize =
      input.teamSize === null ? null : TeamSize.of(input.teamSize);

    if (!(await this.hasProfilePort.hasProfile(input.accountId))) {
      throw new ProfileRequiredError();
    }

    // Serialized per Account: the store checks the one-Workspace limit before it writes, so
    // two tabs creating at once would both pass it. The second waits here until the first
    // has stored its Workspace, and is then refused by that limit.
    return this.unitOfWork.run(
      async () => {
        const founded = await this.workspaceFounding.found({
          credential: input.credential,
          name: name.toString(),
          teamSize: teamSize?.toString() ?? null,
        });
        return { id: founded.workspaceId };
      },
      { serializeOn: `workspace-founder:${input.accountId}` },
    );
  }
}
