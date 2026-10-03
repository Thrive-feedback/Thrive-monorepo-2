import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SiteNavbar } from './site-navbar';

const readSession = vi.fn();
const readSessionNeedsRefresh = vi.fn(async () => false);
vi.mock('@/app/(public)/_lib/session.service', () => ({
  readSession: () => readSession(),
  readSessionNeedsRefresh: () => readSessionNeedsRefresh(),
}));
vi.mock('./session-refresher', () => ({
  SessionRefresher: () => <output>session refresher</output>,
}));
vi.mock('@/app/(public)/_lib/session-actions.service', () => ({
  signOut: vi.fn(),
}));

describe('SiteNavbar', () => {
  it('offers Sign out to whoever is signed in', async () => {
    readSession.mockResolvedValue({ email: 'ann@acme.test', name: 'Ann Lee' });

    render(await SiteNavbar());

    expect(screen.getByRole('button', { name: 'Sign out' })).toHaveAttribute(
      'type',
      'submit',
    );
  });

  it('shows only the logo when nobody is signed in', async () => {
    readSession.mockResolvedValue(null);

    render(await SiteNavbar());

    expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/');
  });

  it('refreshes a session that is due, and only then', async () => {
    readSession.mockResolvedValue({ email: 'ann@acme.test', name: 'Ann Lee' });
    readSessionNeedsRefresh.mockResolvedValue(true);

    render(await SiteNavbar());

    expect(screen.getByText('session refresher')).toBeInTheDocument();
  });

  it('leaves a session that is not due alone', async () => {
    readSession.mockResolvedValue({ email: 'ann@acme.test', name: 'Ann Lee' });
    readSessionNeedsRefresh.mockResolvedValue(false);

    render(await SiteNavbar());

    expect(screen.queryByText('session refresher')).toBeNull();
  });
});
