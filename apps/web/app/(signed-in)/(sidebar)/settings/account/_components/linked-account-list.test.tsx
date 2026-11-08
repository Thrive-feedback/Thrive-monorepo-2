import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LinkedAccountList } from './linked-account-list';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const readLinkedAccounts = vi.fn();
vi.mock(
  '@/app/(signed-in)/(sidebar)/settings/account/_lib/linked-accounts.service',
  () => ({
    readLinkedAccounts: (...args: unknown[]) => readLinkedAccounts(...args),
  }),
);
vi.mock(
  '@/app/(signed-in)/(sidebar)/settings/account/_lib/account-link-actions.service',
  () => ({ beginAccountLink: vi.fn(), unlinkAccount: vi.fn() }),
);

const DISCORD = {
  provider: 'DISCORD',
  externalUsername: 'ann#0001',
  linkedAt: '2026-10-24T03:00:00.000Z',
} as const;

beforeEach(() => {
  readLinkedAccounts.mockReset();
});

async function renderList() {
  render(await LinkedAccountList());
}

describe('LinkedAccountList', () => {
  it('names every chat tool a Member can link, with the button to link it', async () => {
    readLinkedAccounts.mockResolvedValue([]);

    await renderList();

    expect(screen.getByText('Discord')).toBeInTheDocument();
    expect(screen.getByText('Not linked')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Link Discord' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Manage Discord link' }),
    ).toBeNull();
  });

  it('says what linking turns on, before it is pressed', async () => {
    readLinkedAccounts.mockResolvedValue([]);

    await renderList();

    // Linking is the switch — there are no preferences to find afterwards, so the row has to
    // say what it does before somebody presses it (brain `ADR-0035` §6), behind its ⓘ.
    await userEvent
      .setup()
      .hover(screen.getByRole('button', { name: 'About Discord' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Get a direct message in Discord when someone asks you for Feedback, answers your request, or writes Feedback to you. Works once your Workspace has connected Discord.',
    );
  });

  it('says only that it is linked, with the rest in its menu', async () => {
    readLinkedAccounts.mockResolvedValue([DISCORD]);

    await renderList();

    expect(screen.getByText('Linked')).toHaveClass(
      'text-status-success-active',
    );
    expect(screen.queryByText(/ann#0001/)).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Manage Discord link' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Link Discord' })).toBeNull();
  });
});
