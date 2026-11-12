import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LANDING_COPY } from './_components/landing/landing-copy.constant';
import LandingPage, { metadata } from './page';

const readSession = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  readSession: () => readSession(),
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

describe('LandingPage', () => {
  beforeEach(() => {
    cookieNames.clear();
    readSession.mockReset();
  });

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

  it('answers a visitor with no session cookie without asking the API', async () => {
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

  it('no longer points visitors at the component showcase or the API reference', async () => {
    render(await LandingPage());

    expect(screen.queryByRole('link', { name: /components/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /API reference/i })).toBeNull();
  });
});

describe('the landing page’s metadata', () => {
  it('names one canonical address and is indexable', () => {
    expect(metadata.alternates?.canonical).toBe('/');
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it('previews a shared link with the same title and description as the page', () => {
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
