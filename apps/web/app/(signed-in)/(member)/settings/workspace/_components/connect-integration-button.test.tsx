import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectIntegrationButton } from './connect-integration-button';

const beginInstall = vi.fn();
vi.mock(
  '@/app/(signed-in)/(member)/settings/workspace/_lib/integration-actions.service',
  () => ({ beginInstall: (segment: string) => beginInstall(segment) }),
);

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

beforeEach(() => {
  beginInstall.mockReset();
  toast.error.mockReset();
});

describe('ConnectIntegrationButton', () => {
  it('starts the install for the tool it names', async () => {
    const user = userEvent.setup();
    // A real install never answers: it sends the browser to the tool instead.
    beginInstall.mockReturnValue(new Promise(() => undefined));
    render(<ConnectIntegrationButton segment="discord" label="Discord" />);

    await user.click(screen.getByRole('button', { name: 'Connect Discord' }));

    expect(beginInstall).toHaveBeenCalledWith('discord');
  });

  it('says so when Thrive could not even say where to send them', async () => {
    const user = userEvent.setup();
    beginInstall.mockResolvedValue({
      ok: false,
      message: 'Only Admins can connect a chat tool to this workspace.',
    });
    render(<ConnectIntegrationButton segment="discord" label="Discord" />);

    await user.click(screen.getByRole('button', { name: 'Connect Discord' }));

    expect(toast.error).toHaveBeenCalledWith(
      'Only Admins can connect a chat tool to this workspace.',
    );
  });

  it('cannot be pressed twice while it is leaving', async () => {
    const user = userEvent.setup();
    beginInstall.mockReturnValue(new Promise(() => undefined));
    render(<ConnectIntegrationButton segment="discord" label="Discord" />);

    const button = screen.getByRole('button', { name: 'Connect Discord' });
    await user.click(button);

    expect(button).toBeDisabled();
    expect(beginInstall).toHaveBeenCalledTimes(1);
  });

  it('says it changes a connection the Workspace already has', () => {
    render(
      <ConnectIntegrationButton
        segment="discord"
        label="Discord"
        isConnected
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Change Discord connection' }),
    ).toHaveTextContent('Change');
  });
});
