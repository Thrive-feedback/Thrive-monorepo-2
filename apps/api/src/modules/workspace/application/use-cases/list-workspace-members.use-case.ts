import { AccountSummaryPort } from '@app/modules/identity';
import { Injectable } from '@nestjs/common';
import type { MemberRoleValue } from '../../domain/value-object/member-role.vo';
import { MembershipQuery } from '../query-port/membership.query-port';
import type { MembershipView, PageRequest } from '../types/membership.types';

export interface ListWorkspaceMembersInput {
  /** The caller's own membership, already resolved. Every Member may see who else is in. */
  readonly membership: MembershipView;
  readonly page: PageRequest;
}

export interface WorkspaceMember {
  readonly accountId: string;
  readonly email: string;
  /** `null` while the Member has not introduced themselves. */
  readonly fullName: string | null;
  readonly role: MemberRoleValue;
}

export interface WorkspaceMemberList {
  readonly items: readonly WorkspaceMember[];
  readonly total: number;
}

/** A query: who is in the caller's Workspace, with the email and name each is known by. */
@Injectable()
export class ListWorkspaceMembersUseCase {
  constructor(
    private readonly membershipQuery: MembershipQuery,
    private readonly accountSummaryPort: AccountSummaryPort,
  ) {}

  async execute(
    input: ListWorkspaceMembersInput,
  ): Promise<WorkspaceMemberList> {
    const members = await this.membershipQuery.membersOfWorkspace(
      input.membership.workspace.id,
      input.page,
    );
    const summaries = new Map(
      (
        await this.accountSummaryPort.summariesOf(
          members.items.map((member) => member.accountId),
        )
      ).map((summary) => [summary.accountId, summary]),
    );
    return {
      items: members.items.flatMap((member) => {
        const summary = summaries.get(member.accountId);
        // A Member's Account cascades away with them, so a missing one was deleted mid-read.
        return summary
          ? [
              {
                accountId: member.accountId,
                email: summary.email,
                fullName: summary.fullName,
                role: member.role,
              },
            ]
          : [];
      }),
      total: members.total,
    };
  }
}
