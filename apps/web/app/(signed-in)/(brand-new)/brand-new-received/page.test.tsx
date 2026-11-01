import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BrandNewReceived from './page';

const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000d1';

const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: () => requireMember(),
}));
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('./_components/received-items', () => ({
  ReceivedItems: () => <p>What was received</p>,
  ReceivedItemsLoading: () => null,
}));
vi.mock('@/app/(signed-in)/(brand-new)/_components/feedback-postcard', () => ({
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

beforeEach(() => {
  requireMember.mockResolvedValue({
    membership: { workspace: { id: 'w-1', name: 'Globex' }, role: 'MEMBER' },
  });
});

function open(searchParams: Record<string, string> = {}) {
  return BrandNewReceived({ searchParams: Promise.resolve(searchParams) });
}

describe('BrandNewReceived', () => {
  it('lets only a Member in, and is headed Received', async () => {
    render(await open());

    expect(requireMember).toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Received' }),
    ).toBeInTheDocument();
    expect(screen.getByText('What was received')).toBeInTheDocument();
  });

  it('offers both views', async () => {
    render(await open());

    expect(screen.getByRole('group', { name: 'View' })).toBeInTheDocument();
  });

  it('opens the piece the address names, closing back to the grid', async () => {
    render(await open({ feedback: FEEDBACK_ID }));

    expect(
      screen.getByText(
        `The postcard ${FEEDBACK_ID}, closing to /brand-new-received`,
      ),
    ).toBeInTheDocument();
  });

  it('closes back to the list when that is what it was opened over', async () => {
    render(await open({ view: 'list', feedback: FEEDBACK_ID }));

    expect(
      screen.getByText(
        `The postcard ${FEEDBACK_ID}, closing to /brand-new-received?view=list`,
      ),
    ).toBeInTheDocument();
  });

  it('closes back to the grid for a view it does not offer', async () => {
    render(await open({ view: 'table', feedback: FEEDBACK_ID }));

    expect(
      screen.getByText(
        `The postcard ${FEEDBACK_ID}, closing to /brand-new-received`,
      ),
    ).toBeInTheDocument();
  });

  it('opens nothing for a piece that is not an id', async () => {
    render(await open({ feedback: 'nope' }));

    expect(screen.queryByText(/^The postcard/)).not.toBeInTheDocument();
  });
});
