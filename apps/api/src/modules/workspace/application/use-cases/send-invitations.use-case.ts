import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { InvitedAddresses } from '../../domain/value-object/invited-addresses.vo';
import { MemberRole } from '../../domain/value-object/member-role.vo';
import {
  type InvitationStored,
  WorkspaceInviting,
} from '../port/workspace-inviting.port';
import { InvitationDelivery } from '../service/invitation-delivery.service';
import type { MembershipView } from '../types/membership.types';
import { NotAllowedToInviteError } from '../workspace.errors';

/** Stays under Resend's 10 requests a second, which it answers 429 past. */
const SENDS_AT_ONCE = 5;

export interface SendInvitationsInput {
  readonly accountId: string;
  /** Replies to an Invitation go to the person who sent it. */
  readonly inviterEmail: string;
  /** The inviter's `cookie` header, passed through to the store untouched. */
  readonly credential: string;
  readonly membership: MembershipView;
  /** Each person, with the Role the inviter chose for them. */
  readonly invitations: readonly {
    readonly email: string;
    readonly role: string;
  }[];
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
 * An Admin invites several people to their Workspace at once, each as an Admin or a Member.
 * Each address gets
 * its own outcome: invited, already a Member, already invited, or failed — an Invitation whose
 * email did not go out is revoked, so sending again starts it afresh.
 */
@Injectable()
export class SendInvitationsUseCase {
  constructor(
    private readonly workspaceInviting: WorkspaceInviting,
    private readonly invitationDelivery: InvitationDelivery,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    input: SendInvitationsInput,
  ): Promise<readonly InvitationOutcome[]> {
    if (!MemberRole.of(input.membership.role).mayInvite()) {
      throw new NotAllowedToInviteError();
    }
    const addresses = InvitedAddresses.of(input.invitations);
    const workspaceId = input.membership.workspace.id;

    // Serialized per Workspace: the store checks "already invited" before it writes, so two
    // sends naming one address at once would otherwise both pass and leave two Invitations.
    // Only the writes are inside; email waits on the network and must not hold the lock.
    const stored = await this.unitOfWork.run(
      async () => {
        const results: Stored[] = [];
        for (const { email, role } of addresses.toArray()) {
          results.push({
            email,
            stored: await this.workspaceInviting.invite({
              credential: input.credential,
              workspaceId,
              email,
              role: role.toString(),
            }),
          });
        }
        return results;
      },
      { serializeOn: `workspace-invitations:${workspaceId}` },
    );

    const inviterName = await this.invitationDelivery.senderNameOf({
      accountId: input.accountId,
      email: input.inviterEmail,
    });

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
    try {
      await this.invitationDelivery.deliver(
        {
          invitationId: stored.invitationId,
          email,
          expiresAt: stored.expiresAt,
          workspaceName: input.membership.workspace.name,
          // A second Invitation to the same address carries a new id, so the transport retries
          // this send and never that one.
          idempotencyKey: stored.invitationId,
        },
        { accountId: input.accountId, email: input.inviterEmail },
        inviterName,
      );
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
