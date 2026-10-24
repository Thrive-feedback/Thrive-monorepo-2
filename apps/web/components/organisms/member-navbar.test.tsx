import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemberNavbar } from './member-navbar';

const readSession = vi.fn();
const readSessionNeedsRefresh = vi.fn(async () => false);
vi.mock('@/lib/session/session.service', () => ({
  readSession: () => readSession(),
  readSessionNeedsRefresh: () => readSessionNeedsRefresh(),
}));
const pathname = vi.fn(() => '/home');
vi.mock('next/navigation', () => ({ usePathname: () => pathname() }));
vi.mock('./session-refresher', () => ({
  SessionRefresher: () => <output>session refresher</output>,
}));
// The bell reaches the server as soon as it mounts, which is its own suite's subject.
vi.mock('./notification-bell', () => ({
  NotificationBell: () => <output>notification bell</output>,
}));

const ANN = {
  email: 'ann@acme.test',
  name: 'Ann Google',
  profile: { fullName: 'Ann Lee', displayName: 'Ann Lee', slug: 'ann' },
};

describe('MemberNavbar', () => {
  it('leads the logo Home', async () => {
    readSession.mockResolvedValue(ANN);

    render(await MemberNavbar());

    expect(screen.getByRole('link', { name: 'Thrive' })).toHaveAttribute(
      'href',
      '/home',
    );
  });

  it('links to Settings, and marks it while the person is in Settings', async () => {
    readSession.mockResolvedValue(ANN);
    pathname.mockReturnValue('/settings/workspace');

    render(await MemberNavbar());

    const settings = screen.getByRole('link', { name: 'Settings' });
    expect(settings).toHaveAttribute('href', '/settings');
    expect(settings).toHaveAttribute('aria-current', 'page');
  });

  it('leads the avatar, named for the person, to their Account', async () => {
    readSession.mockResolvedValue(ANN);

    render(await MemberNavbar());

    expect(
      screen.getByRole('link', { name: 'Account: Ann Lee' }),
    ).toHaveAttribute('href', '/settings/account');
  });

  it('has no colour mode switch, since that is in Settings', async () => {
    readSession.mockResolvedValue(ANN);

    render(await MemberNavbar());

    expect(screen.queryByRole('button', { name: 'Dark theme' })).toBeNull();
  });

  it('rings the bell for somebody signed in', async () => {
    readSession.mockResolvedValue(ANN);

    render(await MemberNavbar());

    expect(screen.getByText('notification bell')).toBeInTheDocument();
  });

  it('shows only the logo when nobody is signed in', async () => {
    readSession.mockResolvedValue(null);

    render(await MemberNavbar());

    expect(screen.queryByText('notification bell')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Settings' })).toBeNull();
    expect(screen.queryByRole('link', { name: /Account/ })).toBeNull();
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
