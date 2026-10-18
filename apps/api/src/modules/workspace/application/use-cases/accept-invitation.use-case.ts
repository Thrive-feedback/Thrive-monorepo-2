import { Clock } from '@app/shared/application/clock.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { InvitationRecipient } from '../../domain/value-object/invitation-recipient.vo';
import { InvitationStatus } from '../../domain/value-object/invitation-status.vo';
import { InvitationSettling } from '../port/invitation-settling.port';
import { MemberRejoining } from '../port/member-rejoining.port';
import { WorkspaceInviting } from '../port/workspace-inviting.port';
import { WorkspaceSwitching } from '../port/workspace-switching.port';
import { InvitationQuery } from '../query-port/invitation.query-port';
import { MembershipQuery } from '../query-port/membership.query-port';
import type { InvitationDetailView } from '../types/invitation.types';
import { InvitationNotFoundError } from '../workspace.errors';

export interface AcceptInvitationInput {
  readonly accountId: string;
  /** The address the person is signed in with, which must be the one invited. */
  readonly accountEmail: string;
  /** The invited person's `cookie` header, passed through to the store untouched. */
  readonly credential: string;
  readonly invitationId: string;
}

/**
 * The invited person accepts, and joins the Workspace with the Role the Invitation names; their
 * other Workspaces stay as they were (brain `ADR-0034` decision 1). Someone Deactivated there
 * comes back as themselves instead (decision 8). Either way it becomes the Workspace they are in.
 * Accepting again once they are in changes nothing, so a second click or a reload is harmless.
 */
@Injectable()
export class AcceptInvitationUseCase {
  constructor(
    private readonly workspaceInviting: WorkspaceInviting,
    private readonly memberRejoining: MemberRejoining,
    private readonly invitationSettling: InvitationSettling,
    private readonly workspaceSwitching: WorkspaceSwitching,
    private readonly invitationQuery: InvitationQuery,
    private readonly membershipQuery: MembershipQuery,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(input: AcceptInvitationInput): Promise<void> {
    // Read once to learn the Workspace, which an Invitation never changes, and again under that
    // Workspace's lock: accepting writes `member` there, as Deactivating, Reactivating and
    // changing a Role do, so it takes their key and never interleaves with them. Two tabs
    // accepting the same Invitation meet on the same key too.
    const workspaceId = (await this.invitationFor(input)).workspace.id;
    await this.unitOfWork.run(
      async () => {
        const invitation = await this.invitationFor(input);
        InvitationRecipient.of(invitation.email).ensureIs(input.accountEmail);

        const alreadyHere = await this.membershipQuery.membershipInWorkspace(
          input.accountId,
          workspaceId,
        );
        if (alreadyHere) {
          // Back by another way, such as an Admin's Reactivate: the Invitation has nothing left
          // to do, so it stops waiting.
          await this.invitationSettling.settleAccepted(input.invitationId);
          return;
        }
        InvitationStatus.of(invitation.status).ensureAcceptable();

        if (
          await this.membershipQuery.isDeactivatedIn(
            input.accountId,
            workspaceId,
          )
        ) {
          await this.memberRejoining.rejoin({
            invitationId: input.invitationId,
            workspaceId,
            accountId: input.accountId,
            role: invitation.role,
          });
        } else {
          await this.workspaceInviting.accept({
            credential: input.credential,
            invitationId: input.invitationId,
          });
        }
        await this.workspaceSwitching.switchTo({
          workspaceId,
          accountId: input.accountId,
          switchedAt: this.clock.now(),
        });
      },
      { serializeOn: `workspace-roles:${workspaceId}` },
    );
  }

  private async invitationFor(
    input: AcceptInvitationInput,
  ): Promise<InvitationDetailView> {
    const invitation = await this.invitationQuery.invitationById(
      input.invitationId,
      this.clock.now(),
    );
    if (!invitation) {
      throw new InvitationNotFoundError();
    }
    return invitation;
  }
}
