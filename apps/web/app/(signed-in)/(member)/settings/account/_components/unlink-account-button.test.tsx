import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnlinkAccountButton } from './unlink-account-button';

const unlinkAccount = vi.fn();
vi.mock(
  '@/app/(signed-in)/(member)/settings/account/_lib/account-link-actions.service',
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

function renderButton() {
  render(
    <UnlinkAccountButton
      segment="discord"
      label="Discord"
      externalUsername="ann#0001"
    />,
  );
}

describe('UnlinkAccountButton', () => {
  it('asks first, naming what stops and what does not', async () => {
    renderButton();

    await userEvent.click(
      screen.getByRole('button', { name: 'Unlink Discord' }),
    );

    expect(
      screen.getByText(/stop messaging you in Discord/),
    ).toBeInTheDocument();
    expect(screen.getByText(/forget that ann#0001 is you/)).toBeInTheDocument();
    expect(unlinkAccount).not.toHaveBeenCalled();
  });

  it('unlinks on confirming, and says so', async () => {
    unlinkAccount.mockResolvedValue({ ok: true });
    renderButton();

    await userEvent.click(
      screen.getByRole('button', { name: 'Unlink Discord' }),
    );
    await userEvent.click(
      screen.getAllByRole('button', { name: 'Unlink' }).at(-1) as HTMLElement,
    );

    expect(unlinkAccount).toHaveBeenCalledWith('discord');
    expect(success).toHaveBeenCalledWith('Discord is unlinked');
  });

  it('leaves the link alone when the person backs out', async () => {
    renderButton();

    await userEvent.click(
      screen.getByRole('button', { name: 'Unlink Discord' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Stay linked' }));

    expect(unlinkAccount).not.toHaveBeenCalled();
  });

  it('says what went wrong when it could not unlink', async () => {
    unlinkAccount.mockResolvedValue({ ok: false, message: 'Nope.' });
    renderButton();

    await userEvent.click(
      screen.getByRole('button', { name: 'Unlink Discord' }),
    );
    await userEvent.click(
      screen.getAllByRole('button', { name: 'Unlink' }).at(-1) as HTMLElement,
    );

    expect(failure).toHaveBeenCalledWith('Nope.');
  });
});
