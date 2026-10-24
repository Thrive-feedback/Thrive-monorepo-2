import { Clock } from '@app/shared/application/clock.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { InvitationStatus } from '../../domain/value-object/invitation-status.vo';
import { MemberRole } from '../../domain/value-object/member-role.vo';
import { ResendCooldown } from '../../domain/value-object/resend-cooldown.vo';
import { WorkspaceInviting } from '../port/workspace-inviting.port';
import { InvitationQuery } from '../query-port/invitation.query-port';
import { InvitationDelivery } from '../service/invitation-delivery.service';
import { ReturningMembers } from '../service/returning-members.service';
import type { MembershipView } from '../types/membership.types';
import {
  AlreadyAMemberError,
  InvitationNotFoundError,
  NotAllowedToResendInvitationsError,
} from '../workspace.errors';

export interface ResendInvitationInput {
  readonly accountId: string;
  /** Replies to the resent Invitation go to whoever resent it. */
  readonly resenderEmail: string;
  /** The resender's `cookie` header, passed through to the store untouched. */
  readonly credential: string;
  readonly membership: MembershipView;
  readonly invitationId: string;
}

/** The Invitation now Pending: the same one, or a new one when it had expired. */
export interface InvitationResent {
  readonly invitationId: string;
  readonly expiresAt: Date;
}

/**
 * An Admin sends an Invitation's email again, good for another 7 days. A Pending
 * one is extended, so the link already sent keeps working; an expired one is replaced by a new
 * one, and only once its email has gone out is the expired one revoked.
 */
@Injectable()
export class ResendInvitationUseCase {
  constructor(
    private readonly workspaceInviting: WorkspaceInviting,
    private readonly invitationQuery: InvitationQuery,
    private readonly invitationDelivery: InvitationDelivery,
    private readonly returningMembers: ReturningMembers,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(input: ResendInvitationInput): Promise<InvitationResent> {
    if (!MemberRole.of(input.membership.role).mayInvite()) {
      throw new NotAllowedToResendInvitationsError();
    }
    const now = this.clock.now();
    const workspaceId = input.membership.workspace.id;

    // Everything from reading the Invitation to claiming this send is serialized with every
    // other send and resend in the Workspace: a second resend of the same Invitation waits here,
    // then meets the cooldown this one started, and a revoke made meanwhile is seen.
    const { invitation, reissued } = await this.unitOfWork.run(
      async () => {
        const invitation = await this.invitationQuery.invitationById(
          input.invitationId,
          now,
        );
        // One answer for absent and for another Workspace's, as with the Workspace itself.
        if (!invitation || invitation.workspace.id !== workspaceId) {
          throw new InvitationNotFoundError();
        }
        InvitationStatus.of(invitation.status).ensureResendable();
        ResendCooldown.since(invitation.lastSentAt).ensureOverAt(now);

        const request = {
          credential: input.credential,
          inviterAccountId: input.accountId,
          workspaceId,
          email: invitation.email,
          // Sent again with the Role it was first sent with; choosing another is revoking it
          // and inviting afresh.
          role: invitation.role,
        };
        const returning = await this.returningMembers.addressesAmong(
          workspaceId,
          [invitation.email],
        );
        const reissued = returning.has(invitation.email.toLowerCase())
          ? await this.workspaceInviting.reissueBack(request)
          : await this.workspaceInviting.reissue(request);
        if (reissued.outcome === 'already_member') {
          throw new AlreadyAMemberError();
        }
        await this.workspaceInviting.markSent(reissued.invitationId, now);
        return { invitation, reissued };
      },
      { serializeOn: `workspace-invitations:${workspaceId}` },
    );
    const replacesExpired = reissued.invitationId !== input.invitationId;

    const sender = { accountId: input.accountId, email: input.resenderEmail };
    try {
      await this.invitationDelivery.deliver(
        {
          invitationId: reissued.invitationId,
          email: invitation.email,
          expiresAt: reissued.expiresAt,
          workspaceName: input.membership.workspace.name,
          idempotencyKey: `${reissued.invitationId}:${now.toISOString()}`,
        },
        sender,
        await this.invitationDelivery.senderNameOf(sender),
      );
    } catch (error) {
      // The email never went out, so the list is put back as it was. Both steps are optional:
      // the resend fails either way, and the adapter logs a revoke that did not land.
      if (replacesExpired) {
        await this.workspaceInviting
          .revoke({
            credential: input.credential,
            invitationId: reissued.invitationId,
          })
          .catch(() => undefined);
      } else {
        await this.workspaceInviting
          .restoreSent(reissued.invitationId, {
            lastSentAt: invitation.lastSentAt,
            expiresAt: invitation.expiresAt,
          })
          .catch(() => undefined);
      }
      throw error;
    }

    if (replacesExpired) {
      // Optional: the new Invitation is out and is the one that counts. Failing the resend now
      // would report an email that was sent as unsent. The adapter logs the revoke that failed.
      await this.workspaceInviting
        .revoke({
          credential: input.credential,
          invitationId: input.invitationId,
        })
        .catch(() => undefined);
    }
    return {
      invitationId: reissued.invitationId,
      expiresAt: reissued.expiresAt,
    };
  }
}
