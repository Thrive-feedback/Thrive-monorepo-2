import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SidebarAccount } from './sidebar-account';

describe('SidebarAccount', () => {
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
