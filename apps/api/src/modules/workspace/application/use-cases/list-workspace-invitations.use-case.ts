import { AccountSummaryPort } from '@app/modules/identity';
import { Clock } from '@app/shared/application/clock.port';
import { Injectable } from '@nestjs/common';
import { MemberRole } from '../../domain/value-object/member-role.vo';
import { InvitationQuery } from '../query-port/invitation.query-port';
import type { InvitationView } from '../types/invitation.types';
import type { MembershipView, PageRequest } from '../types/membership.types';
import { NotAllowedToSeeInvitationsError } from '../workspace.errors';

export interface ListWorkspaceInvitationsInput {
  readonly membership: MembershipView;
  readonly page: PageRequest;
}

export interface WorkspaceInvitation
  extends Omit<InvitationView, 'inviterAccountId'> {
  /** Who sent it, as the Members screen names them. */
  readonly invitedBy: {
    readonly email: string;
    /** `null` while they have not introduced themselves. */
    readonly displayName: string | null;
  };
}

export interface WorkspaceInvitationList {
  readonly items: readonly WorkspaceInvitation[];
  readonly total: number;
}

/**
 * A query: the Invitations in the caller's Workspace still waiting on someone, pending or past
 * their 7 days, each with who sent it. Only those who can invite may see them.
 */
@Injectable()
export class ListWorkspaceInvitationsUseCase {
  constructor(
    private readonly invitationQuery: InvitationQuery,
    private readonly accountSummaryPort: AccountSummaryPort,
    private readonly clock: Clock,
  ) {}

  async execute(
    input: ListWorkspaceInvitationsInput,
  ): Promise<WorkspaceInvitationList> {
    if (!MemberRole.of(input.membership.role).mayInvite()) {
      throw new NotAllowedToSeeInvitationsError();
    }
    const invitations = await this.invitationQuery.openInvitationsOfWorkspace(
      input.membership.workspace.id,
      this.clock.now(),
      input.page,
    );
    const inviterIds = [
      ...new Set(invitations.items.map((i) => i.inviterAccountId)),
    ];
    const inviters = new Map(
      (await this.accountSummaryPort.summariesOf(inviterIds)).map((summary) => [
        summary.accountId,
        summary,
      ]),
    );
    return {
      items: invitations.items.flatMap(
        ({ inviterAccountId, ...invitation }) => {
          const inviter = inviters.get(inviterAccountId);
          // An inviter's Account takes their Invitations with it, so a missing one was deleted
          // mid-read.
          return inviter
            ? [
                {
                  ...invitation,
                  invitedBy: {
                    email: inviter.email,
                    displayName: inviter.displayName,
                  },
                },
              ]
            : [];
        },
      ),
      total: invitations.total,
    };
  }
}
