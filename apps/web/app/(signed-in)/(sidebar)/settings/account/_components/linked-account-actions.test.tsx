import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LinkedAccountActions } from './linked-account-actions';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const unlinkAccount = vi.fn();
vi.mock(
  '@/app/(signed-in)/(sidebar)/settings/account/_lib/account-link-actions.service',
  () => ({
    beginAccountLink: vi.fn(),
    unlinkAccount: (...args: unknown[]) => unlinkAccount(...args),
  }),
);

const success = vi.fn();
const failure = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => success(...args),
    error: (...args: unknown[]) => failure(...args),
  },
}));

beforeEach(() => {
  unlinkAccount.mockReset();
  success.mockReset();
  failure.mockReset();
});

const LINK = {
  provider: 'DISCORD',
  externalUsername: 'ann#0001',
  linkedAt: '2026-10-24T03:00:00.000Z',
} as const;

async function openTheMenu() {
  const user = userEvent.setup();
  render(
    <LinkedAccountActions segment="discord" label="Discord" link={LINK} />,
  );
  await user.click(screen.getByRole('button', { name: 'Manage Discord link' }));
  return user;
}

async function openTheQuestion() {
  const user = await openTheMenu();
  await user.click(screen.getByRole('menuitem', { name: 'Unlink' }));
  return user;
}

describe('LinkedAccountActions', () => {
  it('shows which account is linked and since when, and offers to change or unlink it', async () => {
    const user = await openTheMenu();

    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent),
    ).toEqual(['Information', 'Change', 'Unlink']);

    await user.click(screen.getByRole('menuitem', { name: 'Information' }));

    const details = screen.getByRole('dialog', { name: 'Discord' });
    expect(details).toHaveTextContent('Accountann#0001');
    expect(details).toHaveTextContent('Linked24 Oct 2026');
    expect(details).toHaveTextContent(
      'They reach you once your Workspace has connected Discord.',
    );
  });

  it('asks first, naming what stops and what does not', async () => {
    await openTheQuestion();

    expect(
      screen.getByText(/stop messaging you in Discord/),
    ).toBeInTheDocument();
    expect(screen.getByText(/forget that ann#0001 is you/)).toBeInTheDocument();
    expect(unlinkAccount).not.toHaveBeenCalled();
  });

  it('unlinks on confirming, and says so', async () => {
    unlinkAccount.mockResolvedValue({ ok: true });
    await openTheQuestion();
    await userEvent.click(
      screen.getAllByRole('button', { name: 'Unlink' }).at(-1) as HTMLElement,
    );

    expect(unlinkAccount).toHaveBeenCalledWith('discord');
    expect(success).toHaveBeenCalledWith('Discord is unlinked');
  });

  it('leaves the link alone when the person backs out', async () => {
    await openTheQuestion();
    await userEvent.click(screen.getByRole('button', { name: 'Stay linked' }));

    expect(unlinkAccount).not.toHaveBeenCalled();
  });

  it('says what went wrong when it could not unlink', async () => {
    unlinkAccount.mockResolvedValue({ ok: false, message: 'Nope.' });
    await openTheQuestion();
    await userEvent.click(
      screen.getAllByRole('button', { name: 'Unlink' }).at(-1) as HTMLElement,
    );

    expect(failure).toHaveBeenCalledWith('Nope.');
  });
});
