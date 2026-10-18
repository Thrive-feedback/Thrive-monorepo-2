import { Clock } from '@app/shared/application/clock.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { WorkspaceSwitching } from '../port/workspace-switching.port';
import type { MembershipView } from '../types/membership.types';

export interface SwitchWorkspaceInput {
  readonly accountId: string;
  /** The caller's membership of the Workspace they switch to; only an active one exists. */
  readonly membership: MembershipView;
}

/**
 * The caller moves to another of their Workspaces. It becomes the last used, so every page and
 * every device opens it until they switch again (brain `ADR-0034` decision 2).
 */
@Injectable()
export class SwitchWorkspaceUseCase {
  constructor(
    private readonly workspaceSwitching: WorkspaceSwitching,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(input: SwitchWorkspaceInput): Promise<void> {
    await this.unitOfWork.run(() =>
      this.workspaceSwitching.switchTo({
        workspaceId: input.membership.workspace.id,
        accountId: input.accountId,
        switchedAt: this.clock.now(),
      }),
    );
  }
}
