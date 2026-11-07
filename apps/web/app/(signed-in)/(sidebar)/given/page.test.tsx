import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Given from './page';

const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000d1';

const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: () => requireMember(),
}));
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('./_components/given-items', () => ({
  GivenItems: () => <p>What was given</p>,
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

beforeEach(() => {
  requireMember.mockResolvedValue({
    membership: { workspace: { id: 'w-1', name: 'Globex' }, role: 'MEMBER' },
  });
});

function open(searchParams: Record<string, string> = {}) {
  return Given({ searchParams: Promise.resolve(searchParams) });
}

describe('Given', () => {
  it('lets only a Member in, and is headed Given', async () => {
    render(await open());

    expect(requireMember).toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Given' }),
    ).toBeInTheDocument();
    expect(screen.getByText('What was given')).toBeInTheDocument();
  });

  it('offers both views', async () => {
    render(await open());

    expect(screen.getByRole('group', { name: 'View' })).toBeInTheDocument();
  });

  it('opens the piece the address names, closing back to the list', async () => {
    render(await open({ feedback: FEEDBACK_ID }));

    expect(
      screen.getByText(`The postcard ${FEEDBACK_ID}, closing to /given`),
    ).toBeInTheDocument();
  });

  it('closes back to the grid when that is what it was opened over', async () => {
    render(await open({ view: 'grid', feedback: FEEDBACK_ID }));

    expect(
      screen.getByText(
        `The postcard ${FEEDBACK_ID}, closing to /given?view=grid`,
      ),
    ).toBeInTheDocument();
  });

  it('closes back to the list for a view it does not offer', async () => {
    render(await open({ view: 'table', feedback: FEEDBACK_ID }));

    expect(
      screen.getByText(`The postcard ${FEEDBACK_ID}, closing to /given`),
    ).toBeInTheDocument();
  });

  it('opens nothing for a piece that is not an id', async () => {
    render(await open({ feedback: 'nope' }));

    expect(screen.queryByText(/^The postcard/)).not.toBeInTheDocument();
  });
});
