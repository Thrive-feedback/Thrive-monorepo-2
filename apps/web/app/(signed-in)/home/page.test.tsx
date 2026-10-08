import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Home from './page';

const ANN = {
  email: 'ann@acme.test',
  name: 'Ann Lee',
  profile: { fullName: 'Ann Lee', displayName: 'Ann', slug: 'ann' },
  membership: {
    workspace: { id: 'w-1', name: 'Acme Corp' },
    role: 'OWNER',
  },
};

const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: (signedIn?: string) => requireMember(signedIn),
}));
vi.mock('@/components/atoms/one-time-toast', () => ({
  OneTimeToast: ({ type, message }: { type: string; message: string }) => (
    <output>{`${type} toast: ${message}`}</output>
  ),
}));

function open(searchParams: Record<string, string> = {}) {
  return Home({ searchParams: Promise.resolve(searchParams) });
}

describe('Home', () => {
  it('lets the gate turn away anyone who may not be here', async () => {
    requireMember.mockRejectedValue(new Error('redirect:/signin'));

    await expect(open()).rejects.toThrow('redirect:/signin');
  });

  it('tells the gate the person has just signed in, so a redirect keeps the toast', async () => {
    requireMember.mockResolvedValue(ANN);

    await open({ signedIn: '1' });

    expect(requireMember).toHaveBeenLastCalledWith('1');
  });

  it("shows a Member their Workspace's Home, and that they are its Owner", async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open());

    expect(
      screen.getByRole('heading', { level: 1, name: 'Acme Corp' }),
    ).toBeInTheDocument();
    expect(screen.getByText('You’re the Owner')).toBeInTheDocument();
  });

  it('says who signed in when Google has just sent them back', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open({ signedIn: '1' }));

    expect(
      screen.getByText('success toast: Signed in as ann@acme.test'),
    ).toBeInTheDocument();
  });

  it('raises no toast on an ordinary visit', async () => {
    requireMember.mockResolvedValue(ANN);

    render(await open());

    expect(screen.queryByText(/success toast/)).toBeNull();
  });
});
