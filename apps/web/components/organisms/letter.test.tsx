import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Letter } from './letter';

function letter(props: Partial<React.ComponentProps<typeof Letter>> = {}) {
  return (
    <Letter
      writing="feedback"
      recipient=""
      feedbackMessage=""
      requestMessage=""
      isTurnedOver={false}
      onTurnOver={vi.fn()}
      onRecipientChange={vi.fn()}
      onFeedbackMessageChange={vi.fn()}
      onRequestMessageChange={vi.fn()}
      {...props}
    />
  );
}

describe('Letter', () => {
  it('shows the Feedback message, ready to write', () => {
    render(letter());

    expect(
      screen.getByRole('heading', { name: 'Feedback message' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Request message' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Dear' })).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Your feedback' }),
    ).toBeInTheDocument();
  });

  it('shows the Request message when turned over', () => {
    render(letter({ writing: 'request', isTurnedOver: true }));

    expect(
      screen.getByRole('heading', { name: 'Request message' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'What you would like feedback on' }),
    ).toBeInTheDocument();
  });

  it('hands on what is typed', async () => {
    const user = userEvent.setup();
    const onRecipientChange = vi.fn();
    const onFeedbackMessageChange = vi.fn();
    render(letter({ onRecipientChange, onFeedbackMessageChange }));

    await user.type(screen.getByRole('textbox', { name: 'Dear' }), 'M');
    await user.type(
      screen.getByRole('textbox', { name: 'Your feedback' }),
      'W',
    );

    expect(onRecipientChange).toHaveBeenCalledWith('M');
    expect(onFeedbackMessageChange).toHaveBeenCalledWith('W');
  });

  it('only shows what is written when nothing is being written', () => {
    render(letter({ writing: null, feedbackMessage: 'The demo landed well.' }));

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('The demo landed well.')).toBeInTheDocument();
  });

  it('leaves the front for the people asked while a Request is written', () => {
    render(letter({ writing: 'request', isTurnedOver: false }));

    expect(
      screen.getByText(
        'This side is for the people you request feedback from. They write their answer here.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('turns over when it is free to', async () => {
    const user = userEvent.setup();
    const onTurnOver = vi.fn();
    render(letter({ writing: 'request', isTurnedOver: true, onTurnOver }));

    await user.click(
      screen.getByRole('button', { name: 'Turn over to Feedback message' }),
    );

    expect(onTurnOver).toHaveBeenCalledOnce();
  });

  it('will not turn over while locked, and says why', async () => {
    const user = userEvent.setup();
    const onTurnOver = vi.fn();
    render(letter({ isTurnLocked: true, onTurnOver }));

    const turnOver = screen.getByRole('button', {
      name: 'Turn over to Request message',
    });
    expect(turnOver).toHaveAttribute('aria-disabled', 'true');

    await user.click(turnOver);

    expect(onTurnOver).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        'The letter stays on Feedback message while you write it.',
      ),
    ).toBeInTheDocument();
  });

  it('puts the cursor on who it is for when the face being written changes', () => {
    const { rerender } = render(letter());

    expect(screen.getByRole('textbox', { name: 'Dear' })).not.toHaveFocus();

    rerender(letter({ writing: 'request', isTurnedOver: true }));

    expect(screen.getByRole('textbox', { name: 'Dear' })).toHaveFocus();
  });

  it('puts the cursor on the message when who it is for is filled in', () => {
    const { rerender } = render(letter({ writing: null, recipient: 'Mali' }));

    rerender(letter({ recipient: 'Mali' }));

    expect(
      screen.getByRole('textbox', { name: 'Your feedback' }),
    ).toHaveFocus();
  });
});
