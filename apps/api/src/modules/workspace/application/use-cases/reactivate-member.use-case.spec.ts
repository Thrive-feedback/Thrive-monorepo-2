import { describe, expect, it } from 'bun:test';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  FakeMemberReactivating,
  FakeMembershipQuery,
} from '@test/support/workspace.fakes';
import type { MemberRoleValue } from '../../domain/value-object/member-role.vo';
import {
  MemberNotFoundError,
  NotAllowedToReactivateError,
} from '../workspace.errors';
import { ReactivateMemberUseCase } from './reactivate-member.use-case';

const ACME = { id: '0199a0f0-0000-7000-8000-0000000000aa', name: 'Acme' };
const OTHER = { id: '0199a0f0-0000-7000-8000-0000000000bb', name: 'Other' };
const EARLIER = new Date('2026-10-16T03:00:00Z');

/** A Workspace whose active Members hold the Roles given, keyed by Account. */
function setUp(roles: Record<string, MemberRoleValue>) {
  const membershipQuery = new FakeMembershipQuery();
  for (const [accountId, role] of Object.entries(roles)) {
    membershipQuery.memberships.push({ accountId, workspace: ACME, role });
  }
  const memberReactivating = new FakeMemberReactivating(membershipQuery);
  const unitOfWork = new FakeUnitOfWork();
  const useCase = new ReactivateMemberUseCase(
    memberReactivating,
    membershipQuery,
    unitOfWork,
  );
  return { membershipQuery, memberReactivating, unitOfWork, useCase };
}

/** Records `accountId` as Deactivated in `workspace`, holding `role`. */
function deactivated(
  membershipQuery: FakeMembershipQuery,
  accountId: string,
  role: MemberRoleValue,
  workspace = ACME,
) {
  membershipQuery.memberships.push({
    accountId,
    workspace,
    role,
    deactivatedAt: EARLIER,
  });
}

/** `reactivator` Reactivating `accountId`, as the route hands it over. */
function reactivation(
  reactivator: string,
  role: MemberRoleValue,
  accountId: string,
) {
  return {
    reactivatorAccountId: reactivator,
    membership: { workspace: ACME, role },
    accountId,
  };
}

describe('an Admin Reactivating someone', () => {
  it('gives them their access back', async () => {
    const { membershipQuery, memberReactivating, useCase } = setUp({
      ann: 'ADMIN',
    });
    deactivated(membershipQuery, 'ben', 'MEMBER');

    await useCase.execute(reactivation('ann', 'ADMIN', 'ben'));

    expect(memberReactivating.reactivations).toEqual([
      { workspaceId: ACME.id, accountId: 'ben' },
    ]);
    expect(await membershipQuery.isDeactivatedIn('ben', ACME.id)).toBe(false);
  });

  it('brings a former Admin back as an Admin', async () => {
    const { membershipQuery, useCase } = setUp({ ann: 'ADMIN' });
    deactivated(membershipQuery, 'ben', 'ADMIN');

    await useCase.execute(reactivation('ann', 'ADMIN', 'ben'));

    expect(
      (await membershipQuery.membershipInWorkspace('ben', ACME.id))?.role,
    ).toBe('ADMIN');
  });

  it('runs on the Workspace key Deactivating takes', async () => {
    const { membershipQuery, unitOfWork, useCase } = setUp({ ann: 'ADMIN' });
    deactivated(membershipQuery, 'ben', 'MEMBER');

    await useCase.execute(reactivation('ann', 'ADMIN', 'ben'));

    expect(unitOfWork.opened).toEqual([
      { serializeOn: `workspace-roles:${ACME.id}` },
    ]);
  });

  it('changes nothing for someone already active', async () => {
    const { memberReactivating, useCase } = setUp({
      ann: 'ADMIN',
      ben: 'MEMBER',
    });

    await useCase.execute(reactivation('ann', 'ADMIN', 'ben'));

    expect(memberReactivating.reactivations).toEqual([]);
  });

  it('refuses someone never in the Workspace, or Deactivated only elsewhere', async () => {
    const { membershipQuery, memberReactivating, useCase } = setUp({
      ann: 'ADMIN',
    });
    deactivated(membershipQuery, 'cat', 'MEMBER', OTHER);

    await expect(
      useCase.execute(reactivation('ann', 'ADMIN', 'ben')),
    ).rejects.toThrow(MemberNotFoundError);
    await expect(
      useCase.execute(reactivation('ann', 'ADMIN', 'cat')),
    ).rejects.toThrow(MemberNotFoundError);
    expect(memberReactivating.reactivations).toEqual([]);
  });

  it('refuses an Admin who was made a Member before the lock was theirs', async () => {
    const { membershipQuery, memberReactivating, useCase } = setUp({
      ann: 'MEMBER',
    });
    deactivated(membershipQuery, 'ben', 'MEMBER');

    // The route resolved Ann as an Admin; by the time the lock is hers, she is not.
    await expect(
      useCase.execute(reactivation('ann', 'ADMIN', 'ben')),
    ).rejects.toThrow(NotAllowedToReactivateError);
    expect(memberReactivating.reactivations).toEqual([]);
  });
});

describe('a Member Reactivating someone', () => {
  it('is refused', async () => {
    const { membershipQuery, memberReactivating, useCase } = setUp({
      ann: 'ADMIN',
      ben: 'MEMBER',
    });
    deactivated(membershipQuery, 'cat', 'MEMBER');

    await expect(
      useCase.execute(reactivation('ben', 'MEMBER', 'cat')),
    ).rejects.toThrow(NotAllowedToReactivateError);
    expect(memberReactivating.reactivations).toEqual([]);
  });
});
