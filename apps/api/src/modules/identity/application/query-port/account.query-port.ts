import type { AccountSummaryView } from '../types/account.types';

export abstract class AccountQuery {
  /** One summary per Account found, in no particular order. Unknown ids are left out. */
  abstract summariesOf(
    accountIds: readonly string[],
  ): Promise<AccountSummaryView[]>;
}
