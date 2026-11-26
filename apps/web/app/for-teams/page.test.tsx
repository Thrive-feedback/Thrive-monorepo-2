import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LANDING_COPY } from '@/app/_components/landing/landing-copy.constant';
import ForTeamsPage, { generateMetadata } from './page';

vi.mock('server-only', () => ({}));

const readSession = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  readSession: () => readSession(),
}));
const readFeatureFlags = vi.fn();
vi.mock('@/lib/feature-flags/feature-flags.service', () => ({
  readFeatureFlags: () => readFeatureFlags(),
}));
const cookieNames = new Set<string>();
vi.mock('next/headers', () => ({
  cookies: async () => ({ has: (name: string) => cookieNames.has(name) }),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error('not-found');
  }),
}));

/**
 * The deployment's answer for the HR flag. The flag service is replaced at its module, not at the
 * network: its read carries an `AbortSignal`, and jsdom's is not the one Node's `fetch` accepts.
 * The read itself, a failed one included, is tested in `feature-flags.service.test.ts`.
 */
function deploymentSays(hrLanding: 'true' | 'false') {
  readFeatureFlags.mockResolvedValue({
    showsDashboard: false,
    showsHrLanding: hrLanding === 'true',
  });
}

function signIn() {
  cookieNames.add('thrive.session_token');
  readSession.mockResolvedValue({ email: 'ann@acme.test', name: 'Ann Lee' });
}

beforeEach(() => {
  cookieNames.clear();
  readSession.mockReset();
  readFeatureFlags.mockReset();
  deploymentSays('true');
});

describe('ForTeamsPage', () => {
  it('does not exist while the front page for HR is off', async () => {
    deploymentSays('false');

    await expect(ForTeamsPage()).rejects.toThrow('not-found');
  });

  it('is not found for someone signed in too, while it is off, rather than sending them Home', async () => {
    deploymentSays('false');
    signIn();

    await expect(ForTeamsPage()).rejects.toThrow('not-found');
  });

  it('sends someone signed in to Home', async () => {
    signIn();

    await expect(ForTeamsPage()).rejects.toThrow('redirect:/home');
  });

  it('is the page for teams, with one h1 that names its promise', async () => {
    render(await ForTeamsPage());

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'Feedback while it still matters.',
    );
  });

  it('marks itself as the page for teams, and links back to the page for HR', async () => {
    render(await ForTeamsPage());

    const audience = within(
      screen.getByRole('navigation', { name: 'Who this page is for' }),
    );
    expect(audience.getByRole('link', { name: 'For teams' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(audience.getByRole('link', { name: 'For HR' })).toHaveAttribute(
      'href',
      '/',
    );
  });
});

describe('the page for teams’ metadata', () => {
  it('sends none of the page’s title or card with the 404 while it is off', async () => {
    deploymentSays('false');

    await expect(generateMetadata()).rejects.toThrow('not-found');
  });

  it('is its own canonical address, and stays out of search while it is behind a flag', async () => {
    const metadata = await generateMetadata();

    expect(metadata.alternates?.canonical).toBe('/for-teams');
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it('carries the page for teams’ words', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toEqual({ absolute: LANDING_COPY.meta.title });
    expect(metadata.description).toBe(LANDING_COPY.meta.description);
  });
});
