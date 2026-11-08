import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/lib/routes.constant';
import type { FeedbackSummary } from '../_lib/feedback-summary.type';
import { FeedbackSummaryCard } from './feedback-summary-card';

const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000f1';
const KUDOS_ID = '0199a0f0-0000-7000-8000-0000000000k1';

function aSummary(overrides: Partial<FeedbackSummary> = {}): FeedbackSummary {
  return {
    period: '2026-Q4',
    generatedAt: '2026-11-08T09:00:00.000Z',
    isStale: false,
    sourceCount: 7,
    sections: [
      {
        name: 'themes',
        title: 'What runs through it',
        points: [
          {
            point: 'You open strongly and lose the room at the detail.',
            sources: [
              { id: FEEDBACK_ID, kind: 'FEEDBACK' },
              { id: KUDOS_ID, kind: 'KUDOS' },
            ],
          },
        ],
      },
      {
        name: 'strengths',
        title: 'What people keep praising',
        points: [],
      },
      {
        name: 'areas_to_improve',
        title: 'What people keep asking for',
        points: [],
      },
      {
        name: 'suggested_actions',
        title: 'A few things to try',
        points: [{ point: 'Park the detail in a follow-up.', sources: [] }],
      },
    ],
    ...overrides,
  };
}

describe('FeedbackSummaryCard', () => {
  it('says which quarter it covers and how much it was written from', () => {
    render(<FeedbackSummaryCard summary={aSummary()} />);

    expect(screen.getByText('Q4 2026')).toBeInTheDocument();
    expect(screen.getByText(/from 7 messages/)).toBeInTheDocument();
  });

  it('leads every point back to the message it came from, in the open', () => {
    render(<FeedbackSummaryCard summary={aSummary()} />);

    expect(
      screen.getByRole('link', { name: /Open the Feedback this came from/ }),
    ).toHaveAttribute('href', ROUTES.receivedFeedback(FEEDBACK_ID));
    expect(
      screen.getByRole('link', { name: /Open the Kudos this came from/ }),
    ).toHaveAttribute('href', ROUTES.receivedViewing('list', 'kudos'));
  });

  it('says a section is empty rather than dropping it, because empty is an answer', () => {
    render(<FeedbackSummaryCard summary={aSummary()} />);

    expect(
      screen.getByRole('heading', { name: 'What people keep asking for' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Nobody has asked you to change anything.'),
    ).toBeInTheDocument();
  });

  it('cites nothing for a suggested action, which follows from the points above it', () => {
    render(<FeedbackSummaryCard summary={aSummary()} />);

    const action = screen
      .getByText('Park the detail in a follow-up.')
      .closest('li');
    expect(action).not.toBeNull();
    expect(within(action as HTMLElement).queryByRole('link')).toBeNull();
  });

  it('says so when Feedback has arrived since it was written', () => {
    render(<FeedbackSummaryCard summary={aSummary({ isStale: true })} />);

    expect(screen.getByText('New feedback since')).toBeInTheDocument();
    expect(
      screen.getByText(/A newer one is being written/),
    ).toBeInTheDocument();
  });

  it('says nothing about being behind when it is current', () => {
    render(<FeedbackSummaryCard summary={aSummary()} />);

    expect(screen.queryByText('New feedback since')).toBeNull();
  });

  it('tells the person it is theirs alone', () => {
    render(<FeedbackSummaryCard summary={aSummary()} />);

    expect(screen.getByText(/Only you can read this/)).toBeInTheDocument();
  });
});
