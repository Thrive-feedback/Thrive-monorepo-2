import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NavbarLogo } from './navbar-logo';

describe('NavbarLogo', () => {
  it('links the wordmark home', () => {
    render(<NavbarLogo />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/');
    expect(screen.getByRole('img', { name: 'Thrive' })).toBeInTheDocument();
  });
});
