import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LinkAccountButton } from './link-account-button';

const beginAccountLink = vi.fn();
vi.mock(
  '@/app/(signed-in)/(sidebar)/settings/account/_lib/account-link-actions.service',
  () => ({
    beginAccountLink: (segment: string) => beginAccountLink(segment),
  }),
);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

const tab = { opener: {}, close: vi.fn(), location: { replace: vi.fn() } };

beforeEach(() => {
  beginAccountLink.mockReset();
  toast.error.mockReset();
  tab.close.mockReset();
  tab.location.replace.mockReset();
  vi.stubGlobal(
    'open',
    vi.fn(() => tab),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('LinkAccountButton', () => {
  it('says only Link, since the row names the tool, and keeps the tool in its name', () => {
    render(<LinkAccountButton segment="discord" label="Discord" />);

    const button = screen.getByRole('button', { name: 'Link Discord' });
    expect(button).toHaveTextContent(/^Link$/);
  });

  it('opens the tool in a tab of its own', async () => {
    const user = userEvent.setup();
    beginAccountLink.mockResolvedValue({
      ok: true,
      authorizeUrl: 'https://discord.com/oauth2/authorize?state=signed',
    });
    render(<LinkAccountButton segment="discord" label="Discord" />);

    await user.click(screen.getByRole('button', { name: 'Link Discord' }));

    expect(beginAccountLink).toHaveBeenCalledWith('discord');
    expect(tab.location.replace).toHaveBeenCalledWith(
      'https://discord.com/oauth2/authorize?state=signed',
    );
  });

  it('closes the tab and says why when Thrive could not say where to go', async () => {
    const user = userEvent.setup();
    beginAccountLink.mockResolvedValue({
      ok: false,
      message: 'Thrive does not message people through that chat tool yet.',
    });
    render(<LinkAccountButton segment="discord" label="Discord" />);

    await user.click(screen.getByRole('button', { name: 'Link Discord' }));

    expect(tab.close).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      'Thrive does not message people through that chat tool yet.',
    );
  });
});
