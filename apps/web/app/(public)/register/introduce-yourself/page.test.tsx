import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import IntroduceYourselfPage from './page';

const readSession = vi.fn();
vi.mock('@/app/(public)/_lib/session.service', () => ({
  readSession: () => readSession(),
}));
vi.mock('@/app/(public)/_lib/session-actions.service', () => ({
  signOut: vi.fn(),
}));
vi.mock('@/app/(public)/_components/one-time-toast', () => ({
  OneTimeToast: ({ type, message }: { type: string; message: string }) => (
    <output>{`${type} toast: ${message}`}</output>
  ),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
  useRouter: () => ({ push: vi.fn() }),
}));

function open(searchParams: Record<string, string> = {}) {
  return IntroduceYourselfPage({ searchParams: Promise.resolve(searchParams) });
}

describe('IntroduceYourselfPage', () => {
  it('sends a signed-out visitor to sign-in', async () => {
    readSession.mockResolvedValue(null);

    await expect(open()).rejects.toThrow('redirect:/login');
  });

  it('greets someone who has just signed in for the first time', async () => {
    readSession.mockResolvedValue({ email: 'ann@acme.test', name: 'Ann Lee' });

    render(await open({ signedIn: '1' }));

    expect(
      screen.getByText('success toast: Signed in as ann@acme.test'),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Full Name' })).toHaveValue(
      'Ann Lee',
    );
  });
});
