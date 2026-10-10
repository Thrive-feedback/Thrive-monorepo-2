import { Clock } from '@app/shared/application/clock.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { InvitationRecipient } from '../../domain/value-object/invitation-recipient.vo';
import { InvitationStatus } from '../../domain/value-object/invitation-status.vo';
import { WorkspaceInviting } from '../port/workspace-inviting.port';
import { InvitationQuery } from '../query-port/invitation.query-port';
import { MembershipQuery } from '../query-port/membership.query-port';
import {
  AlreadyInAWorkspaceError,
  InvitationNotFoundError,
} from '../workspace.errors';

export interface AcceptInvitationInput {
  readonly accountId: string;
  /** The address the person is signed in with, which must be the one invited. */
  readonly accountEmail: string;
  /** The invited person's `cookie` header, passed through to the store untouched. */
  readonly credential: string;
  readonly invitationId: string;
}

/**
 * The invited person accepts, and joins the Workspace with the Role the Invitation names.
 * Accepting again once they are in changes nothing, so a second click or a reload is harmless.
 */
@Injectable()
export class AcceptInvitationUseCase {
  constructor(
    private readonly workspaceInviting: WorkspaceInviting,
    private readonly invitationQuery: InvitationQuery,
    private readonly membershipQuery: MembershipQuery,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(input: AcceptInvitationInput): Promise<void> {
    // Serialized per Account on the same key as creating a Workspace: both check "in a
    // Workspace yet?" before the store writes, so two tabs could otherwise both pass and
    // leave the Account in two.
    await this.unitOfWork.run(
      async () => {
        const invitation = await this.invitationQuery.invitationById(
          input.invitationId,
          this.clock.now(),
        );
        if (!invitation) {
          throw new InvitationNotFoundError();
        }
        InvitationRecipient.of(invitation.email).ensureIs(input.accountEmail);

        const alreadyHere = await this.membershipQuery.membershipInWorkspace(
          input.accountId,
          invitation.workspace.id,
        );
        if (alreadyHere) {
          return;
        }
        InvitationStatus.of(invitation.status).ensureAcceptable();

        const memberships = await this.membershipQuery.membershipsOfAccount(
          input.accountId,
          { page: 1, pageSize: 1 },
        );
        if (memberships.total > 0) {
          throw new AlreadyInAWorkspaceError();
        }

        await this.workspaceInviting.accept({
          credential: input.credential,
          invitationId: input.invitationId,
        });
      },
      { serializeOn: `account-workspace:${input.accountId}` },
    );
  }
}
