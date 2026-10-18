import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import {
  type WorkspaceSwitch,
  WorkspaceSwitching,
} from '../../application/port/workspace-switching.port';

/**
 * Stamps `lastUsedAt` on the `member` row, which the plugin knows nothing of (ADR 0049). Writes
 * through `client`, so it joins the use case's unit of work and rolls back with it.
 */
@Injectable()
export class PrismaWorkspaceSwitchingAdapter extends WorkspaceSwitching {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async switchTo(workspaceSwitch: WorkspaceSwitch): Promise<void> {
    // A Member Deactivated since the caller checked is left alone: their row is not the
    // current Workspace for anyone, whatever it says.
    await this.prismaTransactionContext.client.member.updateMany({
      where: {
        workspaceId: workspaceSwitch.workspaceId,
        userId: workspaceSwitch.accountId,
        deactivatedAt: null,
      },
      data: { lastUsedAt: workspaceSwitch.switchedAt },
    });
  }
}
