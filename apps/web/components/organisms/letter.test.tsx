import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { Letter } from './letter';

const TEAMMATES: readonly Teammate[] = [
  {
    accountId: 'mali',
    name: 'Mali Sombat',
    email: 'mali@acme.test',
    slug: 'mali',
    displayName: 'Mali',
  },
  {
    accountId: 'krit',
    name: 'Krit Chan',
    email: 'krit@acme.test',
    slug: 'krit',
    displayName: 'Krit',
  },
];

const dear = (name = /^Choose who it's for/) =>
  screen.getByRole('button', { name });

function letter(props: Partial<React.ComponentProps<typeof Letter>> = {}) {
  return (
    <Letter
      writing="feedback"
      teammates={TEAMMATES}
      recipientAccountIds={[]}
      feedbackMessage=""
      requestMessage=""
      isTurnedOver={false}
      onTurnOver={vi.fn()}
      onRecipientsChange={vi.fn()}
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
    expect(dear()).toBeInTheDocument();
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
    expect(dear(/^Choose who to ask/)).toBeInTheDocument();
  });

  it('chooses who it is for in a dialog, and hands on what is typed', async () => {
    const user = userEvent.setup();
    const onRecipientsChange = vi.fn();
    const onFeedbackMessageChange = vi.fn();
    render(letter({ onRecipientsChange, onFeedbackMessageChange }));

    await user.click(dear());
    const dialog = screen.getByRole('dialog', { name: "Choose who it's for" });
    expect(dialog).toHaveAccessibleDescription('They can always read it.');
    await user.type(
      screen.getByRole('searchbox', { name: /search by name/i }),
      '@krit @mali ',
    );
    await user.click(screen.getByRole('button', { name: 'Done (2)' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Your feedback' }),
      'W',
    );

    expect(onRecipientsChange).toHaveBeenCalledWith(['krit', 'mali']);
    expect(onFeedbackMessageChange).toHaveBeenCalledWith('W');
  });

  it('names everyone it is for', () => {
    render(letter({ recipientAccountIds: ['mali', 'krit'] }));

    expect(dear(/Chosen: Mali Sombat and Krit Chan$/)).toBeInTheDocument();
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

  it('moves focus to who it is for when the face being written changes', () => {
    const { rerender } = render(letter());

    expect(dear()).not.toHaveFocus();

    rerender(letter({ writing: 'request', isTurnedOver: true }));

    expect(dear(/^Choose who to ask/)).toHaveFocus();
  });

  it('puts the cursor on the message when somebody is already chosen', () => {
    const { rerender } = render(
      letter({ writing: null, recipientAccountIds: ['mali'] }),
    );

    rerender(letter({ recipientAccountIds: ['mali'] }));

    expect(
      screen.getByRole('textbox', { name: 'Your feedback' }),
    ).toHaveFocus();
  });
});
