import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ROUTES } from '@/lib/routes.constant';
import { SidebarAccount } from './sidebar-account';

/** Longer than the tooltip's 300ms hover delay. */
const TOOLTIP_DELAY_PASSED = 400;

const usePathname = vi.fn((): string => ROUTES.home);
vi.mock('next/navigation', () => ({
  usePathname: () => usePathname(),
}));

describe('SidebarAccount', () => {
  it('marks Settings as the open page on any of its sections, and the account card never', () => {
    usePathname.mockReturnValue(ROUTES.settings.teammates);
    render(<SidebarAccount name="Ann" email="ann@acme.test" photoUrl={null} />);

    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', { name: 'Account: Ann, ann@acme.test' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('marks nothing away from Settings', () => {
    usePathname.mockReturnValue(ROUTES.home);
    render(<SidebarAccount name="Ann" email="ann@acme.test" photoUrl={null} />);

    expect(screen.getByRole('link', { name: 'Settings' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('leads to Settings, and to the Account of whoever is signed in, named with their address', () => {
    render(<SidebarAccount name="Ann" email="ann@acme.test" photoUrl={null} />);

    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/settings',
    );
    const account = screen.getByRole('link', {
      name: 'Account: Ann, ann@acme.test',
    });
    expect(account).toHaveAttribute('href', '/settings/account');
    expect(account).toHaveTextContent('Ann');
    expect(account).toHaveTextContent('ann@acme.test');
  });

  it('is its own menu, named for what is in it and told apart from the main one', () => {
    render(<SidebarAccount name="Ann" email="ann@acme.test" photoUrl={null} />);

    expect(screen.getByRole('navigation', { name: 'Settings' })).toBeVisible();
  });

  it('in Settings, keeps the account named and names its face when pointed at', async () => {
    const user = userEvent.setup();
    usePathname.mockReturnValue(ROUTES.settings.teammates);
    render(<SidebarAccount name="Ann" email="ann@acme.test" photoUrl={null} />);

    await user.hover(
      screen.getByRole('link', { name: 'Account: Ann, ann@acme.test' }),
    );

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Ann');
  });

  it('away from Settings, where the name shows, names nothing by tooltip', async () => {
    const user = userEvent.setup();
    usePathname.mockReturnValue(ROUTES.home);
    render(<SidebarAccount name="Ann" email="ann@acme.test" photoUrl={null} />);

    await user.hover(
      screen.getByRole('link', { name: 'Account: Ann, ann@acme.test' }),
    );
    // Past the tooltip's 300ms delay, so one that would open has had its chance.
    await new Promise((resolve) => setTimeout(resolve, TOOLTIP_DELAY_PASSED));

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
