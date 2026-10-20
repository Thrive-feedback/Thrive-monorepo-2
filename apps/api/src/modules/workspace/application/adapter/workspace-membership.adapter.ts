import { Injectable } from '@nestjs/common';
import { WorkspaceMembershipPort } from '../../domain/port/workspace-membership.port';
import { MemberRole } from '../../domain/value-object/member-role.vo';
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

  async isAdminOf(membership: {
    readonly workspaceId: string;
    readonly accountId: string;
  }): Promise<boolean> {
    const found = await this.membershipQuery.membershipInWorkspace(
      membership.accountId,
      membership.workspaceId,
    );
    return found !== null && found.role === MemberRole.Admin.toString();
  }

  async membersAmong(members: {
    readonly workspaceId: string;
    readonly accountIds: readonly string[];
  }): Promise<readonly string[]> {
    if (members.accountIds.length === 0) {
      return [];
    }
    return this.membershipQuery.membersAmong(
      members.workspaceId,
      members.accountIds,
    );
  }

  async deactivatedAmong(members: {
    readonly workspaceId: string;
    readonly accountIds: readonly string[];
  }): Promise<readonly string[]> {
    if (members.accountIds.length === 0) {
      return [];
    }
    return this.membershipQuery.deactivatedAmong(
      members.workspaceId,
      members.accountIds,
    );
  }
}
