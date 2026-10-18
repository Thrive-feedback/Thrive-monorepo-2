import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Settings from './page';

const ANN = {
  email: 'ann@acme.test',
  name: 'Ann Google',
  profile: { fullName: 'Ann Marie Lee', displayName: 'Ann Lee', slug: 'ann' },
  membership: { workspace: { id: 'w-1', name: 'Acme Corp' }, role: 'ADMIN' },
};

const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: () => requireMember(),
}));
vi.mock('@/lib/session/session-actions.service', () => ({
  signOut: vi.fn(),
}));

describe('Settings', () => {
  it('lets the gate turn away anyone who may not be here', async () => {
    requireMember.mockRejectedValue(new Error('redirect:/signin'));

    await expect(Settings()).rejects.toThrow('redirect:/signin');
  });

  it('opens on the Account section', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await Settings());

    expect(
      screen.getByRole('heading', { level: 3, name: 'Ann Marie Lee' }),
    ).toBeInTheDocument();
  });
});
