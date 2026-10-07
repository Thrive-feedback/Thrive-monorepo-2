import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import IntroduceYourselfPage from './page';

const ANN = { email: 'ann@acme.test', name: 'Ann Lee', profile: null };

const requireAccountToIntroduce = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireAccountToIntroduce: (signedIn?: string) =>
    requireAccountToIntroduce(signedIn),
}));
vi.mock('@/lib/session/session-actions.service', () => ({
  signOut: vi.fn(),
}));
vi.mock('./_lib/profile-actions.service', () => ({
  saveProfile: vi.fn(),
}));
vi.mock('@/components/atoms/one-time-toast', () => ({
  OneTimeToast: ({ type, message }: { type: string; message: string }) => (
    <output>{`${type} toast: ${message}`}</output>
  ),
}));

function open(searchParams: Record<string, string> = {}) {
  return IntroduceYourselfPage({ searchParams: Promise.resolve(searchParams) });
}

describe('IntroduceYourselfPage', () => {
  it('lets the gate turn away anyone who may not be here', async () => {
    requireAccountToIntroduce.mockRejectedValue(new Error('redirect:/home'));

    await expect(open()).rejects.toThrow('redirect:/home');
  });

  it('tells the gate the person has just signed in, so a redirect keeps the toast', async () => {
    requireAccountToIntroduce.mockResolvedValue(ANN);

    await open({ signedIn: '1' });

    expect(requireAccountToIntroduce).toHaveBeenLastCalledWith('1');
  });

  it('greets someone who has just signed in and pre-fills their name', async () => {
    requireAccountToIntroduce.mockResolvedValue(ANN);

    render(await open({ signedIn: '1' }));

    expect(
      screen.getByText('success toast: Signed in as ann@acme.test'),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Full Name' })).toHaveValue(
      'Ann Lee',
    );
  });
});
