import { Clock } from '@app/shared/application/clock.port';
import { Injectable } from '@nestjs/common';
import { MemberRole } from '../../domain/value-object/member-role.vo';
import { InvitationQuery } from '../query-port/invitation.query-port';
import type { InvitationPage } from '../types/invitation.types';
import type { MembershipView, PageRequest } from '../types/membership.types';
import { NotAllowedToSeeInvitationsError } from '../workspace.errors';

export interface ListWorkspaceInvitationsInput {
  readonly membership: MembershipView;
  readonly page: PageRequest;
}

/**
 * A query: the Invitations in the caller's Workspace still waiting on someone, pending or past
 * their 7 days. Only those who can invite may see them.
 */
@Injectable()
export class ListWorkspaceInvitationsUseCase {
  constructor(
    private readonly invitationQuery: InvitationQuery,
    private readonly clock: Clock,
  ) {}

  async execute(input: ListWorkspaceInvitationsInput): Promise<InvitationPage> {
    if (!MemberRole.of(input.membership.role).mayInvite()) {
      throw new NotAllowedToSeeInvitationsError();
    }
    return this.invitationQuery.openInvitationsOfWorkspace(
      input.membership.workspace.id,
      this.clock.now(),
      input.page,
    );
  }
}
