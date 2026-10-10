import {
  NoAddressesToInviteError,
  TooManyInvitationsError,
} from '../workspace.errors';

/**
 * The addresses one send invites, each once. An address is compared without case or
 * surrounding spaces, because a mailbox is, so `Ann@Acme.co` and `ann@acme.co ` are one
 * person. The limit counts people after merging, not rows typed.
 */
export class InvitedAddresses {
  static readonly MAX_COUNT = 10;

  private constructor(private readonly emails: readonly string[]) {}

  static of(raw: readonly string[]): InvitedAddresses {
    const emails = [...new Set(raw.map((email) => email.trim().toLowerCase()))];
    if (emails.length === 0) {
      throw new NoAddressesToInviteError();
    }
    if (emails.length > InvitedAddresses.MAX_COUNT) {
      throw new TooManyInvitationsError(InvitedAddresses.MAX_COUNT);
    }
    return new InvitedAddresses(emails);
  }

  /** In the order they were first given. */
  toArray(): readonly string[] {
    return this.emails;
  }
}
