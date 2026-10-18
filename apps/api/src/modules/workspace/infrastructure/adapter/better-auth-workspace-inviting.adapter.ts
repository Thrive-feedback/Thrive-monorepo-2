import {
  AUTH,
  type Auth,
  INVITATION_LIFETIME_SECONDS,
} from '@app/infrastructure/auth/auth';
import { Clock } from '@app/shared/application/clock.port';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { APIError } from 'better-auth';
import {
  type InvitationAcceptance,
  type InvitationReissued,
  type InvitationRequest,
  type InvitationRevocation,
  type InvitationStored,
  WorkspaceInviting,
} from '../../application/port/workspace-inviting.port';
import { toStoredRole } from '../mapper/membership.mapper';

/** What this adapter reads of a stored Invitation, by the plugin's own field names. */
interface StoredInvitation {
  readonly id: string;
  readonly expiresAt: Date;
}

function requestHeaders(credential: string): Headers {
  return new Headers(credential ? { cookie: credential } : {});
}

/**
 * Stores Invitations through Better Auth's organization plugin, on the inviter's own session,
 * so the plugin checks they may invite and that the address is not already in or invited. Its
 * own invitation email is never configured: the use case sends ours. Accepting runs on the
 * invited person's session.
 *
 * Someone Deactivated in the Workspace keeps their `member` row (ADR 0047), which the plugin
 * counts as a Member, so it refuses to invite them. For them alone the Invitation is stored
 * through the plugin's adapter, which still owns the table, after the check for a Pending one
 * its route would have made (ADR 0050).
 */
@Injectable()
export class BetterAuthWorkspaceInvitingAdapter extends WorkspaceInviting {
  private readonly logger = new Logger(BetterAuthWorkspaceInvitingAdapter.name);

  constructor(
    @Inject(AUTH) private readonly auth: Auth,
    private readonly clock: Clock,
  ) {
    super();
  }

  async invite(request: InvitationRequest): Promise<InvitationStored> {
    try {
      const invitation = await this.auth.api.createInvitation({
        body: {
          email: request.email,
          // The plugin only lets an `admin` invite someone as one.
          role: toStoredRole(request.role),
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

  async reissue(request: InvitationRequest): Promise<InvitationReissued> {
    try {
      // `resend` extends a Pending one in place. The plugin does not count an expired one as
      // Pending, so for that address it stores a new Invitation instead.
      const invitation = await this.auth.api.createInvitation({
        body: {
          email: request.email,
          role: toStoredRole(request.role),
          organizationId: request.workspaceId,
          resend: true,
        },
        headers: requestHeaders(request.credential),
      });
      return {
        outcome: 'reissued',
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
      throw error;
    }
  }

  async markSent(invitationId: string, sentAt: Date): Promise<void> {
    // The plugin has no route that writes an Invitation's own fields, so this goes through its
    // adapter, which still owns the table.
    const { adapter } = await this.auth.$context;
    await adapter.update({
      model: 'invitation',
      where: [{ field: 'id', value: invitationId }],
      update: { lastSentAt: sentAt },
    });
  }

  async inviteBack(request: InvitationRequest): Promise<InvitationStored> {
    if (await this.pendingInvitationFor(request)) {
      return { outcome: 'already_invited' };
    }
    const invitation = await this.storeInvitation(request);
    return {
      outcome: 'invited',
      invitationId: invitation.id,
      expiresAt: invitation.expiresAt,
    };
  }

  /** As the plugin's resend does: a Pending one is extended in place, otherwise one is stored. */
  async reissueBack(request: InvitationRequest): Promise<InvitationReissued> {
    const pending = await this.pendingInvitationFor(request);
    if (!pending) {
      const invitation = await this.storeInvitation(request);
      return {
        outcome: 'reissued',
        invitationId: invitation.id,
        expiresAt: invitation.expiresAt,
      };
    }
    const expiresAt = this.expiryFromNow();
    const { adapter } = await this.auth.$context;
    await adapter.update({
      model: 'invitation',
      where: [{ field: 'id', value: pending.id }],
      update: { expiresAt },
    });
    return { outcome: 'reissued', invitationId: pending.id, expiresAt };
  }

  private async pendingInvitationFor(
    request: InvitationRequest,
  ): Promise<StoredInvitation | null> {
    const { adapter } = await this.auth.$context;
    const pending = await adapter.findMany<StoredInvitation>({
      model: 'invitation',
      where: [
        { field: 'organizationId', value: request.workspaceId },
        { field: 'email', value: request.email },
        { field: 'status', value: 'pending' },
      ],
    });
    const now = this.clock.now();
    return pending.find((invitation) => invitation.expiresAt > now) ?? null;
  }

  private async storeInvitation(
    request: InvitationRequest,
  ): Promise<StoredInvitation> {
    const { adapter } = await this.auth.$context;
    return adapter.create<Record<string, unknown>, StoredInvitation>({
      model: 'invitation',
      data: {
        organizationId: request.workspaceId,
        email: request.email,
        role: toStoredRole(request.role),
        status: 'pending',
        inviterId: request.inviterAccountId,
        createdAt: this.clock.now(),
        expiresAt: this.expiryFromNow(),
      },
    });
  }

  private expiryFromNow(): Date {
    return new Date(
      this.clock.now().getTime() + INVITATION_LIFETIME_SECONDS * 1000,
    );
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
