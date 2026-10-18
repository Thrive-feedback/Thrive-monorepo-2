import { Injectable } from '@nestjs/common';
import { SessionWorkspace } from '../port/session-workspace.port';
import { MembershipQuery } from '../query-port/membership.query-port';
import type { MembershipView } from '../types/membership.types';

export interface GetCurrentMembershipInput {
  readonly accountId: string;
  /** The caller's `cookie` header, naming the session asked about. */
  readonly credential: string;
}

/**
 * A query: the Workspace the caller's session is in, with their Role there. The one the session
 * chose while they are still active in it; otherwise, for someone active in exactly one, that one;
 * otherwise `null`, and they choose — at sign-in, or once the Workspace they were in Deactivated
 * them. Never writes: a session that has not chosen stays that way until it does.
 */
@Injectable()
export class GetCurrentMembershipUseCase {
  constructor(
    private readonly sessionWorkspace: SessionWorkspace,
    private readonly membershipQuery: MembershipQuery,
  ) {}

  async execute(
    input: GetCurrentMembershipInput,
  ): Promise<MembershipView | null> {
    const selected = await this.sessionWorkspace.selectedIn(input.credential);
    if (selected) {
      const membership = await this.membershipQuery.membershipInWorkspace(
        input.accountId,
        selected,
      );
      if (membership) {
        return membership;
      }
    }
    const active = await this.membershipQuery.membershipsOfAccount(
      input.accountId,
      { page: 1, pageSize: 1 },
      'ACTIVE',
    );
    const [only] = active.items;
    return active.total === 1 && only ? only : null;
  }
}
