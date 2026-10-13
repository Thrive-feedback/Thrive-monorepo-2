import { WebConfig } from '@app/config/configuration';
import { ProfileNamePort } from '@app/modules/identity';
import { Clock } from '@app/shared/application/clock.port';
import { EmailSender } from '@app/shared/application/email-sender.port';
import { Injectable } from '@nestjs/common';
import { InvitationEmail } from '../../domain/value-object/invitation-email.vo';

export interface InvitationSender {
  readonly accountId: string;
  /** Replies to an Invitation go to the person who sent it. */
  readonly email: string;
}

export interface InvitationToDeliver {
  readonly invitationId: string;
  readonly email: string;
  readonly expiresAt: Date;
  readonly workspaceName: string;
  /**
   * Tells this send apart from every other of the same Invitation, so the transport may retry
   * it without delivering twice, and never mistakes a resend for a retry.
   */
  readonly idempotencyKey: string;
}

/**
 * Emails an Invitation from the person who sent it, for sending and resending alike. Rejects when
 * the email did not go out; what to do about the Invitation then is the caller's.
 */
@Injectable()
export class InvitationDelivery {
  constructor(
    private readonly emailSender: EmailSender,
    private readonly profileNamePort: ProfileNamePort,
    private readonly clock: Clock,
    private readonly webConfig: WebConfig,
  ) {}

  /** The name an Invitation is sent under: the sender's Display name, or their address. */
  async senderNameOf(sender: InvitationSender): Promise<string> {
    return (
      (await this.profileNamePort.displayNameOf(sender.accountId)) ??
      sender.email
    );
  }

  async deliver(
    invitation: InvitationToDeliver,
    sender: InvitationSender,
    senderName: string,
  ): Promise<void> {
    const content = InvitationEmail.compose({
      inviterName: senderName,
      workspaceName: invitation.workspaceName,
      invitedEmail: invitation.email,
      acceptUrl: `${this.webConfig.origin}/invitations/${invitation.invitationId}`,
      expiresAt: invitation.expiresAt,
      now: this.clock.now(),
    }).content();
    await this.emailSender.send({
      to: invitation.email,
      idempotencyKey: invitation.idempotencyKey,
      fromName: senderName,
      replyTo: sender.email,
      ...content,
    });
  }
}
