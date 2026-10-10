import { WebConfig } from '@app/config/configuration';
import { ProfileNamePort } from '@app/modules/identity';
import { Clock } from '@app/shared/application/clock.port';
import { EmailSender } from '@app/shared/application/email-sender.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { InvitationEmail } from '../../domain/value-object/invitation-email.vo';
import { InvitedAddresses } from '../../domain/value-object/invited-addresses.vo';
import { MemberRole } from '../../domain/value-object/member-role.vo';
import {
  type InvitationStored,
  WorkspaceInviting,
} from '../port/workspace-inviting.port';
import type { MembershipView } from '../types/membership.types';
import { NotAllowedToInviteError } from '../workspace.errors';

/** Gmail accepts a handful of messages on one connection at a time; more only queue. */
const SENDS_AT_ONCE = 5;

export interface SendInvitationsInput {
  readonly accountId: string;
  /** Replies to an Invitation go to the person who sent it. */
  readonly inviterEmail: string;
  /** The inviter's `cookie` header, passed through to the store untouched. */
  readonly credential: string;
  readonly membership: MembershipView;
  readonly emails: readonly string[];
}

export type InvitationOutcome =
  | {
      readonly email: string;
      readonly outcome: 'invited';
      readonly invitationId: string;
      readonly expiresAt: Date;
    }
  | {
      readonly email: string;
      readonly outcome: 'already_member' | 'already_invited' | 'failed';
    };

interface Stored {
  readonly email: string;
  readonly stored: InvitationStored;
}

/**
 * The Owner or an Admin invites several people to their Workspace at once. Each address gets
 * its own outcome: invited, already a Member, already invited, or failed — an Invitation whose
 * email did not go out is revoked, so sending again starts it afresh.
 */
@Injectable()
export class SendInvitationsUseCase {
  constructor(
    private readonly workspaceInviting: WorkspaceInviting,
    private readonly emailSender: EmailSender,
    private readonly profileNamePort: ProfileNamePort,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
    private readonly webConfig: WebConfig,
  ) {}

  async execute(
    input: SendInvitationsInput,
  ): Promise<readonly InvitationOutcome[]> {
    if (!MemberRole.of(input.membership.role).mayInvite()) {
      throw new NotAllowedToInviteError();
    }
    const addresses = InvitedAddresses.of(input.emails);
    const workspaceId = input.membership.workspace.id;

    // Serialized per Workspace: the store checks "already invited" before it writes, so two
    // sends naming one address at once would otherwise both pass and leave two Invitations.
    // Only the writes are inside; email waits on the network and must not hold the lock.
    const stored = await this.unitOfWork.run(
      async () => {
        const results: Stored[] = [];
        for (const email of addresses.toArray()) {
          results.push({
            email,
            stored: await this.workspaceInviting.invite({
              credential: input.credential,
              workspaceId,
              email,
            }),
          });
        }
        return results;
      },
      { serializeOn: `workspace-invitations:${workspaceId}` },
    );

    const inviterName =
      (await this.profileNamePort.fullNameOf(input.accountId)) ??
      input.inviterEmail;

    const outcomes: InvitationOutcome[] = [];
    for (let start = 0; start < stored.length; start += SENDS_AT_ONCE) {
      outcomes.push(
        ...(await Promise.all(
          stored
            .slice(start, start + SENDS_AT_ONCE)
            .map((entry) => this.deliver(entry, inviterName, input)),
        )),
      );
    }
    return outcomes;
  }

  private async deliver(
    { email, stored }: Stored,
    inviterName: string,
    input: SendInvitationsInput,
  ): Promise<InvitationOutcome> {
    if (stored.outcome !== 'invited') {
      return { email, outcome: stored.outcome };
    }
    const content = InvitationEmail.compose({
      inviterName,
      workspaceName: input.membership.workspace.name,
      invitedEmail: email,
      acceptUrl: `${this.webConfig.origin}/invitations/${stored.invitationId}`,
      expiresAt: stored.expiresAt,
      now: this.clock.now(),
    }).content();
    try {
      await this.emailSender.send({
        to: email,
        fromName: inviterName,
        replyTo: input.inviterEmail,
        ...content,
      });
    } catch {
      // The email did not go out, so this address is answered `failed` rather than the whole
      // send failing, and its Invitation is revoked so a second send is not "already invited".
      await this.workspaceInviting
        .revoke({
          credential: input.credential,
          invitationId: stored.invitationId,
        })
        // Optional: the answer is `failed` whether or not the revoke lands, and failing the
        // whole send here would hide the other addresses' outcomes. The adapter logs it.
        .catch(() => undefined);
      return { email, outcome: 'failed' };
    }
    return {
      email,
      outcome: 'invited',
      invitationId: stored.invitationId,
      expiresAt: stored.expiresAt,
    };
  }
}
