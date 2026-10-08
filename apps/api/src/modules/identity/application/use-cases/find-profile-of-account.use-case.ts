import { Injectable } from '@nestjs/common';
import { ProfileQuery } from '../query-port/profile.query-port';
import type { ProfileView } from '../types/profile.types';

export interface FindProfileOfAccountInput {
  readonly accountId: string;
}

/** A query: the Account's Profile, or `null` while it has not introduced itself. */
@Injectable()
export class FindProfileOfAccountUseCase {
  constructor(private readonly profileQuery: ProfileQuery) {}

  execute(input: FindProfileOfAccountInput): Promise<ProfileView | null> {
    return this.profileQuery.profileOfAccount(input.accountId);
  }
}
