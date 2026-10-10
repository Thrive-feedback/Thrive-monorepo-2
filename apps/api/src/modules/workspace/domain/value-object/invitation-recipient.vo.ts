import { InvitationNotForYouError } from '../workspace.errors';

/** Stands in for the hidden part of an address, so its length gives nothing away. */
const MASK = '•••';

function normalized(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * The address an Invitation was sent to. Only the Account signed in with that exact address
 * may accept it — compared without case, and with no provider's alias rules, so what the
 * inviter typed is what has to match.
 */
export class InvitationRecipient {
  private constructor(private readonly email: string) {}

  static of(email: string): InvitationRecipient {
    return new InvitationRecipient(normalized(email));
  }

  /** Refuses anyone signed in with another address. */
  ensureIs(accountEmail: string): void {
    if (normalized(accountEmail) !== this.email) {
      throw new InvitationNotForYouError();
    }
  }

  /**
   * Enough of the address for its owner to know which Google account to choose, and too
   * little for anyone else holding the link to learn who was invited: `s•••@acme.com`.
   */
  masked(): string {
    const at = this.email.lastIndexOf('@');
    const local = at > 0 ? this.email.slice(0, at) : this.email;
    const domain = at > 0 ? this.email.slice(at) : '';
    return `${local.charAt(0)}${MASK}${domain}`;
  }
}
