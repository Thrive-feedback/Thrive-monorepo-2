import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { MemberRole } from '../../domain/value-object/member-role.vo';
import { MemberReactivating } from '../port/member-reactivating.port';
import { MembershipQuery } from '../query-port/membership.query-port';
import type { MembershipView } from '../types/membership.types';
import {
  MemberNotFoundError,
  NotAllowedToReactivateError,
} from '../workspace.errors';

export interface ReactivateMemberInput {
  /** The Account asking, whose Role is read again once the Workspace is locked. */
  readonly reactivatorAccountId: string;
  readonly membership: MembershipView;
  /** The Account whose access comes back. */
  readonly accountId: string;
}

/**
 * Brings back someone who was Deactivated in the Workspace, with the Role they had, and with it
 * everything they gave and received there (brain `ADR-0033` decision 7). Only an Admin may.
 * Reactivating someone already active changes nothing, so a second click is harmless.
 */
@Injectable()
export class ReactivateMemberUseCase {
  constructor(
    private readonly memberReactivating: MemberReactivating,
    private readonly membershipQuery: MembershipQuery,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: ReactivateMemberInput): Promise<void> {
    const workspaceId = input.membership.workspace.id;

    // Serialized on the key Deactivating takes, so the two never interleave on one person.
    await this.unitOfWork.run(
      async () => {
        const reactivator = await this.membershipQuery.membershipInWorkspace(
          input.reactivatorAccountId,
          workspaceId,
        );
        if (!reactivator) {
          throw new MemberNotFoundError();
        }
        if (!MemberRole.of(reactivator.role).mayReactivate()) {
          throw new NotAllowedToReactivateError();
        }
        if (
          await this.membershipQuery.membershipInWorkspace(
            input.accountId,
            workspaceId,
          )
        ) {
          return;
        }
        if (
          !(await this.membershipQuery.isDeactivatedIn(
            input.accountId,
            workspaceId,
          ))
        ) {
          throw new MemberNotFoundError();
        }
        await this.memberReactivating.reactivate({
          workspaceId,
          accountId: input.accountId,
        });
      },
      { serializeOn: `workspace-roles:${workspaceId}` },
    );
  }
}
