import { Injectable } from '@nestjs/common';
import { MembershipQuery } from '../query-port/membership.query-port';
import type {
  MemberStatus,
  MembershipPage,
  PageRequest,
} from '../types/membership.types';

export interface ListMyMembershipsInput {
  readonly accountId: string;
  readonly page: PageRequest;
  readonly status: MemberStatus;
}

/**
 * A query: the Workspaces the caller is active in, the one used last first, or those they were
 * Deactivated in; and their Role in each.
 */
@Injectable()
export class ListMyMembershipsUseCase {
  constructor(private readonly membershipQuery: MembershipQuery) {}

  execute(input: ListMyMembershipsInput): Promise<MembershipPage> {
    return this.membershipQuery.membershipsOfAccount(
      input.accountId,
      input.page,
      input.status,
    );
  }
}
