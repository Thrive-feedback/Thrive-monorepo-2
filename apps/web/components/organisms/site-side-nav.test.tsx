import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SiteSideNav } from './site-side-nav';

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

describe('SiteSideNav', () => {
  it('offers Sign out to whoever is signed in', async () => {
    readSession.mockResolvedValue({ email: 'ann@acme.test', name: 'Ann Lee' });

    render(await SiteSideNav());

    expect(screen.getByRole('button', { name: 'Sign out' })).toHaveAttribute(
      'type',
      'submit',
    );
  });

  it('links to Home, and marks it as the page the person is on', async () => {
    readSession.mockResolvedValue({ email: 'ann@acme.test', name: 'Ann Lee' });

    render(await SiteSideNav());

    const home = screen.getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('href', '/home');
    expect(home).toHaveAttribute('aria-current', 'page');
  });

  it('shows only the logo when nobody is signed in', async () => {
    readSession.mockResolvedValue(null);

    render(await SiteSideNav());

    expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/');
  });

  it('refreshes a session that is due, and only then', async () => {
    readSession.mockResolvedValue({ email: 'ann@acme.test', name: 'Ann Lee' });
    readSessionNeedsRefresh.mockResolvedValue(true);

    render(await SiteSideNav());

    expect(screen.getByText('session refresher')).toBeInTheDocument();
  });

  it('leaves a session that is not due alone', async () => {
    readSession.mockResolvedValue({ email: 'ann@acme.test', name: 'Ann Lee' });
    readSessionNeedsRefresh.mockResolvedValue(false);

    render(await SiteSideNav());

    expect(screen.queryByText('session refresher')).toBeNull();
  });
});
