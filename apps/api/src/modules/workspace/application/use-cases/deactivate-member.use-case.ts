import { Clock } from '@app/shared/application/clock.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { MemberRole } from '../../domain/value-object/member-role.vo';
import { MemberDeactivating } from '../port/member-deactivating.port';
import { MembershipQuery } from '../query-port/membership.query-port';
import type { MembershipView } from '../types/membership.types';
import {
  MemberNotFoundError,
  NotAllowedToDeactivateError,
} from '../workspace.errors';

export interface DeactivateMemberInput {
  /** The Account asking, whose Role is read again once the Workspace is locked. */
  readonly deactivatorAccountId: string;
  readonly membership: MembershipView;
  /** The Account whose access ends: the asker themselves, which is leaving, or anyone else. */
  readonly accountId: string;
}

/**
 * Ends someone's access to the Workspace and keeps everything they gave and received there
 * (brain `ADR-0033` decisions 3 and 6). Anyone may Deactivate themselves, which is how they
 * leave; an Admin may Deactivate anyone else, other Admins included. The last active Admin may
 * do neither, so the Workspace always keeps one.
 */
@Injectable()
export class DeactivateMemberUseCase {
  constructor(
    private readonly memberDeactivating: MemberDeactivating,
    private readonly membershipQuery: MembershipQuery,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(input: DeactivateMemberInput): Promise<void> {
    const workspaceId = input.membership.workspace.id;
    const isSelf = input.accountId === input.deactivatorAccountId;

    // Serialized on the key Role changes take: Deactivating an Admin and making one a Member
    // both lower the count of Admins, and two at once could each see another Admin left.
    await this.unitOfWork.run(
      async () => {
        const deactivator = await this.membershipQuery.membershipInWorkspace(
          input.deactivatorAccountId,
          workspaceId,
        );
        if (!deactivator) {
          throw new MemberNotFoundError();
        }
        if (!isSelf && !MemberRole.of(deactivator.role).mayDeactivateOthers()) {
          throw new NotAllowedToDeactivateError();
        }
        const target = isSelf
          ? deactivator
          : await this.membershipQuery.membershipInWorkspace(
              input.accountId,
              workspaceId,
            );
        if (!target) {
          throw new MemberNotFoundError();
        }
        MemberRole.of(target.role).ensureMayBeDeactivated(
          await this.membershipQuery.adminCountOf(workspaceId),
        );
        await this.memberDeactivating.deactivate({
          workspaceId,
          accountId: input.accountId,
          deactivatedAt: this.clock.now(),
        });
      },
      { serializeOn: `workspace-roles:${workspaceId}` },
    );
  }
}
