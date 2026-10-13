import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./request-feedback-form', () => ({
  RequestFeedbackForm: () => <output>request form</output>,
}));
vi.mock('./give-feedback-form', () => ({
  GiveFeedbackForm: () => <output>give form</output>,
}));

const { FeedbackComposer } = await import('./feedback-composer');

describe('FeedbackComposer', () => {
  it('opens on asking for Feedback', () => {
    render(<FeedbackComposer teammates={[]} />);

    expect(
      screen.getByRole('tab', { name: 'Request feedback' }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('request form')).toBeVisible();
  });

  it('switches to giving Feedback', async () => {
    const user = userEvent.setup();
    render(<FeedbackComposer teammates={[]} />);

    await user.click(screen.getByRole('tab', { name: 'Give feedback' }));

    expect(screen.getByRole('tab', { name: 'Give feedback' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('give form');
  });
});
