import { Clock } from '@app/shared/application/clock.port';
import { Injectable } from '@nestjs/common';
import { InvitationRecipient } from '../../domain/value-object/invitation-recipient.vo';
import { InvitationQuery } from '../query-port/invitation.query-port';
import type { PendingInvitationPage } from '../types/invitation.types';
import type { PageRequest } from '../types/membership.types';

export interface ListMyInvitationsInput {
  readonly accountId: string;
  /** The address the caller is signed in with; Invitations sent to it are theirs. */
  readonly accountEmail: string;
  readonly page: PageRequest;
}

/**
 * A query: the Invitations sent to the caller's address that they could accept now, so someone
 * who signs in without the link still finds them. One to a Workspace they are already in is left
 * out: an Admin may have Reactivated them after inviting them back.
 */
@Injectable()
export class ListMyInvitationsUseCase {
  constructor(
    private readonly invitationQuery: InvitationQuery,
    private readonly clock: Clock,
  ) {}

  execute(input: ListMyInvitationsInput): Promise<PendingInvitationPage> {
    return this.invitationQuery.pendingInvitationsTo(
      InvitationRecipient.of(input.accountEmail),
      input.accountId,
      this.clock.now(),
      input.page,
    );
  }
}
