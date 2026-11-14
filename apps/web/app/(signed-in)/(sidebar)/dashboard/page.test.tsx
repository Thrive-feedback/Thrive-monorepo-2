import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard, { generateMetadata } from './page';

const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: () => requireMember(),
}));

const readFeatureFlags = vi.fn();
vi.mock('@/lib/feature-flags/feature-flags.service', () => ({
  readFeatureFlags: () => readFeatureFlags(),
}));

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('not-found');
  }),
);
vi.mock('next/navigation', () => ({ notFound }));

vi.mock('./_components/dashboard-summary', () => ({
  DashboardSummary: () => <output>the summary</output>,
}));

beforeEach(() => {
  notFound.mockClear();
  requireMember.mockReset().mockResolvedValue({
    email: 'ann@acme.test',
    membership: { workspace: { id: 'w-1', name: 'Acme' }, role: 'MEMBER' },
  });
});

describe('Dashboard', () => {
  it('shows the page where the deployment has switched it on', async () => {
    readFeatureFlags.mockResolvedValue({ showsDashboard: true });

    render(await Dashboard());

    expect(
      screen.getByRole('heading', { name: 'Your dashboard' }),
    ).toBeVisible();
    expect(notFound).not.toHaveBeenCalled();
  });

  it('answers not found where the deployment has switched it off', async () => {
    readFeatureFlags.mockResolvedValue({ showsDashboard: false });

    await expect(Dashboard()).rejects.toThrow('not-found');
    expect(notFound).toHaveBeenCalledOnce();
  });

  it('titles the page where it is on, and sends no title of its own where it is off', async () => {
    readFeatureFlags.mockResolvedValue({ showsDashboard: true });
    expect(await generateMetadata()).toMatchObject({ title: 'Your dashboard' });

    readFeatureFlags.mockResolvedValue({ showsDashboard: false });
    await expect(generateMetadata()).rejects.toThrow('not-found');
  });

  it('sends someone signed out to sign in from its metadata too, never to not found', async () => {
    readFeatureFlags.mockResolvedValue({ showsDashboard: false });
    requireMember.mockRejectedValue(new Error('redirect:/signin'));

    await expect(generateMetadata()).rejects.toThrow('redirect:/signin');
  });
});
