import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LinkedAccountList } from './linked-account-list';

const readLinkedAccounts = vi.fn();
vi.mock(
  '@/app/(signed-in)/(member)/settings/account/_lib/linked-accounts.service',
  () => ({
    readLinkedAccounts: (...args: unknown[]) => readLinkedAccounts(...args),
  }),
);
vi.mock(
  '@/app/(signed-in)/(member)/settings/account/_lib/account-link-actions.service',
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
  it('names every chat tool a Member can link, with nothing linked', async () => {
    readLinkedAccounts.mockResolvedValue([]);

    await renderList();

    expect(screen.getByText('Discord')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Link Discord' }),
    ).toBeInTheDocument();
  });

  it('says what linking turns on, before it is pressed', async () => {
    readLinkedAccounts.mockResolvedValue([]);

    await renderList();

    // Linking is the switch — there are no preferences to find afterwards, so the row has to
    // say what it does before somebody presses it (brain `ADR-0035` §6).
    expect(
      screen.getByText(/Thrive will message you there/),
    ).toBeInTheDocument();
  });

  it('shows which account is linked, and when', async () => {
    readLinkedAccounts.mockResolvedValue([DISCORD]);

    await renderList();

    expect(screen.getByText(/Linked as ann#0001/)).toBeInTheDocument();
  });

  it('says a link alone is not enough without the Workspace connecting the tool', async () => {
    readLinkedAccounts.mockResolvedValue([DISCORD]);

    await renderList();

    expect(
      screen.getByText(/Workspace also has to have connected/),
    ).toBeInTheDocument();
  });

  it('offers unlinking only once something is linked', async () => {
    readLinkedAccounts.mockResolvedValue([]);
    await renderList();

    expect(
      screen.queryByRole('button', { name: 'Unlink Discord' }),
    ).not.toBeInTheDocument();
  });

  it('offers changing and unlinking when something is linked', async () => {
    readLinkedAccounts.mockResolvedValue([DISCORD]);

    await renderList();

    expect(
      screen.getByRole('button', { name: 'Change Discord account' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Unlink Discord' }),
    ).toBeInTheDocument();
  });

  it('shows nothing linked when the read fails, rather than breaking Settings', async () => {
    readLinkedAccounts.mockResolvedValue([]);

    await renderList();

    expect(
      screen.getByRole('button', { name: 'Link Discord' }),
    ).toBeInTheDocument();
  });
});
