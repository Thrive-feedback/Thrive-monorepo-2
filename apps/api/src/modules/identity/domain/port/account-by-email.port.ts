/** An Account found by the address it signs in with. */
export interface AccountByEmail {
  readonly accountId: string;
  /** The address as the Account holds it. */
  readonly email: string;
}

/**
 * Published: which of several addresses already belong to an Account, in one call. Another module
 * asks it when what it does depends on whether an address is someone it already knows, such as
 * inviting back a person who left a Workspace.
 */
export abstract class AccountByEmailPort {
  /** One entry per address that has an Account, matched whatever its case. Others are left out. */
  abstract accountsWithEmails(
    emails: readonly string[],
  ): Promise<AccountByEmail[]>;
}
