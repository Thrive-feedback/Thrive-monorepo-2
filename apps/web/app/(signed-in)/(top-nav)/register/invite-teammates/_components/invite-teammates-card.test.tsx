import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InviteTeammatesCard } from './invite-teammates-card';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock(
  '@/app/(signed-in)/(top-nav)/register/invite-teammates/_lib/invitation-actions.service',
  () => ({
    sendInvitations: vi.fn(),
  }),
);

describe('InviteTeammatesCard', () => {
  it('invites by email only, with no invite link', () => {
    render(<InviteTeammatesCard workspaceId={WORKSPACE_ID} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Invite your teammates' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Send invites & Done' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /link/i })).toBeNull();
  });
});
