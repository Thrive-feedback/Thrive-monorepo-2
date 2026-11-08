import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectionActions } from './connection-actions';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const disconnectIntegration = vi.fn();
vi.mock(
  '@/app/(signed-in)/(sidebar)/settings/workspace/_lib/integration-actions.service',
  () => ({
    beginInstall: vi.fn(),
    disconnectIntegration: (segment: string) => disconnectIntegration(segment),
  }),
);

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

beforeEach(() => {
  disconnectIntegration.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
});

const CONNECTION = {
  provider: 'DISCORD',
  spaceName: 'Acme HQ',
  channelName: 'standups',
  connectedBy: 'Ann',
  connectedAt: '2026-10-24T03:00:00.000Z',
} as const;

function renderMenu(mayManage = true) {
  render(
    <ConnectionActions
      segment="discord"
      label="Discord"
      connection={CONNECTION}
      mayManage={mayManage}
    />,
  );
}

async function openTheMenu(mayManage = true) {
  const user = userEvent.setup();
  renderMenu(mayManage);
  await user.click(
    screen.getByRole('button', { name: 'Manage Discord connection' }),
  );
  return user;
}

async function openTheQuestion() {
  const user = await openTheMenu();
  await user.click(screen.getByRole('menuitem', { name: 'Disconnect' }));
  return user;
}

/** The one inside the question, not the one that opened it. */
function confirmButton() {
  return within(screen.getByRole('dialog')).getByRole('button', {
    name: 'Disconnect',
  });
}

describe('ConnectionActions', () => {
  it('shows an Admin where it posts, and lets them change or disconnect it', async () => {
    const user = await openTheMenu();

    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent),
    ).toEqual(['Information', 'Change', 'Disconnect']);

    await user.click(screen.getByRole('menuitem', { name: 'Information' }));

    const details = screen.getByRole('dialog', { name: 'Discord' });
    expect(details).toHaveTextContent('Channel#standups');
    expect(details).toHaveTextContent('ServerAcme HQ');
    expect(details).toHaveTextContent('Connected byAnn');
    expect(details).toHaveTextContent('Connected24 Oct 2026');
  });

  it('lets a Member read where it posts, and nothing more', async () => {
    await openTheMenu(false);

    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent),
    ).toEqual(['Information']);
  });

  it('asks first, and says that direct messages stop too', async () => {
    await openTheQuestion();

    const dialog = screen.getByRole('dialog', {
      name: 'Disconnect Discord?',
    });
    expect(dialog).toHaveTextContent(
      'everyone who linked their own Discord account will stop being messaged by Thrive',
    );
  });

  it('names the channel that stops hearing about Feedback', async () => {
    await openTheQuestion();

    expect(
      screen.getByRole('dialog', { name: 'Disconnect Discord?' }),
    ).toHaveTextContent('#standups will stop hearing about Feedback');
  });

  it('says connecting again starts from the beginning', async () => {
    await openTheQuestion();

    expect(
      screen.getByRole('dialog', { name: 'Disconnect Discord?' }),
    ).toHaveTextContent(
      'Connecting again means authorising Thrive in Discord from the start',
    );
  });

  it('does nothing at all when the answer is to stay connected', async () => {
    const user = await openTheQuestion();

    await user.click(screen.getByRole('button', { name: 'Stay connected' }));

    expect(disconnectIntegration).not.toHaveBeenCalled();
  });

  it('disconnects the tool it names, and says so', async () => {
    disconnectIntegration.mockResolvedValue({ ok: true });
    const user = await openTheQuestion();

    await user.click(confirmButton());

    expect(disconnectIntegration).toHaveBeenCalledWith('discord');
    expect(toast.success).toHaveBeenCalledWith('Discord is disconnected');
  });

  it('says why when the API refused, and leaves the dialog behind', async () => {
    disconnectIntegration.mockResolvedValue({
      ok: false,
      message: 'Only Admins can disconnect a chat tool from this workspace.',
    });
    const user = await openTheQuestion();

    await user.click(confirmButton());

    expect(toast.error).toHaveBeenCalledWith(
      'Only Admins can disconnect a chat tool from this workspace.',
    );
  });
});
