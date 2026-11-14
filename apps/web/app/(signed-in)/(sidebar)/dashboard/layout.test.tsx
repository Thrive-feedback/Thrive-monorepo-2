import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardLayout from './layout';

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

beforeEach(() => {
  notFound.mockClear();
  requireMember.mockReset().mockResolvedValue({ email: 'ann@acme.test' });
});

describe('DashboardLayout', () => {
  it('answers not found before the page or its loading state is drawn, where the dashboard is off', async () => {
    readFeatureFlags.mockResolvedValue({ showsDashboard: false });

    await expect(DashboardLayout({ children: 'the page' })).rejects.toThrow(
      'not-found',
    );
  });

  it('draws the page where the dashboard is on', async () => {
    readFeatureFlags.mockResolvedValue({ showsDashboard: true });

    await expect(DashboardLayout({ children: 'the page' })).resolves.toBe(
      'the page',
    );
    expect(notFound).not.toHaveBeenCalled();
  });

  it('sends someone signed out to sign in rather than answering not found', async () => {
    readFeatureFlags.mockResolvedValue({ showsDashboard: false });
    requireMember.mockRejectedValue(new Error('redirect:/signin'));

    await expect(DashboardLayout({ children: 'the page' })).rejects.toThrow(
      'redirect:/signin',
    );
  });
});
