import { describe, expect, it } from 'bun:test';
import { FakeClock } from '@test/support/clock.fake';
import { FakeInvitationQuery } from '@test/support/workspace.fakes';
import type { PendingInvitationView } from '../types/invitation.types';
import { ListMyInvitationsUseCase } from './list-my-invitations.use-case';

const NOW = new Date('2026-10-10T03:00:00Z');

function anInvitationTo(workspaceName: string): PendingInvitationView {
  return {
    invitationId: '0199a0f0-0000-7000-8000-000000000001',
    workspace: {
      id: '0199a0f0-0000-7000-8000-0000000000aa',
      name: workspaceName,
      memberCount: 3,
    },
    invitedAt: new Date('2026-10-09T03:00:00Z'),
    expiresAt: new Date('2026-10-16T03:00:00Z'),
  };
}

describe('listing the Invitations sent to me', () => {
  it('finds them whatever case the Account signed in with', async () => {
    const invitationQuery = new FakeInvitationQuery();
    invitationQuery.sentTo.set('ann@acme.co', [anInvitationTo('Acme')]);
    const listMyInvitations = new ListMyInvitationsUseCase(
      invitationQuery,
      new FakeClock(NOW),
    );

    const page = await listMyInvitations.execute({
      accountEmail: 'Ann@Acme.co',
      page: { page: 1, pageSize: 20 },
    });

    expect(page.items.map((i) => i.workspace.name)).toEqual(['Acme']);
  });
});
