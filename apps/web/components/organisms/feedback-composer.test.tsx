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
    render(
      <FeedbackComposer
        teammates={[]}
        workspaceGoals={[]}
        requestAction={vi.fn()}
        giveAction={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Request feedback' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('request form')).toBeVisible();
    expect(screen.getByText('give form')).not.toBeVisible();
  });

  it('switches to giving Feedback', async () => {
    const user = userEvent.setup();
    render(
      <FeedbackComposer
        teammates={[]}
        workspaceGoals={[]}
        requestAction={vi.fn()}
        giveAction={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Give feedback' }));

    expect(
      screen.getByRole('button', { name: 'Give feedback' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Request feedback' }),
    ).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('give form')).toBeVisible();
    expect(screen.getByText('request form')).not.toBeVisible();
  });

  it('hides the forms but keeps the buttons, and shows them again', async () => {
    const user = userEvent.setup();
    render(
      <FeedbackComposer
        teammates={[]}
        workspaceGoals={[]}
        requestAction={vi.fn()}
        giveAction={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Hide form' }));

    expect(screen.getByText('request form')).not.toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Request feedback' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Show form' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );

    await user.click(screen.getByRole('button', { name: 'Show form' }));

    expect(screen.getByText('request form')).toBeVisible();
  });

  it('opens the forms again when a mode is picked', async () => {
    const user = userEvent.setup();
    render(
      <FeedbackComposer
        teammates={[]}
        workspaceGoals={[]}
        requestAction={vi.fn()}
        giveAction={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Hide form' }));
    await user.click(screen.getByRole('button', { name: 'Give feedback' }));

    expect(screen.getByText('give form')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Hide form' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});
