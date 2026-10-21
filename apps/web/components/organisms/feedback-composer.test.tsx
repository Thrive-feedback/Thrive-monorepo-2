import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('./request-feedback-form', () => ({
  RequestFeedbackForm: () => <output>request form</output>,
}));
vi.mock('./give-feedback-form', () => ({
  GiveFeedbackForm: () => <output>give form</output>,
}));

const { FeedbackComposer, preloadComposerForms } = await import(
  './feedback-composer'
);

// The forms load apart from the composer. Fetched first, as the composer fetches them when idle,
// they draw at once, as they do for anyone who has been on the page a moment.
beforeAll(() => preloadComposerForms());

function renderComposer() {
  return render(
    <FeedbackComposer
      teammates={[]}
      workspaceGoals={[]}
      requestAction={vi.fn()}
      giveAction={vi.fn()}
    />,
  );
}

describe('FeedbackComposer', () => {
  it('opens folded, offering to ask for advice or to give Feedback, drawing no form yet', () => {
    renderComposer();

    expect(screen.queryByText('request form')).toBeNull();
    expect(screen.queryByText('give form')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Ask for advice…' }),
    ).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.getByRole('button', { name: 'Give feedback' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens on asking for Feedback from the prompt', async () => {
    const user = userEvent.setup();
    renderComposer();

    await user.click(screen.getByRole('button', { name: 'Ask for advice…' }));

    expect(
      screen.getByRole('button', { name: 'Request feedback' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('request form')).toBeVisible();
    expect(screen.queryByText('give form')).toBeNull();
  });

  it('opens on giving Feedback, and switches between the two', async () => {
    const user = userEvent.setup();
    renderComposer();

    await user.click(screen.getByRole('button', { name: 'Give feedback' }));

    expect(
      screen.getByRole('button', { name: 'Give feedback' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('give form')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Request feedback' }));

    expect(
      screen.getByRole('button', { name: 'Request feedback' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('request form')).toBeVisible();
    expect(screen.getByText('give form')).not.toBeVisible();
  });

  it('folds again, and opens in the mode picked next', async () => {
    const user = userEvent.setup();
    renderComposer();

    await user.click(screen.getByRole('button', { name: 'Ask for advice…' }));
    expect(screen.getByRole('button', { name: 'Hide form' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Hide form' }));

    expect(screen.getByText('request form')).not.toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Give feedback' }));

    expect(screen.getByText('give form')).toBeVisible();
  });

  it('keeps a form it has drawn while folded or switched away from', async () => {
    const user = userEvent.setup();
    renderComposer();

    await user.click(screen.getByRole('button', { name: 'Ask for advice…' }));
    await user.click(screen.getByRole('button', { name: 'Give feedback' }));
    await user.click(screen.getByRole('button', { name: 'Hide form' }));

    expect(screen.getByText('request form')).not.toBeVisible();
    expect(screen.getByText('give form')).not.toBeVisible();
  });
});
