import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Home from './page';

const readSession = vi.fn();
vi.mock('@/app/(public)/_lib/session.service', () => ({
  readSession: () => readSession(),
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
}));

function open(searchParams: Record<string, string> = {}) {
  return Home({ searchParams: Promise.resolve(searchParams) });
}

describe('Home', () => {
  it('sends a signed-out visitor to sign-in', async () => {
    readSession.mockResolvedValue(null);

    await expect(open()).rejects.toThrow('redirect:/login');
  });

  it('shows Home to whoever is signed in', async () => {
    readSession.mockResolvedValue({ email: 'ann@acme.test', name: 'Ann Lee' });

    render(await open());

    expect(
      screen.getByRole('heading', { level: 1, name: 'Thrive' }),
    ).toBeInTheDocument();
  });

  it('says who signed in when Google has just sent them back', async () => {
    readSession.mockResolvedValue({ email: 'ann@acme.test', name: 'Ann Lee' });

    render(await open({ signedIn: '1' }));

    expect(
      screen.getByText('success toast: Signed in as ann@acme.test'),
    ).toBeInTheDocument();
  });

  it('raises no toast on an ordinary visit', async () => {
    readSession.mockResolvedValue({ email: 'ann@acme.test', name: 'Ann Lee' });

    render(await open());

    expect(screen.queryByText(/success toast/)).toBeNull();
  });
});
