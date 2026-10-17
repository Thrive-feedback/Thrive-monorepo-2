import { describe, expect, it } from 'bun:test';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  FakeMemberRoleChanging,
  FakeMembershipQuery,
} from '@test/support/workspace.fakes';
import type { MemberRoleValue } from '../../domain/value-object/member-role.vo';
import {
  LastAdminError,
  MemberRoleInvalidError,
} from '../../domain/workspace.errors';
import {
  MemberNotFoundError,
  NotAllowedToChangeRolesError,
} from '../workspace.errors';
import { ChangeMemberRoleUseCase } from './change-member-role.use-case';

const ACME = { id: '0199a0f0-0000-7000-8000-0000000000aa', name: 'Acme' };
const OTHER = { id: '0199a0f0-0000-7000-8000-0000000000bb', name: 'Other' };
const ANN_COOKIE = 'thrive.session_token=ann';

/** A Workspace whose Members hold the Roles given, keyed by Account. */
function setUp(roles: Record<string, MemberRoleValue>) {
  const membershipQuery = new FakeMembershipQuery();
  for (const [accountId, role] of Object.entries(roles)) {
    membershipQuery.memberships.push({ accountId, workspace: ACME, role });
  }
  const memberRoleChanging = new FakeMemberRoleChanging(membershipQuery);
  const unitOfWork = new FakeUnitOfWork();
  const useCase = new ChangeMemberRoleUseCase(
    memberRoleChanging,
    membershipQuery,
    unitOfWork,
  );
  return { membershipQuery, memberRoleChanging, unitOfWork, useCase };
}

/** `ann` changing `accountId`'s Role, as the route hands it over. */
function change(accountId: string, role: string) {
  return {
    credential: ANN_COOKIE,
    changerAccountId: 'ann',
    membership: { workspace: ACME, role: 'ADMIN' as const },
    accountId,
    role,
  };
}

async function roleOf(membershipQuery: FakeMembershipQuery, accountId: string) {
  return (await membershipQuery.membershipInWorkspace(accountId, ACME.id))
    ?.role;
}

describe('an Admin changing Roles', () => {
  it("makes a Member an Admin, on the Admin's own session", async () => {
    const { membershipQuery, memberRoleChanging, useCase } = setUp({
      ann: 'ADMIN',
      ben: 'MEMBER',
    });

    await useCase.execute(change('ben', 'ADMIN'));

    expect(await roleOf(membershipQuery, 'ben')).toBe('ADMIN');
    expect(memberRoleChanging.changes).toEqual([
      {
        credential: ANN_COOKIE,
        workspaceId: ACME.id,
        accountId: 'ben',
        role: 'ADMIN',
      },
    ]);
  });

  it('makes another Admin a Member', async () => {
    const { membershipQuery, useCase } = setUp({ ann: 'ADMIN', ben: 'ADMIN' });

    await useCase.execute(change('ben', 'MEMBER'));

    expect(await roleOf(membershipQuery, 'ben')).toBe('MEMBER');
  });

  it('makes themselves a Member while another Admin remains', async () => {
    const { membershipQuery, useCase } = setUp({ ann: 'ADMIN', ben: 'ADMIN' });

    await useCase.execute(change('ann', 'MEMBER'));

    expect(await roleOf(membershipQuery, 'ann')).toBe('MEMBER');
  });

  it('changes Roles serialized on the Workspace', async () => {
    const { unitOfWork, useCase } = setUp({ ann: 'ADMIN', ben: 'MEMBER' });

    await useCase.execute(change('ben', 'ADMIN'));

    expect(unitOfWork.opened).toEqual([
      { serializeOn: `workspace-roles:${ACME.id}` },
    ]);
  });

  it('stores nothing when the Member already holds the Role', async () => {
    const { memberRoleChanging, useCase } = setUp({ ann: 'ADMIN' });

    await useCase.execute(change('ann', 'ADMIN'));

    expect(memberRoleChanging.changes).toEqual([]);
  });
});

describe('a Workspace keeping an Admin', () => {
  it('refuses to make the last Admin a Member, themselves included', async () => {
    const { membershipQuery, memberRoleChanging, useCase } = setUp({
      ann: 'ADMIN',
      ben: 'MEMBER',
    });

    await expect(useCase.execute(change('ann', 'MEMBER'))).rejects.toThrow(
      LastAdminError,
    );
    expect(await roleOf(membershipQuery, 'ann')).toBe('ADMIN');
    expect(memberRoleChanging.changes).toEqual([]);
  });

  it('counts only the Admins of this Workspace', async () => {
    const { membershipQuery, useCase } = setUp({ ann: 'ADMIN' });
    membershipQuery.memberships.push({
      accountId: 'cara',
      workspace: OTHER,
      role: 'ADMIN',
    });

    await expect(useCase.execute(change('ann', 'MEMBER'))).rejects.toThrow(
      LastAdminError,
    );
  });
});

describe('who may change Roles', () => {
  it('refuses a Member with no management rights, and stores nothing', async () => {
    const { memberRoleChanging, useCase } = setUp({
      ann: 'MEMBER',
      ben: 'MEMBER',
    });

    await expect(useCase.execute(change('ben', 'ADMIN'))).rejects.toThrow(
      NotAllowedToChangeRolesError,
    );
    expect(memberRoleChanging.changes).toEqual([]);
  });

  it('refuses an Admin who was made a Member since their request began', async () => {
    const { membershipQuery, useCase } = setUp({ ann: 'MEMBER', ben: 'ADMIN' });

    await expect(useCase.execute(change('ben', 'MEMBER'))).rejects.toThrow(
      NotAllowedToChangeRolesError,
    );
    expect(await roleOf(membershipQuery, 'ben')).toBe('ADMIN');
  });

  it('answers someone from another Workspace as not found', async () => {
    const { membershipQuery, useCase } = setUp({ ann: 'ADMIN' });
    membershipQuery.memberships.push({
      accountId: 'cara',
      workspace: OTHER,
      role: 'MEMBER',
    });

    await expect(useCase.execute(change('cara', 'ADMIN'))).rejects.toThrow(
      MemberNotFoundError,
    );
  });

  it('refuses a Role that does not exist', async () => {
    const { useCase } = setUp({ ann: 'ADMIN', ben: 'MEMBER' });

    await expect(useCase.execute(change('ben', 'OWNER'))).rejects.toThrow(
      MemberRoleInvalidError,
    );
  });
});
