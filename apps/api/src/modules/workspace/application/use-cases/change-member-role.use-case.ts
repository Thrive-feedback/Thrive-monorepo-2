import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { MemberRole } from '../../domain/value-object/member-role.vo';
import { MemberRoleChanging } from '../port/member-role-changing.port';
import { MembershipQuery } from '../query-port/membership.query-port';
import type { MembershipView } from '../types/membership.types';
import {
  MemberNotFoundError,
  NotAllowedToChangeRolesError,
} from '../workspace.errors';

export interface ChangeMemberRoleInput {
  /** The changer's `cookie` header, passed through to the store untouched. */
  readonly credential: string;
  /** The changer's Account, whose Role is read again once the Workspace is locked. */
  readonly changerAccountId: string;
  readonly membership: MembershipView;
  /** The Account whose Role changes: anyone in the Workspace, the changer included. */
  readonly accountId: string;
  readonly role: string;
}

/**
 * An Admin makes anyone in their Workspace an Admin or a Member, other Admins and themselves
 * included, as long as the Workspace keeps an Admin (brain `ADR-0033`, ADR 0046). The new Role
 * holds from that Member's next request, because every request reads its membership afresh.
 */
@Injectable()
export class ChangeMemberRoleUseCase {
  constructor(
    private readonly memberRoleChanging: MemberRoleChanging,
    private readonly membershipQuery: MembershipQuery,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: ChangeMemberRoleInput): Promise<void> {
    const next = MemberRole.of(input.role);
    const workspaceId = input.membership.workspace.id;

    // Serialized per Workspace: two Admins each making the other a Member at once would both
    // count two Admins and leave none. The second waits here until the first has stored its
    // change, then reads the Roles again: its changer may no longer be an Admin, and if they
    // are, there may be no other Admin left.
    await this.unitOfWork.run(
      async () => {
        const changer = await this.membershipQuery.membershipInWorkspace(
          input.changerAccountId,
          workspaceId,
        );
        if (!changer || !MemberRole.of(changer.role).mayChangeRoles()) {
          throw new NotAllowedToChangeRolesError();
        }
        const target = await this.membershipQuery.membershipInWorkspace(
          input.accountId,
          workspaceId,
        );
        if (!target) {
          throw new MemberNotFoundError();
        }
        const current = MemberRole.of(target.role);
        if (current.equals(next)) {
          return;
        }
        current.ensureMayBecome(
          next,
          await this.membershipQuery.adminCountOf(workspaceId),
        );
        await this.memberRoleChanging.change({
          credential: input.credential,
          workspaceId,
          accountId: input.accountId,
          role: next.toString(),
        });
      },
      { serializeOn: `workspace-roles:${workspaceId}` },
    );
  }
}
