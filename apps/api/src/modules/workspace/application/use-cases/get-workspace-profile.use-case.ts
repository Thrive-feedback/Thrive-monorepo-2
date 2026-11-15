import { AccountBySlugPort, AccountSummaryPort } from '@app/modules/identity';
import { Injectable } from '@nestjs/common';
import type { MemberRoleValue } from '../../domain/value-object/member-role.vo';
import { MembershipQuery } from '../query-port/membership.query-port';
import type { MemberStatus, MembershipView } from '../types/membership.types';
import { ProfileNotFoundError } from '../workspace.errors';

export interface GetWorkspaceProfileInput {
  /** The caller's own membership, already resolved. Every Member may open anyone's Profile. */
  readonly membership: MembershipView;
  /** The slug of the Profile to open, as it appears in the link. */
  readonly slug: string;
}

/** One person as their Profile shows them inside one Workspace. */
export interface WorkspaceProfile {
  readonly accountId: string;
  readonly slug: string;
  readonly email: string;
  readonly fullName: string;
  /** The name others see and call them by. */
  readonly displayName: string;
  /** Their photo from Google; `null` when Google has none. */
  readonly photoUrl: string | null;
  readonly role: MemberRoleValue;
  /** A Deactivated Member's Profile stays readable, because what was written to them stays. */
  readonly status: MemberStatus;
  readonly joinedAt: Date;
}

/**
 * A query: the Profile one slug names, as a Member of the caller's Workspace sees it — who they
 * are and where they stand there. Someone who was never a Member of it is not found, whatever
 * Workspaces they are in elsewhere.
 */
@Injectable()
export class GetWorkspaceProfileUseCase {
  constructor(
    private readonly accountBySlugPort: AccountBySlugPort,
    private readonly membershipQuery: MembershipQuery,
    private readonly accountSummaryPort: AccountSummaryPort,
  ) {}

  async execute(input: GetWorkspaceProfileInput): Promise<WorkspaceProfile> {
    const [account] = await this.accountBySlugPort.accountsWithSlugs([
      input.slug,
    ]);
    if (!account) {
      throw new ProfileNotFoundError();
    }
    const [standing, [summary]] = await Promise.all([
      this.membershipQuery.standingIn(
        input.membership.workspace.id,
        account.accountId,
      ),
      this.accountSummaryPort.summariesOf([account.accountId]),
    ]);
    // A summary without a Profile name cannot happen for a slug a Profile holds, unless the
    // Account was deleted between the two reads; either way there is nobody to show.
    if (
      !standing ||
      !summary ||
      summary.fullName === null ||
      summary.displayName === null
    ) {
      throw new ProfileNotFoundError();
    }
    return {
      accountId: account.accountId,
      slug: account.slug,
      email: summary.email,
      fullName: summary.fullName,
      displayName: summary.displayName,
      photoUrl: summary.photoUrl,
      role: standing.role,
      status: standing.status,
      joinedAt: standing.joinedAt,
    };
  }
}
