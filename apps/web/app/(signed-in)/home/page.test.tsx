import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Home from './page';

const ANN = {
  email: 'ann@acme.test',
  name: 'Ann Lee',
  profile: { fullName: 'Ann Lee', displayName: 'Ann', slug: 'ann' },
};

const requireIntroducedAccount = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireIntroducedAccount: (signedIn?: string) =>
    requireIntroducedAccount(signedIn),
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
    requireIntroducedAccount.mockRejectedValue(new Error('redirect:/login'));

    await expect(open()).rejects.toThrow('redirect:/login');
  });

  it('tells the gate the person has just signed in, so a redirect keeps the toast', async () => {
    requireIntroducedAccount.mockResolvedValue(ANN);

    await open({ signedIn: '1' });

    expect(requireIntroducedAccount).toHaveBeenLastCalledWith('1');
  });

  it('shows Home to someone who has introduced themselves', async () => {
    requireIntroducedAccount.mockResolvedValue(ANN);

    render(await open());

    expect(
      screen.getByRole('heading', { level: 1, name: 'Thrive' }),
    ).toBeInTheDocument();
  });

  it('says who signed in when Google has just sent them back', async () => {
    requireIntroducedAccount.mockResolvedValue(ANN);

    render(await open({ signedIn: '1' }));

    expect(
      screen.getByText('success toast: Signed in as ann@acme.test'),
    ).toBeInTheDocument();
  });

  it('raises no toast on an ordinary visit', async () => {
    requireIntroducedAccount.mockResolvedValue(ANN);

    render(await open());

    expect(screen.queryByText(/success toast/)).toBeNull();
  });
});
