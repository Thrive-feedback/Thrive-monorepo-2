import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InvitationList } from './invitation-list';

const readInvitations = vi.fn();
vi.mock(
  '@/app/(signed-in)/(side-nav)/settings/members/_lib/invitations.service',
  () => ({
    readInvitations: (...args: unknown[]) => readInvitations(...args),
  }),
);
vi.mock(
  '@/app/(signed-in)/(side-nav)/settings/members/_lib/invitation-actions.service',
  () => ({ revokeInvitation: vi.fn(), resendInvitation: vi.fn() }),
);

const MEMBERSHIP = {
  workspace: { id: 'w-1', name: 'Acme Corp' },
  role: 'OWNER',
} as const;

const CAT = {
  invitationId: '0199a0f0-0000-7000-8000-000000000003',
  email: 'cat@acme.test',
  status: 'PENDING',
  invitedBy: 'Ann',
  invitedAt: '2026-10-06T03:00:00.000Z',
  expiresAt: '2026-10-13T03:00:00.000Z',
} as const;

const DAN = {
  invitationId: '0199a0f0-0000-7000-8000-000000000004',
  email: 'dan@acme.test',
  status: 'EXPIRED',
  invitedBy: 'ben@acme.test',
  invitedAt: '2026-10-01T03:00:00.000Z',
  expiresAt: '2026-10-08T03:00:00.000Z',
} as const;

async function renderList() {
  render(await InvitationList({ membership: MEMBERSHIP }));
}

describe('InvitationList', () => {
  it('shows who sent each, when, and when it expires or expired', async () => {
    readInvitations.mockResolvedValue([CAT, DAN]);

    await renderList();

    const [cat, dan] = screen.getAllByRole('listitem');
    expect(cat).toHaveTextContent(
      'by Ann · sent 6 Oct 2026 · expires 13 Oct 2026',
    );
    expect(dan).toHaveTextContent(
      'by ben@acme.test · sent 1 Oct 2026 · expired 8 Oct 2026',
    );
  });

  it('colours each status by where it stands', async () => {
    readInvitations.mockResolvedValue([CAT, DAN]);

    await renderList();

    expect(screen.getByText('Pending')).toHaveClass('text-status-warning');
    expect(screen.getByText('Expired')).toHaveClass('text-status-error');
  });

  it('offers to resend and to revoke each, expired ones included', async () => {
    readInvitations.mockResolvedValue([CAT, DAN]);

    await renderList();

    expect(
      screen.getAllByRole('button').map((b) => b.getAttribute('aria-label')),
    ).toEqual([
      'Resend invitation to cat@acme.test',
      'Revoke invitation to cat@acme.test',
      'Resend invitation to dan@acme.test',
      'Revoke invitation to dan@acme.test',
    ]);
  });

  it('says so when nobody is waiting', async () => {
    readInvitations.mockResolvedValue([]);

    await renderList();

    expect(screen.getByText('No invitations waiting.')).toBeInTheDocument();
  });
});
