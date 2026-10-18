import { Injectable } from '@nestjs/common';
import { AccountQuery } from '../query-port/account.query-port';
import type { AccountByEmailView } from '../types/account.types';

export interface FindAccountsByEmailInput {
  readonly emails: readonly string[];
}

/** A query: the Accounts that sign in with any of the addresses named. */
@Injectable()
export class FindAccountsByEmailUseCase {
  constructor(private readonly accountQuery: AccountQuery) {}

  execute(input: FindAccountsByEmailInput): Promise<AccountByEmailView[]> {
    return this.accountQuery.accountsWithEmails(input.emails);
  }
}
