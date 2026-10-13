import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Settings from './page';

const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: () => requireMember(),
}));

describe('Settings', () => {
  it('lets the gate turn away anyone who may not be here', async () => {
    requireMember.mockRejectedValue(new Error('redirect:/signin'));

    await expect(Settings()).rejects.toThrow('redirect:/signin');
  });

  it('lists each category, linking to its page', async () => {
    requireMember.mockResolvedValue({});

    render(await Settings());

    expect(screen.getByRole('link', { name: 'Members' })).toHaveAttribute(
      'href',
      '/settings/members',
    );
    expect(
      screen.getByText(
        'Who is in your Workspace, and the invitations still open.',
      ),
    ).toBeInTheDocument();
  });
});
