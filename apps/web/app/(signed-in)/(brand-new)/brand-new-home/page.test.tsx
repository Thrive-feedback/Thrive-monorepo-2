import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '@/lib/routes.constant';
import BrandNewHome from './page';

const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000d1';

const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: () => requireMember(),
}));
vi.mock('@/components/atoms/one-time-toast', () => ({
  OneTimeToast: ({ message, then }: { message: string; then: string }) => (
    <output data-then={then}>{message}</output>
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
vi.mock('./_components/home-postcard', () => ({
  HomePostcard: ({
    feedbackId,
    show,
  }: {
    feedbackId: string;
    show: string;
  }) => (
    <p>
      The postcard {feedbackId}, from {show}
    </p>
  ),
}));
vi.mock('./_components/home-feed-filter', () => ({
  HomeFeedFilter: ({ show }: { show: string }) => <p>The filter on {show}</p>,
}));

beforeEach(() => {
  requireMember.mockResolvedValue({
    membership: { workspace: { id: 'w-1', name: 'Globex' }, role: 'MEMBER' },
  });
});

function open(searchParams: Record<string, string> = {}) {
  return BrandNewHome({ searchParams: Promise.resolve(searchParams) });
}

describe('BrandNewHome', () => {
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
      ROUTES.brandNewHome,
    );
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
      screen.getByText(`The postcard ${FEEDBACK_ID}, from shared`),
    ).toBeInTheDocument();
    expect(screen.getByText('The feed, showing shared')).toBeInTheDocument();
  });
});
