import { HasProfilePort } from '@app/modules/identity';
import { Clock } from '@app/shared/application/clock.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { TeamSize } from '../../domain/value-object/team-size.vo';
import { WorkspaceName } from '../../domain/value-object/workspace-name.vo';
import { SessionWorkspace } from '../port/session-workspace.port';
import { WorkspaceFounding } from '../port/workspace-founding.port';
import { WorkspaceSwitching } from '../port/workspace-switching.port';
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

/**
 * The founder creates a Workspace and becomes its first Admin. Anyone may, as often as they like,
 * whatever Workspaces they are in already (brain `ADR-0034` decision 3); their session goes into
 * the new one.
 */
@Injectable()
export class CreateWorkspaceUseCase {
  constructor(
    private readonly workspaceFounding: WorkspaceFounding,
    private readonly workspaceSwitching: WorkspaceSwitching,
    private readonly sessionWorkspace: SessionWorkspace,
    private readonly hasProfilePort: HasProfilePort,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateWorkspaceInput): Promise<CreateWorkspaceResult> {
    const name = WorkspaceName.of(input.name);
    const teamSize =
      input.teamSize === null ? null : TeamSize.of(input.teamSize);

    if (!(await this.hasProfilePort.hasProfile(input.accountId))) {
      throw new ProfileRequiredError();
    }

    // Every click makes its own Workspace, so two tabs creating at once make two; nothing
    // needs serializing.
    const created = await this.unitOfWork.run(async () => {
      const founded = await this.workspaceFounding.found({
        credential: input.credential,
        name: name.toString(),
        teamSize: teamSize?.toString() ?? null,
      });
      await this.workspaceSwitching.switchTo({
        workspaceId: founded.workspaceId,
        accountId: input.accountId,
        switchedAt: this.clock.now(),
      });
      return { id: founded.workspaceId };
    });
    await this.sessionWorkspace.select(input.credential, created.id);
    return created;
  }
}
