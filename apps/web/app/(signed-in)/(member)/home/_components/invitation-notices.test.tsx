import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InvitationNotices } from './invitation-notices';

const readInvitationsWaiting = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  readInvitationsWaiting: () => readInvitationsWaiting(),
}));

const TO_GLOBEX = {
  invitationId: '0199a0f0-0000-7000-8000-000000000001',
  workspace: { name: 'Globex', memberCount: 4 },
  invitedAt: new Date('2026-10-10T03:00:00.000Z'),
};

describe('InvitationNotices', () => {
  it('names each Workspace waiting for the person, with a link to its Invitation', async () => {
    readInvitationsWaiting.mockResolvedValue([TO_GLOBEX]);

    render(await InvitationNotices());

    const notices = screen.getByRole('list', {
      name: 'Invitations waiting for you',
    });
    expect(notices).toHaveTextContent("You've been invited to Globex");
    expect(
      screen.getByRole('link', { name: 'See the invitation' }),
    ).toHaveAttribute('href', `/invitations/${TO_GLOBEX.invitationId}`);
  });

  it('shows nothing while no Invitation is waiting', async () => {
    readInvitationsWaiting.mockResolvedValue([]);

    expect(await InvitationNotices()).toBeNull();
  });
});
