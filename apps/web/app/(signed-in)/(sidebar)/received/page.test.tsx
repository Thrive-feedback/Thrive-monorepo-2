import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Received from './page';

const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000d1';

const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: () => requireMember(),
}));
const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('./_components/received-items', () => ({
  ReceivedItems: () => <p>What was received</p>,
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
  return Received({ searchParams: Promise.resolve(searchParams) });
}

describe('Received', () => {
  it('lets only a Member in, and is headed Received', async () => {
    render(await open());

    expect(requireMember).toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Received' }),
    ).toBeInTheDocument();
    expect(screen.getByText('What was received')).toBeInTheDocument();
  });

  it('offers each kind it can show, with everything chosen at first', async () => {
    render(await open());

    const kinds = screen.getByRole('group', { name: 'Show' });
    expect(
      within(kinds)
        .getAllByRole('button')
        .map((chip) => chip.textContent),
    ).toEqual(['All', 'My requests', 'Given to me', 'Kudos']);
    expect(within(kinds).getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('narrows to another kind through the address', async () => {
    const user = userEvent.setup();
    render(await open());

    await user.click(screen.getByRole('button', { name: 'My requests' }));

    expect(push).toHaveBeenCalledWith('/received?show=requests');
  });

  it('closes a piece back to the kind it was opened over', async () => {
    render(await open({ show: 'kudos', view: 'grid', feedback: FEEDBACK_ID }));

    expect(
      screen.getByText(
        `The postcard ${FEEDBACK_ID}, closing to /received?show=kudos&view=grid`,
      ),
    ).toBeInTheDocument();
  });

  it('offers both views', async () => {
    render(await open());

    expect(screen.getByRole('group', { name: 'View' })).toBeInTheDocument();
  });

  it('opens the piece the address names, closing back to the list', async () => {
    render(await open({ feedback: FEEDBACK_ID }));

    expect(
      screen.getByText(`The postcard ${FEEDBACK_ID}, closing to /received`),
    ).toBeInTheDocument();
  });

  it('closes back to the grid when that is what it was opened over', async () => {
    render(await open({ view: 'grid', feedback: FEEDBACK_ID }));

    expect(
      screen.getByText(
        `The postcard ${FEEDBACK_ID}, closing to /received?view=grid`,
      ),
    ).toBeInTheDocument();
  });

  it('closes back to the list for a view it does not offer', async () => {
    render(await open({ view: 'table', feedback: FEEDBACK_ID }));

    expect(
      screen.getByText(`The postcard ${FEEDBACK_ID}, closing to /received`),
    ).toBeInTheDocument();
  });

  it('opens nothing for a piece that is not an id', async () => {
    render(await open({ feedback: 'nope' }));

    expect(screen.queryByText(/^The postcard/)).not.toBeInTheDocument();
  });
});
