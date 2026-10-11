/** How another module may show an Account: its email and the name it introduced itself with. */
export interface AccountSummary {
  readonly accountId: string;
  readonly email: string;
  /** `null` while the Account has not introduced itself. */
  readonly fullName: string | null;
  /** The name others see and call them by; `null` while the Account has not introduced itself. */
  readonly displayName: string | null;
}

/**
 * Published: who several Accounts are, in one call. Another module asks it when it lists people,
 * such as the Members of a Workspace.
 */
export abstract class AccountSummaryPort {
  /** One summary per Account found. Unknown ids are left out. */
  abstract summariesOf(
    accountIds: readonly string[],
  ): Promise<AccountSummary[]>;
}
