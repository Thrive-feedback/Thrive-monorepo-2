import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SignInPage from './page';

const readSession = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  readSession: () => readSession(),
}));
const signIn = vi.fn<(destination: string | null) => Promise<void>>();
vi.mock('@/lib/session/session-actions.service', () => ({
  signIn: (destination: string | null) => signIn(destination),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));
vi.mock('@/components/atoms/one-time-toast', () => ({
  OneTimeToast: ({ type, message }: { type: string; message: string }) => (
    <output>{`${type} toast: ${message}`}</output>
  ),
}));

function open(searchParams: Record<string, string> = {}) {
  return SignInPage({ searchParams: Promise.resolve(searchParams) });
}

async function signInFrom(searchParams: Record<string, string>) {
  readSession.mockResolvedValue(null);
  render(await open(searchParams));

  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Continue with Google' }));
}

beforeEach(() => {
  signIn.mockReset().mockResolvedValue(undefined);
});

describe('SignInPage', () => {
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

  it('carries the page the visitor was going to into signing in', async () => {
    const next = '/home?tab=waiting&ask=0199a0f0-0000-7000-8000-000000000001';

    await signInFrom({ next });

    expect(signIn).toHaveBeenCalledWith(next);
  });

  it.each([
    'https://evil.test/phish',
    '//evil.test',
    'javascript:alert(1)',
    '/home?signedIn=1',
  ])('drops %j, so signing in lands the person on Home', async (next) => {
    await signInFrom({ next });

    expect(signIn).toHaveBeenCalledWith(null);
  });

  it('sends someone already signed in to Home, wherever the link pointed', async () => {
    readSession.mockResolvedValue({ email: 'ann@acme.test', name: 'Ann Lee' });

    await expect(open({ next: '/settings/members' })).rejects.toThrow(
      'redirect:/home',
    );
  });

  it('raises the failure toast when the last attempt came back with an error', async () => {
    readSession.mockResolvedValue(null);

    render(await open({ error: 'access_denied' }));

    expect(
      screen.getByText("error toast: Sign-in didn't finish. Try again."),
    ).toBeInTheDocument();
  });
});
