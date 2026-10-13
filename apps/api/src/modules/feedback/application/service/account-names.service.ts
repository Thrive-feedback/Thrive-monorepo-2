import { AccountSummaryPort } from '@app/modules/identity';
import { Injectable } from '@nestjs/common';

/**
 * The names the Accounts on one page introduced themselves with.
 *
 * Every read in this module shows people by name, and every one of them had the same shape of
 * bug available to it: a name resolved per row rather than per page. Asking once for the whole
 * page keeps the number of calls independent of the number of rows (`BE_06` R9), so a page of
 * twenty costs one call however many Members each row names.
 */
@Injectable()
export class AccountNamesService {
  constructor(private readonly accountSummaryPort: AccountSummaryPort) {}

  /**
   * One lookup for every Account named, de-duplicated. A missing Account — deleted mid-read —
   * and one that has not introduced itself both read as `null`, because neither has a name to
   * show, and the screen says the same thing about both.
   */
  async namesOf(
    accountIds: readonly string[],
  ): Promise<ReadonlyMap<string, string | null>> {
    const summaries = await this.accountSummaryPort.summariesOf([
      ...new Set(accountIds),
    ]);
    return new Map(
      summaries.map((summary) => [summary.accountId, summary.fullName]),
    );
  }
}
