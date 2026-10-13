import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const usePathname = vi.fn();
vi.mock('next/navigation', () => ({ usePathname: () => usePathname() }));

const { MemberNavLinks } = await import('./member-nav-links');

describe('MemberNavLinks', () => {
  it('offers Home, and nothing else', () => {
    usePathname.mockReturnValue('/home');

    render(<MemberNavLinks />);

    expect(
      screen.getAllByRole('link').map((link) => link.getAttribute('href')),
    ).toEqual(['/home']);
  });

  it('marks Home on Home', () => {
    usePathname.mockReturnValue('/home');

    render(<MemberNavLinks />);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('marks nothing on a page that is not in the navigation', () => {
    usePathname.mockReturnValue('/settings/members');

    render(<MemberNavLinks />);

    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
    );
  });
});
