import { Injectable } from '@nestjs/common';
import { AccountQuery } from '../query-port/account.query-port';
import type { AccountSummaryView } from '../types/account.types';

export interface FindAccountSummariesInput {
  readonly accountIds: readonly string[];
}

/** A query: the email and Profile name of each Account named. */
@Injectable()
export class FindAccountSummariesUseCase {
  constructor(private readonly accountQuery: AccountQuery) {}

  execute(input: FindAccountSummariesInput): Promise<AccountSummaryView[]> {
    return this.accountQuery.summariesOf(input.accountIds);
  }
}
