import { Clock } from '@app/shared/application/clock.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { SessionWorkspace } from '../port/session-workspace.port';
import { WorkspaceSwitching } from '../port/workspace-switching.port';
import type { MembershipView } from '../types/membership.types';

export interface SwitchWorkspaceInput {
  readonly accountId: string;
  /** The caller's `cookie` header: the session that goes into the Workspace. */
  readonly credential: string;
  /** The caller's membership of the Workspace they switch to; only an active one exists. */
  readonly membership: MembershipView;
}

/**
 * The caller's session goes into one of their Workspaces — after sign-in, or switching away from
 * another — and every page in that session acts on it. Other devices' sessions stay where they
 * are. It also becomes the one listed first, as used last.
 */
@Injectable()
export class SwitchWorkspaceUseCase {
  constructor(
    private readonly workspaceSwitching: WorkspaceSwitching,
    private readonly sessionWorkspace: SessionWorkspace,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(input: SwitchWorkspaceInput): Promise<void> {
    const workspaceId = input.membership.workspace.id;
    await this.unitOfWork.run(() =>
      this.workspaceSwitching.switchTo({
        workspaceId,
        accountId: input.accountId,
        switchedAt: this.clock.now(),
      }),
    );
    await this.sessionWorkspace.select(input.credential, workspaceId);
  }
}
