import { Injectable } from '@nestjs/common';
import { LinkedAccountQuery } from '../query-port/linked-account.query-port';
import type { LinkedAccountView } from '../types/linked-account.types';

export interface ListMyLinkedAccountsInput {
  readonly accountId: string;
}

/**
 * The caller's own Linked Accounts, for their Settings.
 *
 * It takes no account other than the caller's, so there is no shape of request that reads
 * somebody else's — which is what makes "nobody else's Linked Account is visible to anybody"
 * (#211 AC 7) a property of the surface rather than a check to remember.
 */
@Injectable()
export class ListMyLinkedAccountsUseCase {
  constructor(private readonly linkedAccountQuery: LinkedAccountQuery) {}

  async execute(
    input: ListMyLinkedAccountsInput,
  ): Promise<readonly LinkedAccountView[]> {
    return this.linkedAccountQuery.forAccount(input.accountId);
  }
}
