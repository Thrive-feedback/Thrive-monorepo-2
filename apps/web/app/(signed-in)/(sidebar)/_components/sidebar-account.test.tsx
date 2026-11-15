import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '@/lib/routes.constant';
import { SidebarAccount } from './sidebar-account';

/** Longer than the tooltip's 300ms hover delay. */
const TOOLTIP_DELAY_PASSED = 400;

const usePathname = vi.fn((): string => ROUTES.home);

const ANN = {
  name: 'Ann',
  email: 'ann@acme.test',
  slug: 'ann.lee',
  photoUrl: null,
} as const;
vi.mock('next/navigation', () => ({
  usePathname: () => usePathname(),
}));

afterEach(() => {
  delete document.documentElement.dataset.sidebar;
});

describe('SidebarAccount', () => {
  it('marks Settings as the open page on any of its sections, and not the account card', () => {
    usePathname.mockReturnValue(ROUTES.settings.teammates);
    render(<SidebarAccount {...ANN} />);

    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', { name: 'Profile: Ann, ann@acme.test' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('marks nothing away from Settings', () => {
    usePathname.mockReturnValue(ROUTES.home);
    render(<SidebarAccount {...ANN} />);

    expect(screen.getByRole('link', { name: 'Settings' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('marks the account card as the open page on the person’s own Profile', () => {
    usePathname.mockReturnValue(ROUTES.profile('ann.lee'));
    render(<SidebarAccount {...ANN} />);

    expect(
      screen.getByRole('link', { name: 'Profile: Ann, ann@acme.test' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('marks nothing on somebody else’s Profile', () => {
    usePathname.mockReturnValue(ROUTES.profile('ben'));
    render(<SidebarAccount {...ANN} />);

    expect(
      screen.getByRole('link', { name: 'Profile: Ann, ann@acme.test' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('leads to Settings, and to the Profile of whoever is signed in, named with their address', () => {
    render(<SidebarAccount {...ANN} />);

    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/settings',
    );
    const account = screen.getByRole('link', {
      name: 'Profile: Ann, ann@acme.test',
    });
    expect(account).toHaveAttribute('href', '/profile/ann.lee');
    expect(account).toHaveTextContent('Ann');
    expect(account).toHaveTextContent('ann@acme.test');
  });

  it('is its own menu, named for what is in it and told apart from the main one', () => {
    render(<SidebarAccount {...ANN} />);

    expect(screen.getByRole('navigation', { name: 'Settings' })).toBeVisible();
  });

  it('on the rail, keeps the account named and names its face when pointed at', async () => {
    const user = userEvent.setup();
    document.documentElement.dataset.sidebar = 'rail';
    render(<SidebarAccount {...ANN} />);

    await user.hover(
      screen.getByRole('link', { name: 'Profile: Ann, ann@acme.test' }),
    );

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Ann');
  });

  it('wide, where the name shows, names nothing by tooltip', async () => {
    const user = userEvent.setup();
    document.documentElement.dataset.sidebar = 'wide';
    render(<SidebarAccount {...ANN} />);

    await user.hover(
      screen.getByRole('link', { name: 'Profile: Ann, ann@acme.test' }),
    );
    // Past the tooltip's 300ms delay, so one that would open has had its chance.
    await new Promise((resolve) => setTimeout(resolve, TOOLTIP_DELAY_PASSED));

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
