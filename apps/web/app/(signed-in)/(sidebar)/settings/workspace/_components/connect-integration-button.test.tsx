import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectIntegrationButton } from './connect-integration-button';

const beginInstall = vi.fn();
vi.mock(
  '@/app/(signed-in)/(sidebar)/settings/workspace/_lib/integration-actions.service',
  () => ({ beginInstall: (segment: string) => beginInstall(segment) }),
);

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

/** The tab the press opens, standing in for a real one. */
function aTab() {
  return { opener: {}, close: vi.fn(), location: { replace: vi.fn() } };
}

let tab: ReturnType<typeof aTab>;
const open = vi.fn();

beforeEach(() => {
  beginInstall.mockReset();
  toast.error.mockReset();
  push.mockReset();
  tab = aTab();
  open.mockReset().mockReturnValue(tab);
  vi.stubGlobal('open', open);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ConnectIntegrationButton', () => {
  it('opens the tool in a tab of its own, cut off from Thrive', async () => {
    const user = userEvent.setup();
    beginInstall.mockResolvedValue({
      ok: true,
      authorizeUrl: 'https://discord.com/oauth2/authorize?state=signed',
    });
    render(<ConnectIntegrationButton segment="discord" label="Discord" />);

    await user.click(screen.getByRole('button', { name: 'Connect Discord' }));

    expect(beginInstall).toHaveBeenCalledWith('discord');
    expect(open).toHaveBeenCalledWith('', '_blank');
    expect(tab.opener).toBeNull();
    expect(tab.location.replace).toHaveBeenCalledWith(
      'https://discord.com/oauth2/authorize?state=signed',
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('closes the tab and says why when Thrive could not say where to go', async () => {
    const user = userEvent.setup();
    beginInstall.mockResolvedValue({
      ok: false,
      message: 'Only Admins can connect a chat tool to this workspace.',
    });
    render(<ConnectIntegrationButton segment="discord" label="Discord" />);

    await user.click(screen.getByRole('button', { name: 'Connect Discord' }));

    expect(tab.close).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      'Only Admins can connect a chat tool to this workspace.',
    );
  });

  it('goes in this tab when the browser blocks a new one', async () => {
    const user = userEvent.setup();
    open.mockReturnValue(null);
    beginInstall.mockResolvedValue({
      ok: true,
      authorizeUrl: 'https://discord.com/oauth2/authorize?state=signed',
    });
    render(<ConnectIntegrationButton segment="discord" label="Discord" />);

    await user.click(screen.getByRole('button', { name: 'Connect Discord' }));

    expect(push).toHaveBeenCalledWith(
      'https://discord.com/oauth2/authorize?state=signed',
    );
  });

  it('cannot be pressed twice while it is on its way', async () => {
    const user = userEvent.setup();
    beginInstall.mockReturnValue(new Promise(() => undefined));
    render(<ConnectIntegrationButton segment="discord" label="Discord" />);

    const button = screen.getByRole('button', { name: 'Connect Discord' });
    await user.click(button);

    expect(button).toBeDisabled();
    expect(beginInstall).toHaveBeenCalledTimes(1);
  });
});
