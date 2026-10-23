import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DisconnectIntegrationButton } from './disconnect-integration-button';

const disconnectIntegration = vi.fn();
vi.mock(
  '@/app/(signed-in)/(member)/settings/workspace/_lib/integration-actions.service',
  () => ({
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

function renderButton() {
  render(
    <DisconnectIntegrationButton
      segment="discord"
      label="Discord"
      channelName="standups"
    />,
  );
}

async function openTheQuestion() {
  const user = userEvent.setup();
  renderButton();
  await user.click(screen.getByRole('button', { name: 'Disconnect Discord' }));
  return user;
}

/** The one inside the question, not the one that opened it. */
function confirmButton() {
  return within(screen.getByRole('alertdialog')).getByRole('button', {
    name: 'Disconnect',
  });
}

describe('DisconnectIntegrationButton', () => {
  it('asks first, and says that direct messages stop too', async () => {
    await openTheQuestion();

    const dialog = screen.getByRole('alertdialog', {
      name: 'Disconnect Discord?',
    });
    expect(dialog).toHaveTextContent(
      'everyone who linked their own Discord account will stop being messaged by Thrive',
    );
  });

  it('names the channel that stops hearing about Feedback', async () => {
    await openTheQuestion();

    expect(
      screen.getByRole('alertdialog', { name: 'Disconnect Discord?' }),
    ).toHaveTextContent('#standups will stop hearing about Feedback');
  });

  it('says connecting again starts from the beginning', async () => {
    await openTheQuestion();

    expect(
      screen.getByRole('alertdialog', { name: 'Disconnect Discord?' }),
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
