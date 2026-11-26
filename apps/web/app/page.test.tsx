import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HR_LANDING_COPY } from './_components/hr-landing/hr-landing-copy.constant';
import { LANDING_COPY } from './_components/landing/landing-copy.constant';
import LandingPage, { generateMetadata } from './page';

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
}));

beforeEach(() => {
  cookieNames.clear();
  readSession.mockReset();
  readFeatureFlags
    .mockReset()
    .mockResolvedValue({ showsDashboard: false, showsHrLanding: false });
});

function switchOnHrLanding() {
  readFeatureFlags.mockResolvedValue({
    showsDashboard: false,
    showsHrLanding: true,
  });
}

describe('LandingPage, while the front page for HR is off', () => {
  it('sends someone signed in to Home', async () => {
    cookieNames.add('thrive.session_token');
    readSession.mockResolvedValue({ email: 'ann@acme.test', name: 'Ann Lee' });

    await expect(LandingPage()).rejects.toThrow('redirect:/home');
  });

  it('shows the page to someone whose session cookie is no longer good', async () => {
    cookieNames.add('__Secure-thrive.session_token');
    readSession.mockResolvedValue(null);

    render(await LandingPage());

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('answers a visitor with no session cookie without asking who they are', async () => {
    render(await LandingPage());

    expect(readSession).not.toHaveBeenCalled();
    // By name, which leaves out the handwritten note hanging off the heading.
    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'Feedback while it still matters.',
    );
  });

  it('leads every way in to sign-in', async () => {
    render(await LandingPage());

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/signin',
    );
    const getStarted = screen.getAllByRole('link', { name: 'Get started' });
    expect(getStarted).toHaveLength(2);
    for (const link of getStarted) {
      expect(link).toHaveAttribute('href', '/signin');
    }
  });

  it('lays the cards to try beside the promise, keeping the page to one h1', async () => {
    render(await LandingPage());

    const desk = screen.getByRole('region', { name: 'Try it, then sign in' });
    expect(desk).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('names each section by its heading', async () => {
    render(await LandingPage());

    for (const name of [
      'Try it, then sign in',
      'Two moments that shouldn’t wait',
      'Say thanks where the whole team can see it',
      'Honest feedback starts with a question.',
      'Everything Thrive does',
      'Whoever leads the team',
    ]) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument();
    }
  });

  it('shows no language switch until Thai exists', async () => {
    render(await LandingPage());

    expect(screen.queryByRole('group', { name: 'Language' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'TH' })).toBeNull();
  });

  it('shows no switch to a page for HR that is not there', async () => {
    render(await LandingPage());

    expect(
      screen.queryByRole('navigation', { name: 'Who this page is for' }),
    ).toBeNull();
  });

  it('no longer points visitors at the component showcase or the API reference', async () => {
    render(await LandingPage());

    expect(screen.queryByRole('link', { name: /components/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /API reference/i })).toBeNull();
  });
});

describe('LandingPage, with the front page for HR on', () => {
  beforeEach(switchOnHrLanding);

  it('sends someone signed in to Home', async () => {
    cookieNames.add('thrive.session_token');
    readSession.mockResolvedValue({ email: 'ann@acme.test', name: 'Ann Lee' });

    await expect(LandingPage()).rejects.toThrow('redirect:/home');
  });

  it('is the front page for HR, with one h1 that names the promise', async () => {
    render(await LandingPage());

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      HR_LANDING_COPY.hero.headline,
    );
  });

  it('describes the app to search engines in the HR page’s words', async () => {
    const { container } = render(await LandingPage());
    const jsonLd = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')
        ?.textContent ?? 'null',
    );
    const app = jsonLd['@graph'].find(
      (node: { '@type': string }) => node['@type'] === 'WebApplication',
    );

    expect(app.description).toBe(HR_LANDING_COPY.meta.description);
  });

  it('marks itself as the page for HR, and links to the page for teams', async () => {
    render(await LandingPage());

    const audience = within(
      screen.getByRole('navigation', { name: 'Who this page is for' }),
    );
    expect(audience.getByRole('link', { name: 'For HR' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(audience.getByRole('link', { name: 'For teams' })).toHaveAttribute(
      'href',
      '/for-teams',
    );
  });
});

describe('the landing page’s metadata', () => {
  it('names one canonical address and is indexable, whichever page it is', async () => {
    for (const showsHrLanding of [false, true]) {
      readFeatureFlags.mockResolvedValue({
        showsDashboard: false,
        showsHrLanding,
      });
      const metadata = await generateMetadata();

      expect(metadata.alternates?.canonical).toBe('/');
      expect(metadata.robots).toEqual({ index: true, follow: true });
    }
  });

  it('carries the HR page’s words while that page is on', async () => {
    switchOnHrLanding();
    const metadata = await generateMetadata();

    expect(metadata.title).toEqual({ absolute: HR_LANDING_COPY.meta.title });
    expect(metadata.description).toBe(HR_LANDING_COPY.meta.description);
  });

  it('previews a shared link with the same title and description as the page', async () => {
    const metadata = await generateMetadata();

    expect(metadata.openGraph).toMatchObject({
      type: 'website',
      url: '/',
      siteName: 'Thrive',
      title: LANDING_COPY.meta.title,
      description: LANDING_COPY.meta.description,
    });
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      title: LANDING_COPY.meta.title,
      description: LANDING_COPY.meta.description,
    });
  });
});
