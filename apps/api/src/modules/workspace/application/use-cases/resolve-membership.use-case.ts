import { Injectable } from '@nestjs/common';
import { MembershipQuery } from '../query-port/membership.query-port';
import type { MembershipView } from '../types/membership.types';
import { WorkspaceNotFoundError } from '../workspace.errors';

export interface ResolveMembershipInput {
  readonly accountId: string;
  readonly workspaceId: string;
}

/**
 * A query: the caller's standing in the Workspace a route acts on. Refuses anyone who is not
 * a Member there, before any use case inside the Workspace runs.
 */
@Injectable()
export class ResolveMembershipUseCase {
  constructor(private readonly membershipQuery: MembershipQuery) {}

  async execute(input: ResolveMembershipInput): Promise<MembershipView> {
    const membership = await this.membershipQuery.membershipInWorkspace(
      input.accountId,
      input.workspaceId,
    );
    if (!membership) {
      throw new WorkspaceNotFoundError();
    }
    return membership;
  }
}
