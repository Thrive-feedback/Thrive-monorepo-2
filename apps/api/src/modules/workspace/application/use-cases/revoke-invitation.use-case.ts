import { Clock } from '@app/shared/application/clock.port';
import { Injectable } from '@nestjs/common';
import { InvitationStatus } from '../../domain/value-object/invitation-status.vo';
import { MemberRole } from '../../domain/value-object/member-role.vo';
import { WorkspaceInviting } from '../port/workspace-inviting.port';
import { InvitationQuery } from '../query-port/invitation.query-port';
import type { MembershipView } from '../types/membership.types';
import {
  InvitationNotFoundError,
  NotAllowedToRevokeInvitationsError,
} from '../workspace.errors';

export interface RevokeInvitationInput {
  /** The revoker's `cookie` header, passed through to the store untouched. */
  readonly credential: string;
  readonly membership: MembershipView;
  readonly invitationId: string;
}

/**
 * The Owner or an Admin revokes an Invitation to their Workspace, so its link stops working.
 * It stays on record as revoked; only an open one can be.
 */
@Injectable()
export class RevokeInvitationUseCase {
  constructor(
    private readonly workspaceInviting: WorkspaceInviting,
    private readonly invitationQuery: InvitationQuery,
    private readonly clock: Clock,
  ) {}

  async execute(input: RevokeInvitationInput): Promise<void> {
    if (!MemberRole.of(input.membership.role).mayInvite()) {
      throw new NotAllowedToRevokeInvitationsError();
    }
    const invitation = await this.invitationQuery.invitationById(
      input.invitationId,
      this.clock.now(),
    );
    // One answer for absent and for another Workspace's, as with the Workspace itself.
    if (
      !invitation ||
      invitation.workspace.id !== input.membership.workspace.id
    ) {
      throw new InvitationNotFoundError();
    }
    InvitationStatus.of(invitation.status).ensureRevocable();

    await this.workspaceInviting.revoke({
      credential: input.credential,
      invitationId: input.invitationId,
    });
  }
}
