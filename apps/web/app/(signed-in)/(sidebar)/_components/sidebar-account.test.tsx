import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ROUTES } from '@/lib/routes.constant';
import { SidebarAccount } from './sidebar-account';

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
});
