import { describe, expect, it } from 'bun:test';
import { FakeClock } from '@test/support/clock.fake';
import { FakeInvitationQuery } from '@test/support/workspace.fakes';
import type { MemberRoleValue } from '../../domain/value-object/member-role.vo';
import { NotAllowedToSeeInvitationsError } from '../workspace.errors';
import { ListWorkspaceInvitationsUseCase } from './list-workspace-invitations.use-case';

const ACME_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const NOW = new Date('2026-10-10T03:00:00Z');

function setUp() {
  const invitationQuery = new FakeInvitationQuery();
  invitationQuery.invitations.push(
    {
      workspaceId: ACME_ID,
      invitationId: '0199a0f0-0000-7000-8000-000000000001',
      email: 'ben@acme.co',
      role: 'MEMBER',
      expiresAt: new Date('2026-10-15T03:00:00Z'),
    },
    {
      workspaceId: ACME_ID,
      invitationId: '0199a0f0-0000-7000-8000-000000000002',
      email: 'cat@acme.co',
      role: 'MEMBER',
      expiresAt: new Date('2026-10-01T03:00:00Z'),
    },
  );
  return new ListWorkspaceInvitationsUseCase(
    invitationQuery,
    new FakeClock(NOW),
  );
}

function asA(role: MemberRoleValue) {
  return {
    membership: { workspace: { id: ACME_ID, name: 'Acme' }, role },
    page: { page: 1, pageSize: 20 },
  };
}

describe('listing the Invitations of a Workspace', () => {
  it('shows the Owner each one still waiting, as pending or expired', async () => {
    const invitations = await setUp().execute(asA('OWNER'));

    expect(invitations.items.map((i) => [i.email, i.status])).toEqual([
      ['ben@acme.co', 'PENDING'],
      ['cat@acme.co', 'EXPIRED'],
    ]);
  });

  it('shows an Admin them too', async () => {
    expect((await setUp().execute(asA('ADMIN'))).total).toBe(2);
  });

  it('refuses a Member with no management rights', async () => {
    await expect(setUp().execute(asA('MEMBER'))).rejects.toThrow(
      NotAllowedToSeeInvitationsError,
    );
  });
});
