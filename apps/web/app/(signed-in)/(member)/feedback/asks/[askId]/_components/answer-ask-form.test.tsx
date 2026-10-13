import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AnswerAskForm } from './answer-ask-form';

const answerAsk = vi.fn();
vi.mock('../_lib/answer-ask-actions.service', () => ({
  answerAsk: (previous: unknown, formData: FormData) =>
    answerAsk(previous, formData),
}));

const ASK_ID = '0199a0f0-0000-7000-8000-0000000000a1';
const WRITTEN = 'You lose the room at the detail.';

function answerBox() {
  return screen.getByRole('textbox', {
    name: /What would you tell Ann\?/,
  });
}

function sendButton() {
  return screen.getByRole('button', { name: 'Send answer' });
}

function renderForm(requesterName: string | null = 'Ann') {
  answerAsk.mockResolvedValue({});
  render(<AnswerAskForm askId={ASK_ID} requesterName={requesterName} />);
}

function sentFormData() {
  const formData = answerAsk.mock.calls[0]?.[1] as FormData;
  return Object.fromEntries(formData.entries());
}

describe('AnswerAskForm', () => {
  it('sends what was written, with the Ask it answers', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(answerBox(), WRITTEN);
    await user.click(sendButton());

    expect(answerAsk).toHaveBeenCalledOnce();
    expect(sentFormData()).toEqual({ askId: ASK_ID, body: WRITTEN });
  });

  it('refuses an empty box, says so on the field, and sends nothing', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(sendButton());

    expect(answerBox()).toHaveAccessibleDescription(
      'Write your answer before sending it.',
    );
    expect(answerBox()).toHaveFocus();
    expect(answerAsk).not.toHaveBeenCalled();
  });

  it('treats a box of only spaces as empty', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(answerBox(), '   ');
    await user.click(sendButton());

    expect(answerAsk).not.toHaveBeenCalled();
  });

  it('keeps what was written when the API refuses, so nobody retypes it', async () => {
    const user = userEvent.setup();
    answerAsk.mockResolvedValue({
      fieldErrors: { body: 'Write your answer before sending it.' },
    });
    render(<AnswerAskForm askId={ASK_ID} requesterName="Ann" />);

    await user.type(answerBox(), WRITTEN);
    await user.click(sendButton());

    expect(answerBox()).toHaveValue(WRITTEN);
  });

  it('says who will read it until the answer gets long, then counts down', async () => {
    const user = userEvent.setup();
    renderForm();

    expect(answerBox()).toHaveAccessibleDescription(
      'They see your name with your answer. Say what you would say in person.',
    );

    await user.click(answerBox());
    await user.paste('a'.repeat(3501));

    expect(answerBox()).toHaveAccessibleDescription('499 characters left.');
  });

  it('asks the person nothing about who asked when they have no name yet', () => {
    renderForm(null);

    expect(
      screen.getByRole('textbox', { name: /What would you tell them\?/ }),
    ).toBeInTheDocument();
  });

  it('reads out a refusal that belongs to the whole form', async () => {
    const user = userEvent.setup();
    answerAsk.mockResolvedValue({
      formError: "We couldn't send your answer. Please try again.",
    });
    render(<AnswerAskForm askId={ASK_ID} requesterName="Ann" />);

    await user.type(answerBox(), WRITTEN);
    await user.click(sendButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't send your answer. Please try again.",
    );
  });
});
