import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InvitationList } from './invitation-list';

const readInvitations = vi.fn();
vi.mock(
  '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/invitations.service',
  () => ({
    readInvitations: (...args: unknown[]) => readInvitations(...args),
  }),
);
vi.mock(
  '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/invitation-actions.service',
  () => ({ revokeInvitation: vi.fn(), resendInvitation: vi.fn() }),
);

const MEMBERSHIP = {
  workspace: { id: 'w-1', name: 'Acme Corp' },
  role: 'ADMIN',
} as const;

const CAT = {
  invitationId: '0199a0f0-0000-7000-8000-000000000003',
  email: 'cat@acme.test',
  role: 'MEMBER',
  status: 'PENDING',
  invitedBy: 'Ann',
  invitedAt: '2026-10-06T03:00:00.000Z',
  expiresAt: '2026-10-13T03:00:00.000Z',
} as const;

const DAN = {
  invitationId: '0199a0f0-0000-7000-8000-000000000004',
  email: 'dan@acme.test',
  role: 'ADMIN',
  status: 'EXPIRED',
  invitedBy: 'ben@acme.test',
  invitedAt: '2026-10-01T03:00:00.000Z',
  expiresAt: '2026-10-08T03:00:00.000Z',
} as const;

async function renderList() {
  render(await InvitationList({ membership: MEMBERSHIP }));
}

describe('InvitationList', () => {
  it('shows each address and where it stands, and nothing more', async () => {
    readInvitations.mockResolvedValue([CAT, DAN]);

    await renderList();

    const [cat, dan] = screen.getAllByRole('listitem');
    expect(cat).toHaveTextContent(/^cat@acme\.testPending$/);
    expect(dan).toHaveTextContent(/^dan@acme\.testExpired$/);
  });

  it('shows the rest under Information: the Role, who sent it, when, and when it expires', async () => {
    readInvitations.mockResolvedValue([CAT, DAN]);
    const user = userEvent.setup();

    await renderList();
    await user.click(
      screen.getByRole('button', {
        name: 'Manage Invitation to dan@acme.test',
      }),
    );
    await user.click(screen.getByRole('menuitem', { name: 'Information' }));

    const details = screen.getByRole('dialog', { name: 'dan@acme.test' });
    expect(details).toHaveTextContent('StatusExpired');
    expect(details).toHaveTextContent('Joins asAdmin');
    expect(details).toHaveTextContent('Sent byben@acme.test');
    expect(details).toHaveTextContent('Sent1 Oct 2026');
    expect(details).toHaveTextContent('Expired8 Oct 2026');

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(
      screen.getByRole('button', {
        name: 'Manage Invitation to dan@acme.test',
      }),
    ).toHaveFocus();
  });

  it('colours each status by where it stands', async () => {
    readInvitations.mockResolvedValue([CAT, DAN]);

    await renderList();

    expect(screen.getByText('Pending')).toHaveClass(
      'text-status-warning-active',
    );
    expect(screen.getByText('Expired')).toHaveClass('text-status-error-active');
  });

  it('offers a menu on each to resend or revoke it, expired ones included', async () => {
    readInvitations.mockResolvedValue([CAT, DAN]);

    await renderList();

    expect(
      screen.getAllByRole('button').map((b) => b.getAttribute('aria-label')),
    ).toEqual([
      'Manage Invitation to cat@acme.test',
      'Manage Invitation to dan@acme.test',
    ]);
    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', {
        name: 'Manage Invitation to dan@acme.test',
      }),
    );
    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent),
    ).toEqual(['Information', 'Resend', 'Revoke']);
  });

  it('says so when nobody is waiting', async () => {
    readInvitations.mockResolvedValue([]);

    await renderList();

    expect(screen.getByText('No Invitations waiting.')).toBeInTheDocument();
  });
});
