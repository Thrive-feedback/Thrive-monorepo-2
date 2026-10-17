import {
  NoAddressesToInviteError,
  TooManyInvitationsError,
} from '../workspace.errors';
import { InvitationRecipient } from './invitation-recipient.vo';
import { MemberRole } from './member-role.vo';

/** One person to invite, and the Role they join with. */
export interface Invitee {
  readonly email: string;
  readonly role: MemberRole;
}

/**
 * The people one send invites, each once, with the Role the inviter chose for them (brain
 * `ADR-0033`). An address is compared without case or surrounding spaces, because a mailbox is,
 * so `Ann@Acme.co` and `ann@acme.co ` are one person; the first time it is named wins, Role
 * included. The limit counts people after merging, not rows typed.
 */
export class InvitedAddresses {
  static readonly MAX_COUNT = 10;

  private constructor(private readonly invitees: readonly Invitee[]) {}

  static of(
    raw: readonly { readonly email: string; readonly role: string }[],
  ): InvitedAddresses {
    const invitees = new Map<string, Invitee>();
    for (const entry of raw) {
      // Normalized as the recipient is, so an Invitation stored here is found by its address.
      const email = InvitationRecipient.of(entry.email).toString();
      if (!invitees.has(email)) {
        invitees.set(email, { email, role: MemberRole.of(entry.role) });
      }
    }
    if (invitees.size === 0) {
      throw new NoAddressesToInviteError();
    }
    if (invitees.size > InvitedAddresses.MAX_COUNT) {
      throw new TooManyInvitationsError(InvitedAddresses.MAX_COUNT);
    }
    return new InvitedAddresses([...invitees.values()]);
  }

  /** In the order they were first given. */
  toArray(): readonly Invitee[] {
    return this.invitees;
  }
}
