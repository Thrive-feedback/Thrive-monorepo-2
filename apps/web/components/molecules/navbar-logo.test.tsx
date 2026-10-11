import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NavbarLogo } from './navbar-logo';

const pathname = vi.fn(() => '/');
vi.mock('next/navigation', () => ({ usePathname: () => pathname() }));

describe('NavbarLogo', () => {
  it('links the wordmark home', () => {
    pathname.mockReturnValue('/home');

    render(<NavbarLogo />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/');
    expect(screen.getByRole('img', { name: 'Thrive' })).toBeInTheDocument();
  });

  it('leaves the wordmark out on the sign-in page, which shows its own', () => {
    pathname.mockReturnValue('/signin');

    render(<NavbarLogo />);

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('img', { name: 'Thrive' })).toBeNull();
  });
});
