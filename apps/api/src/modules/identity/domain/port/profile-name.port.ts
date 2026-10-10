/**
 * Published: the name an Account introduced itself with. Another module asks it when it shows
 * the person to someone else, such as naming who sent an Invitation.
 */
export abstract class ProfileNamePort {
  /** The Profile's full name, or `null` while the Account has not introduced itself. */
  abstract fullNameOf(accountId: string): Promise<string | null>;
}
