import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SiteNavbar } from './site-navbar';

const readSession = vi.fn();
vi.mock('@/app/(public)/_lib/session.service', () => ({
  readSession: () => readSession(),
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
});
