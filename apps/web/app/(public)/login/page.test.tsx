import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LoginPage from './page';

const readSession = vi.fn();
vi.mock('@/app/(public)/_lib/session.service', () => ({
  readSession: () => readSession(),
}));
vi.mock('@/app/(public)/_lib/session-actions.service', () => ({
  signIn: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));
vi.mock('@/app/(public)/_components/one-time-toast', () => ({
  OneTimeToast: ({ type, message }: { type: string; message: string }) => (
    <output>{`${type} toast: ${message}`}</output>
  ),
}));

function open(searchParams: Record<string, string> = {}) {
  return LoginPage({ searchParams: Promise.resolve(searchParams) });
}

describe('LoginPage', () => {
  it('sends someone already signed in to Home', async () => {
    readSession.mockResolvedValue({ email: 'ann@acme.test', name: 'Ann Lee' });

    await expect(open()).rejects.toThrow('redirect:/home');
  });

  it('offers Google sign-in, with no message on a first visit', async () => {
    readSession.mockResolvedValue(null);

    render(await open());

    expect(
      screen.getByRole('button', { name: 'Continue with Google' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("error toast: Sign-in didn't finish. Try again."),
    ).toBeNull();
  });

  it('raises the failure toast when the last attempt came back with an error', async () => {
    readSession.mockResolvedValue(null);

    render(await open({ error: 'access_denied' }));

    expect(
      screen.getByText("error toast: Sign-in didn't finish. Try again."),
    ).toBeInTheDocument();
  });
});
