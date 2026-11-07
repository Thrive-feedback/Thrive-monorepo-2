import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '@/lib/routes.constant';
import Home from './page';

const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000d1';

const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: (signedIn?: string) => requireMember(signedIn),
}));
vi.mock('@/app/(signed-in)/(sidebar)/_components/invitation-notices', () => ({
  InvitationNotices: () => <p>The Invitations waiting</p>,
}));
vi.mock('@/components/atoms/one-time-toast', () => ({
  OneTimeToast: ({
    type,
    message,
    then,
  }: {
    type: string;
    message: string;
    then: string;
  }) => (
    <output data-type={type} data-then={then}>
      {message}
    </output>
  ),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock('./_components/home-composer', () => ({
  HomeComposer: () => <p>The composer</p>,
}));
vi.mock('./_components/home-feed', () => ({
  HomeFeed: ({ show }: { show: string }) => <p>The feed, showing {show}</p>,
  HomeFeedSkeleton: () => null,
}));
vi.mock('@/app/(signed-in)/(sidebar)/_components/feedback-postcard', () => ({
  FeedbackPostcard: ({
    feedbackId,
    closeHref,
  }: {
    feedbackId: string;
    closeHref: string;
  }) => (
    <p>
      The postcard {feedbackId}, closing to {closeHref}
    </p>
  ),
}));
vi.mock('./_components/home-feed-filter', () => ({
  HomeFeedFilter: ({ show }: { show: string }) => <p>The filter on {show}</p>,
}));

beforeEach(() => {
  requireMember.mockResolvedValue({
    email: 'ann@acme.test',
    membership: { workspace: { id: 'w-1', name: 'Globex' }, role: 'MEMBER' },
  });
});

function open(searchParams: Record<string, string> = {}) {
  return Home({ searchParams: Promise.resolve(searchParams) });
}

describe('Home', () => {
  it('lets only a Member in, and is headed Home', async () => {
    render(await open());

    expect(requireMember).toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Home' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('says once that the person has just switched to this Workspace', async () => {
    render(await open({ opened: '1' }));

    expect(screen.getByRole('status')).toHaveTextContent('Switched to Globex');
    expect(screen.getByRole('status')).toHaveAttribute(
      'data-then',
      ROUTES.home,
    );
  });

  it('tells the gate the person has just signed in, so a redirect keeps the toast', async () => {
    await open({ signedIn: '1' });

    expect(requireMember).toHaveBeenLastCalledWith('1');
  });

  it('says who signed in when Google has just sent them back, keeping the filter', async () => {
    render(await open({ signedIn: '1', show: 'shared' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Signed in as ann@acme.test',
    );
    expect(screen.getByRole('status')).toHaveAttribute(
      'data-then',
      ROUTES.homeShowing('shared'),
    );
  });

  it('says once that the person left the Workspace before', async () => {
    render(await open({ left: '1' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      "You left that Workspace. You're in Globex now.",
    );
    expect(screen.getByRole('status')).toHaveAttribute('data-type', 'success');
  });

  it('says once that what was sent was dropped, because its page was for another Workspace', async () => {
    render(await open({ switched: '1' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      "Nothing was changed: that page was for another Workspace. You're in Globex now.",
    );
    expect(screen.getByRole('status')).toHaveAttribute('data-type', 'error');
  });

  it('shows the Invitations waiting for the person', async () => {
    render(await open());

    expect(screen.getByText('The Invitations waiting')).toBeInTheDocument();
  });

  it('opens on All Feedback', async () => {
    render(await open());

    expect(screen.getByText('The filter on all')).toBeInTheDocument();
    expect(screen.getByText('The feed, showing all')).toBeInTheDocument();
  });

  it('shows what the address asks for', async () => {
    render(await open({ show: 'shared' }));

    expect(screen.getByText('The filter on shared')).toBeInTheDocument();
    expect(screen.getByText('The feed, showing shared')).toBeInTheDocument();
  });

  it('opens nothing over the feed until a piece is named', async () => {
    render(await open());

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the postcard the address names over the feed', async () => {
    render(await open({ show: 'shared', feedback: FEEDBACK_ID }));

    expect(
      screen.getByText(
        `The postcard ${FEEDBACK_ID}, closing to ${ROUTES.homeShowing('shared')}`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('The feed, showing shared')).toBeInTheDocument();
  });
});
