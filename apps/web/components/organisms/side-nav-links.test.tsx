import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const usePathname = vi.fn();
vi.mock('next/navigation', () => ({ usePathname: () => usePathname() }));

const { SideNavLinks } = await import('./side-nav-links');

describe('SideNavLinks', () => {
  it('offers the signed-in pages, in the order a person meets them', () => {
    usePathname.mockReturnValue('/home');

    render(<SideNavLinks />);

    expect(
      screen.getAllByRole('link').map((link) => link.getAttribute('href')),
    ).toEqual(['/home', '/feedback/sent', '/feedback/asks', '/settings']);
  });

  it('marks the page the person is on, and only that one', () => {
    usePathname.mockReturnValue('/feedback/asks');

    render(<SideNavLinks />);

    expect(
      screen.getByRole('link', { name: 'Waiting for me' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('marks Settings as the section the person is in, on every page beneath it', () => {
    usePathname.mockReturnValue('/settings/members');

    render(<SideNavLinks />);

    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('marks nothing on a page that is not in the navigation', () => {
    usePathname.mockReturnValue('/feedback/requests/abc');

    render(<SideNavLinks />);

    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current');
    }
  });
});
