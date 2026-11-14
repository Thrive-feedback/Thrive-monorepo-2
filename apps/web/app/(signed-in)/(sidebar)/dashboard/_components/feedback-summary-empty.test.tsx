import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/lib/routes.constant';
import { FeedbackSummaryEmpty } from './feedback-summary-empty';

describe('FeedbackSummaryEmpty', () => {
  it('says why there is nothing here, without calling it a failure', () => {
    render(<FeedbackSummaryEmpty isAvailable />);

    expect(
      screen.getByText(/not enough written to you yet/),
    ).toBeInTheDocument();
  });

  it('says summaries are not switched on, rather than blaming the person’s Feedback', () => {
    render(<FeedbackSummaryEmpty isAvailable={false} />);

    expect(screen.getByText(/not switched on here yet/)).toBeInTheDocument();
    // The falsehood this exists to prevent: there may be plenty written to them.
    expect(screen.queryByText(/not enough written to you/)).toBeNull();
  });

  it.each([true, false])(
    'sends the person to what people actually wrote (available: %s)',
    (isAvailable) => {
      render(<FeedbackSummaryEmpty isAvailable={isAvailable} />);

      for (const name of ['Received', 'Read what you have received']) {
        expect(screen.getByRole('link', { name })).toHaveAttribute(
          'href',
          ROUTES.received,
        );
      }
    },
  );
});
