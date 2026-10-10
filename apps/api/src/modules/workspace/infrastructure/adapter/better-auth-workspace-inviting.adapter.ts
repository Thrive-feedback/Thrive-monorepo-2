import { AUTH, type Auth } from '@app/infrastructure/auth/auth';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { APIError } from 'better-auth';
import {
  type InvitationAcceptance,
  type InvitationRequest,
  type InvitationRevocation,
  type InvitationStored,
  WorkspaceInviting,
} from '../../application/port/workspace-inviting.port';

function requestHeaders(credential: string): Headers {
  return new Headers(credential ? { cookie: credential } : {});
}

/**
 * Stores Invitations through Better Auth's organization plugin, on the inviter's own session,
 * so the plugin checks they may invite and that the address is not already in or invited. Its
 * own invitation email is never configured: the use case sends ours. Accepting runs on the
 * invited person's session, so the plugin also makes the Workspace their active one.
 */
@Injectable()
export class BetterAuthWorkspaceInvitingAdapter extends WorkspaceInviting {
  private readonly logger = new Logger(BetterAuthWorkspaceInvitingAdapter.name);

  constructor(@Inject(AUTH) private readonly auth: Auth) {
    super();
  }

  async invite(request: InvitationRequest): Promise<InvitationStored> {
    try {
      const invitation = await this.auth.api.createInvitation({
        body: {
          email: request.email,
          // Everyone invited joins with no management rights; Roles change afterwards.
          role: 'member',
          organizationId: request.workspaceId,
        },
        headers: requestHeaders(request.credential),
      });
      return {
        outcome: 'invited',
        invitationId: invitation.id,
        expiresAt: new Date(invitation.expiresAt),
      };
    } catch (error) {
      if (
        this.isRefusedWith(
          error,
          'USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION',
        )
      ) {
        return { outcome: 'already_member' };
      }
      if (
        this.isRefusedWith(
          error,
          'USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION',
        )
      ) {
        return { outcome: 'already_invited' };
      }
      throw error;
    }
  }

  async accept(acceptance: InvitationAcceptance): Promise<void> {
    await this.auth.api.acceptInvitation({
      body: { invitationId: acceptance.invitationId },
      headers: requestHeaders(acceptance.credential),
    });
  }

  async revoke(revocation: InvitationRevocation): Promise<void> {
    try {
      await this.auth.api.cancelInvitation({
        body: { invitationId: revocation.invitationId },
        headers: requestHeaders(revocation.credential),
      });
    } catch (error) {
      // Sending answers an address `failed` whether or not its revoke lands, so this is the one
      // record that an Invitation whose email never went out is still Pending.
      this.logger.warn({
        event: 'invitation.revoke_failed',
        invitationId: revocation.invitationId,
      });
      throw error;
    }
  }

  private isRefusedWith(
    error: unknown,
    code: keyof Auth['$ERROR_CODES'],
  ): boolean {
    return (
      error instanceof APIError &&
      error.body?.code === this.auth.$ERROR_CODES[code].code
    );
  }
}
