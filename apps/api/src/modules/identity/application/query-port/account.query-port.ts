import type {
  AccountByEmailView,
  AccountSummaryView,
} from '../types/account.types';

export abstract class AccountQuery {
  /** One summary per Account found, in no particular order. Unknown ids are left out. */
  abstract summariesOf(
    accountIds: readonly string[],
  ): Promise<AccountSummaryView[]>;

  /** One per address that has an Account, matched whatever its case, in no particular order. */
  abstract accountsWithEmails(
    emails: readonly string[],
  ): Promise<AccountByEmailView[]>;
}
