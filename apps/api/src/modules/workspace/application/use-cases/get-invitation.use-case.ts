import { ProfileNamePort } from '@app/modules/identity';
import { Clock } from '@app/shared/application/clock.port';
import { Injectable } from '@nestjs/common';
import { InvitationRecipient } from '../../domain/value-object/invitation-recipient.vo';
import type { InvitationStatusValue } from '../../domain/value-object/invitation-status.vo';
import { InvitationQuery } from '../query-port/invitation.query-port';
import { InvitationNotFoundError } from '../workspace.errors';

export interface GetInvitationInput {
  readonly invitationId: string;
}

/** What anyone holding an Invitation's link may learn before signing in. */
export interface InvitationPreview {
  readonly workspaceName: string;
  /** `null` while the inviter has not introduced themselves. */
  readonly inviterName: string | null;
  /** Only enough of the address for its owner to recognise it. */
  readonly invitedEmailMasked: string;
  readonly status: InvitationStatusValue;
}

/**
 * A query, open to anyone with the link: the email names the Workspace and the inviter
 * already, so showing them again gives nothing away, and the person can see whether the
 * Invitation still stands before they choose a Google account.
 */
@Injectable()
export class GetInvitationUseCase {
  constructor(
    private readonly invitationQuery: InvitationQuery,
    private readonly profileNamePort: ProfileNamePort,
    private readonly clock: Clock,
  ) {}

  async execute(input: GetInvitationInput): Promise<InvitationPreview> {
    const invitation = await this.invitationQuery.invitationById(
      input.invitationId,
      this.clock.now(),
    );
    if (!invitation) {
      throw new InvitationNotFoundError();
    }
    return {
      workspaceName: invitation.workspace.name,
      inviterName: await this.profileNamePort.fullNameOf(
        invitation.inviterAccountId,
      ),
      invitedEmailMasked: InvitationRecipient.of(invitation.email).masked(),
      status: invitation.status,
    };
  }
}
