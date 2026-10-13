import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const signOut = vi.fn(async () => undefined);
vi.mock('@/lib/session/session-actions.service', () => ({
  signOut: () => signOut(),
}));

const { AccountMenu } = await import('./account-menu');

async function openMenu() {
  const user = userEvent.setup();
  render(<AccountMenu name="Ann Lee" email="ann@acme.test" />);
  await user.click(
    screen.getByRole('button', { name: 'Account menu for Ann Lee' }),
  );
  return user;
}

describe('AccountMenu', () => {
  it('shows the person’s initials on the trigger', () => {
    render(<AccountMenu name="Ann Lee" email="ann@acme.test" />);

    expect(
      screen.getByRole('button', { name: 'Account menu for Ann Lee' }),
    ).toHaveTextContent('AL');
  });

  it('opens Profile, Settings and Sign out, in that order', async () => {
    await openMenu();

    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent),
    ).toEqual(['Profile', 'Settings', 'Sign out']);
    expect(screen.getByRole('menuitem', { name: 'Profile' })).toHaveAttribute(
      'href',
      '/profile',
    );
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/settings',
    );
  });

  it('says who is signed in', async () => {
    await openMenu();

    expect(screen.getByText('ann@acme.test')).toBeInTheDocument();
  });

  it('signs out from the menu', async () => {
    const user = await openMenu();

    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    expect(signOut).toHaveBeenCalledOnce();
  });
});
