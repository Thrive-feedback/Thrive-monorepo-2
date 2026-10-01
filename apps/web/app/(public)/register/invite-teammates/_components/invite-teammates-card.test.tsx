import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InviteTeammatesCard } from './invite-teammates-card';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe('InviteTeammatesCard', () => {
  it('invites by email only, with no invite link', () => {
    render(<InviteTeammatesCard />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Invite your teammates' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Send invites & Done' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /link/i })).toBeNull();
  });
});
