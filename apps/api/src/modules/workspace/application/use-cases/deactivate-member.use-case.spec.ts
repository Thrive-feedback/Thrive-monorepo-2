import { describe, expect, it } from 'bun:test';
import { FakeClock } from '@test/support/clock.fake';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  FakeMemberDeactivating,
  FakeMembershipQuery,
} from '@test/support/workspace.fakes';
import type { MemberRoleValue } from '../../domain/value-object/member-role.vo';
import { LastAdminError } from '../../domain/workspace.errors';
import {
  MemberNotFoundError,
  NotAllowedToDeactivateError,
} from '../workspace.errors';
import { DeactivateMemberUseCase } from './deactivate-member.use-case';

const ACME = { id: '0199a0f0-0000-7000-8000-0000000000aa', name: 'Acme' };
const OTHER = { id: '0199a0f0-0000-7000-8000-0000000000bb', name: 'Other' };
const NOW = new Date('2026-10-17T03:00:00Z');

/** A Workspace whose Members hold the Roles given, keyed by Account. */
function setUp(roles: Record<string, MemberRoleValue>) {
  const membershipQuery = new FakeMembershipQuery();
  for (const [accountId, role] of Object.entries(roles)) {
    membershipQuery.memberships.push({ accountId, workspace: ACME, role });
  }
  const memberDeactivating = new FakeMemberDeactivating(membershipQuery);
  const unitOfWork = new FakeUnitOfWork();
  const useCase = new DeactivateMemberUseCase(
    memberDeactivating,
    membershipQuery,
    unitOfWork,
    new FakeClock(NOW),
  );
  return { membershipQuery, memberDeactivating, unitOfWork, useCase };
}

/** `deactivator` Deactivating `accountId`, as the route hands it over. */
function deactivation(
  deactivator: string,
  role: MemberRoleValue,
  accountId: string,
) {
  return {
    deactivatorAccountId: deactivator,
    membership: { workspace: ACME, role },
    accountId,
  };
}

describe('an Admin Deactivating someone', () => {
  it('ends their access and keeps their membership on record', async () => {
    const { membershipQuery, memberDeactivating, useCase } = setUp({
      ann: 'ADMIN',
      ben: 'MEMBER',
    });

    await useCase.execute(deactivation('ann', 'ADMIN', 'ben'));

    expect(memberDeactivating.deactivations).toEqual([
      { workspaceId: ACME.id, accountId: 'ben', deactivatedAt: NOW },
    ]);
    expect(await membershipQuery.membershipInWorkspace('ben', ACME.id)).toBe(
      null,
    );
    expect(await membershipQuery.isDeactivatedIn('ben', ACME.id)).toBe(true);
  });

  it('Deactivates another Admin', async () => {
    const { memberDeactivating, useCase } = setUp({
      ann: 'ADMIN',
      ben: 'ADMIN',
    });

    await useCase.execute(deactivation('ann', 'ADMIN', 'ben'));

    expect(memberDeactivating.deactivations).toHaveLength(1);
  });

  it('runs on the Workspace key Role changes take', async () => {
    const { unitOfWork, useCase } = setUp({ ann: 'ADMIN', ben: 'MEMBER' });

    await useCase.execute(deactivation('ann', 'ADMIN', 'ben'));

    expect(unitOfWork.opened).toEqual([
      { serializeOn: `workspace-roles:${ACME.id}` },
    ]);
  });

  it('refuses someone not active in the Workspace, Deactivated already or elsewhere', async () => {
    const { membershipQuery, memberDeactivating, useCase } = setUp({
      ann: 'ADMIN',
    });
    membershipQuery.memberships.push(
      { accountId: 'ben', workspace: ACME, role: 'MEMBER', deactivatedAt: NOW },
      { accountId: 'cat', workspace: OTHER, role: 'MEMBER' },
    );

    await expect(
      useCase.execute(deactivation('ann', 'ADMIN', 'ben')),
    ).rejects.toThrow(MemberNotFoundError);
    await expect(
      useCase.execute(deactivation('ann', 'ADMIN', 'cat')),
    ).rejects.toThrow(MemberNotFoundError);
    expect(memberDeactivating.deactivations).toEqual([]);
  });

  it('refuses an Admin who was made a Member before the lock was theirs', async () => {
    const { memberDeactivating, useCase } = setUp({
      ann: 'MEMBER',
      ben: 'MEMBER',
    });

    // The route resolved Ann as an Admin; by the time the lock is hers, she is not.
    await expect(
      useCase.execute(deactivation('ann', 'ADMIN', 'ben')),
    ).rejects.toThrow(NotAllowedToDeactivateError);
    expect(memberDeactivating.deactivations).toEqual([]);
  });
});

describe('a Member Deactivating someone else', () => {
  it('is refused', async () => {
    const { memberDeactivating, useCase } = setUp({
      ann: 'ADMIN',
      ben: 'MEMBER',
    });

    await expect(
      useCase.execute(deactivation('ben', 'MEMBER', 'ann')),
    ).rejects.toThrow(NotAllowedToDeactivateError);
    expect(memberDeactivating.deactivations).toEqual([]);
  });
});

describe('leaving, by Deactivating yourself', () => {
  it('lets a Member leave', async () => {
    const { memberDeactivating, useCase } = setUp({
      ann: 'ADMIN',
      ben: 'MEMBER',
    });

    await useCase.execute(deactivation('ben', 'MEMBER', 'ben'));

    expect(memberDeactivating.deactivations).toEqual([
      { workspaceId: ACME.id, accountId: 'ben', deactivatedAt: NOW },
    ]);
  });

  it('lets an Admin leave while another active Admin stays', async () => {
    const { memberDeactivating, useCase } = setUp({
      ann: 'ADMIN',
      ben: 'ADMIN',
    });

    await useCase.execute(deactivation('ann', 'ADMIN', 'ann'));

    expect(memberDeactivating.deactivations).toHaveLength(1);
  });

  it('refuses the last active Admin, counting no Deactivated Admin', async () => {
    const { membershipQuery, memberDeactivating, useCase } = setUp({
      ann: 'ADMIN',
      ben: 'MEMBER',
    });
    membershipQuery.memberships.push({
      accountId: 'cat',
      workspace: ACME,
      role: 'ADMIN',
      deactivatedAt: NOW,
    });

    await expect(
      useCase.execute(deactivation('ann', 'ADMIN', 'ann')),
    ).rejects.toThrow(LastAdminError);
    expect(memberDeactivating.deactivations).toEqual([]);
  });
});
