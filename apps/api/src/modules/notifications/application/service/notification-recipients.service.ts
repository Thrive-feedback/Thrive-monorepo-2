import { WorkspaceMembershipPort } from '@app/modules/workspace';
import { Injectable } from '@nestjs/common';

/**
 * Who actually gets told about one event, decided once rather than at each call site.
 *
 * Three rules live here, and each is a bug waiting to happen if it lives anywhere else:
 *
 * - **Nobody is told about their own action.** The person who asked is not told they asked.
 * - **One person, one notification.** Somebody who is both the Receiver of a piece of Feedback
 *   and named under *Selected people* is told once, not twice (#215 AC 5).
 * - **A Deactivated Member is never told** (`ADR-0047`, design 0021 D7). Somebody removed from
 *   the Workspace's life should not have a notification about its Feedback be the one thing
 *   still reaching them.
 *
 * It sits above the split between the bell and a chat tool, so both inherit all three rather
 * than each remembering them.
 */
@Injectable()
export class NotificationRecipients {
  constructor(
    private readonly workspaceMembershipPort: WorkspaceMembershipPort,
  ) {}

  /**
   * One read of Workspace however many people are named (`BE_06` R9). `membersAmong` already
   * answers **active** Members only — `membershipInWorkspace` filters `deactivatedAt: null`
   * (`ADR-0047`) — so there is no separate liveness check to forget.
   */
  async of(event: {
    readonly workspaceId: string;
    readonly actorAccountId: string;
    readonly candidates: readonly string[];
  }): Promise<readonly string[]> {
    const wanted = [...new Set(event.candidates)].filter(
      (accountId) => accountId !== event.actorAccountId,
    );
    if (wanted.length === 0) {
      return [];
    }
    const active = new Set(
      await this.workspaceMembershipPort.membersAmong({
        workspaceId: event.workspaceId,
        accountIds: wanted,
      }),
    );
    return wanted.filter((accountId) => active.has(accountId));
  }
}
