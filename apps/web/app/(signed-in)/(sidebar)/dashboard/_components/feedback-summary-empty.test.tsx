import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/lib/routes.constant';
import { FeedbackSummaryEmpty } from './feedback-summary-empty';

describe('FeedbackSummaryEmpty', () => {
  it('says why there is nothing here, without calling it a failure', () => {
    render(<FeedbackSummaryEmpty />);

    expect(
      screen.getByText(/not enough written to you yet/),
    ).toBeInTheDocument();
  });

  it('sends the person to what people actually wrote, in their own words', () => {
    render(<FeedbackSummaryEmpty />);

    for (const name of ['Received', 'Read what you have received']) {
      expect(screen.getByRole('link', { name })).toHaveAttribute(
        'href',
        ROUTES.received,
      );
    }
  });
});
