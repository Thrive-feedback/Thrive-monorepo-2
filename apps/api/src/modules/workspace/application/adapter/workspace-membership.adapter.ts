import { Injectable } from '@nestjs/common';
import { WorkspaceMembershipPort } from '../../domain/port/workspace-membership.port';
import { MembershipQuery } from '../query-port/membership.query-port';

/**
 * Reads the membership rather than calling `ResolveMembershipUseCase`, whose answer to "not a
 * Member" is a thrown error: this port promises a fact, and catching an error to produce one
 * would turn a refusal into control flow.
 */
@Injectable()
export class WorkspaceMembershipAdapter extends WorkspaceMembershipPort {
  constructor(private readonly membershipQuery: MembershipQuery) {
    super();
  }

  async isMemberOf(membership: {
    readonly workspaceId: string;
    readonly accountId: string;
  }): Promise<boolean> {
    return (
      (await this.membershipQuery.membershipInWorkspace(
        membership.accountId,
        membership.workspaceId,
      )) !== null
    );
  }
}
