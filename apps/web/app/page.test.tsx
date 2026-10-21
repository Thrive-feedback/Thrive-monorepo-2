import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LandingPage from './page';

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
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Honest feedback starts with a question.',
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

  it('takes a visitor from the promise to the tour of Home', async () => {
    render(await LandingPage());

    expect(
      screen.getByRole('link', { name: 'See it in action' }),
    ).toHaveAttribute('href', '#tour');
    expect(
      screen.getByRole('region', { name: 'Try it before you sign in' }),
    ).toHaveAttribute('id', 'tour');
  });

  it('shows a preview of Home under the promise, keeping the page to one h1', async () => {
    render(await LandingPage());

    expect(
      screen.getByRole('region', { name: 'Preview of Thrive Home' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('names each section by its heading', async () => {
    render(await LandingPage());

    for (const name of [
      'Try it before you sign in',
      'Silence isn’t agreement.',
      'Every choice in Thrive comes from research',
      'Everything you need to start. Nothing you don’t.',
      'Made for founders without an HR team',
      'Start the conversation your team is waiting for.',
    ]) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument();
    }
  });

  it('no longer points visitors at the component showcase or the API reference', async () => {
    render(await LandingPage());

    expect(screen.queryByRole('link', { name: /components/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /API reference/i })).toBeNull();
  });
});
