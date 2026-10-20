import { Injectable } from '@nestjs/common';
import { AccountQuery } from '../query-port/account.query-port';
import type { AccountBySlugView } from '../types/account.types';

export interface FindAccountsBySlugInput {
  readonly slugs: readonly string[];
}

/** A query: the Accounts whose Profiles hold any of the slugs named. */
@Injectable()
export class FindAccountsBySlugUseCase {
  constructor(private readonly accountQuery: AccountQuery) {}

  execute(input: FindAccountsBySlugInput): Promise<AccountBySlugView[]> {
    return this.accountQuery.accountsWithSlugs(input.slugs);
  }
}
