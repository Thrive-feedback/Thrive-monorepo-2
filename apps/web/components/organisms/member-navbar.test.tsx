import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemberNavbar } from './member-navbar';

const readSession = vi.fn();
const readSessionNeedsRefresh = vi.fn(async () => false);
vi.mock('@/lib/session/session.service', () => ({
  readSession: () => readSession(),
  readSessionNeedsRefresh: () => readSessionNeedsRefresh(),
}));
vi.mock('next/navigation', () => ({ usePathname: () => '/home' }));
vi.mock('./session-refresher', () => ({
  SessionRefresher: () => <output>session refresher</output>,
}));
vi.mock('@/lib/session/session-actions.service', () => ({
  signOut: vi.fn(),
}));

const ANN = {
  email: 'ann@acme.test',
  name: 'Ann Google',
  profile: { fullName: 'Ann Lee', displayName: 'Ann Lee', slug: 'ann' },
};

describe('MemberNavbar', () => {
  it('links to Home, and marks it as the page the person is on', async () => {
    readSession.mockResolvedValue(ANN);

    render(await MemberNavbar());

    const home = screen.getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('href', '/home');
    expect(home).toHaveAttribute('aria-current', 'page');
  });

  it('offers the account menu, named for the person', async () => {
    readSession.mockResolvedValue(ANN);

    render(await MemberNavbar());

    expect(
      screen.getByRole('button', { name: 'Account menu for Ann Lee' }),
    ).toBeInTheDocument();
  });

  it('shows only the logo when nobody is signed in', async () => {
    readSession.mockResolvedValue(null);

    render(await MemberNavbar());

    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByRole('button', { name: /Account menu/ })).toBeNull();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/');
  });

  it('refreshes a session that is due, and only then', async () => {
    readSession.mockResolvedValue(ANN);
    readSessionNeedsRefresh.mockResolvedValue(true);

    render(await MemberNavbar());

    expect(screen.getByText('session refresher')).toBeInTheDocument();
  });

  it('leaves a session that is not due alone', async () => {
    readSession.mockResolvedValue(ANN);
    readSessionNeedsRefresh.mockResolvedValue(false);

    render(await MemberNavbar());

    expect(screen.queryByText('session refresher')).toBeNull();
  });
});
