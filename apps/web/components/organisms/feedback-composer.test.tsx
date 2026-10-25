import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('./request-feedback-form', () => ({
  RequestFeedbackForm: () => <output>request form</output>,
}));
vi.mock('./give-feedback-form', () => ({
  GiveFeedbackForm: () => <output>give form</output>,
}));
vi.mock('./kudos-form', () => ({
  KudosForm: () => <output>kudos form</output>,
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
  it('is always open, ready to write, on asking for Feedback, drawing only that form', () => {
    renderComposer();

    expect(
      screen.getByRole('button', { name: 'Request feedback' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('request form')).toBeVisible();
    expect(screen.queryByText('give form')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Hide form' })).toBeNull();
  });

  it('switches between asking for and giving Feedback, keeping each form it has drawn', async () => {
    const user = userEvent.setup();
    renderComposer();

    await user.click(screen.getByRole('button', { name: 'Give feedback' }));

    expect(
      screen.getByRole('button', { name: 'Give feedback' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('give form')).toBeVisible();
    expect(screen.getByText('request form')).not.toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Request feedback' }));

    expect(
      screen.getByRole('button', { name: 'Request feedback' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('request form')).toBeVisible();
    expect(screen.getByText('give form')).not.toBeVisible();
  });

  it('offers Kudos as a third mode where Kudos can be sent', async () => {
    const user = userEvent.setup();
    render(
      <FeedbackComposer
        teammates={[]}
        workspaceGoals={[]}
        requestAction={vi.fn()}
        giveAction={vi.fn()}
        kudosAction={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Kudos' }));

    expect(await screen.findByText('kudos form')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Kudos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Give feedback' }));

    expect(screen.getByText('kudos form')).not.toBeVisible();
    expect(await screen.findByText('give form')).toBeVisible();
  });

  it('has no Kudos where none can be sent', () => {
    renderComposer();

    expect(screen.queryByRole('button', { name: 'Kudos' })).toBeNull();
  });
});
