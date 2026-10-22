import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Toaster } from '@/components/atoms/toaster';
import { LetterDemo } from './letter-demo';

function choose(user: ReturnType<typeof userEvent.setup>, kind: string) {
  return user.click(screen.getByRole('button', { name: kind }));
}

describe('LetterDemo', () => {
  it('opens on the Give message side, with nothing to type yet', () => {
    render(<LetterDemo />);

    expect(
      screen.getByRole('heading', { name: 'Give message' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Request message' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('offers three letters to write, with Kudo not ready yet', () => {
    render(<LetterDemo />);

    const write = screen.getByRole('complementary', { name: 'Write' });
    expect(write).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Request feedback' }),
    ).toHaveAttribute('aria-pressed', 'false');
    expect(
      screen.getByRole('button', { name: 'Give feedback' }),
    ).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /Kudo/ })).toBeDisabled();
  });

  it('opens the Give message for writing, starting at who it is for', async () => {
    const user = userEvent.setup();
    render(<LetterDemo />);

    await choose(user, 'Give feedback');

    expect(
      screen.getByRole('button', { name: 'Give feedback' }),
    ).toHaveAttribute('aria-pressed', 'true');
    const recipient = screen.getByRole('textbox', { name: 'Dear' });
    expect(recipient).toHaveFocus();

    await user.type(recipient, 'Mali');
    await user.type(
      screen.getByRole('textbox', { name: 'Your feedback' }),
      'The demo landed well.',
    );

    expect(recipient).toHaveValue('Mali');
    expect(screen.getByRole('textbox', { name: 'Your feedback' })).toHaveValue(
      'The demo landed well.',
    );
  });

  it('turns to the Request message for writing when feedback is requested', async () => {
    const user = userEvent.setup();
    render(<LetterDemo />);

    await choose(user, 'Request feedback');

    expect(
      screen.getByRole('heading', { name: 'Request message' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Give message' }),
    ).not.toBeInTheDocument();

    const recipient = screen.getByRole('textbox', { name: 'Dear' });
    expect(recipient).toHaveFocus();

    await user.type(recipient, 'Krit');
    await user.type(
      screen.getByRole('textbox', { name: 'What you would like feedback on' }),
      'How did the kickoff go?',
    );

    expect(
      screen.getByRole('textbox', { name: 'What you would like feedback on' }),
    ).toHaveValue('How did the kickoff go?');
  });

  it('keeps a separate letter on each side', async () => {
    const user = userEvent.setup();
    render(<LetterDemo />);

    await choose(user, 'Give feedback');
    await user.type(screen.getByRole('textbox', { name: 'Dear' }), 'Mali');
    await choose(user, 'Request feedback');

    expect(screen.getByRole('textbox', { name: 'Dear' })).toHaveValue('');

    await choose(user, 'Give feedback');

    expect(screen.getByRole('textbox', { name: 'Dear' })).toHaveValue('Mali');
    expect(
      screen.getByRole('textbox', { name: 'Your feedback' }),
    ).toHaveFocus();
  });

  it('turns over freely before a letter is chosen', async () => {
    const user = userEvent.setup();
    render(<LetterDemo />);

    await user.click(
      screen.getByRole('button', { name: 'Turn over to Request message' }),
    );

    expect(
      screen.getByRole('heading', { name: 'Request message' }),
    ).toBeInTheDocument();
  });

  it('will not turn over while the Give message is being written', async () => {
    const user = userEvent.setup();
    render(<LetterDemo />);

    await choose(user, 'Give feedback');
    const turnOver = screen.getByRole('button', {
      name: 'Turn over to Request message',
    });

    expect(turnOver).toHaveAttribute('aria-disabled', 'true');

    await user.click(turnOver);

    expect(
      screen.getByRole('heading', { name: 'Give message' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('The letter stays on Give message while you write it.'),
    ).toBeInTheDocument();
  });

  it('shows the Give side as theirs, not yours, while requesting', async () => {
    const user = userEvent.setup();
    render(<LetterDemo />);

    await choose(user, 'Request feedback');
    await user.type(
      screen.getByRole('textbox', { name: 'What you would like feedback on' }),
      'How did the kickoff go?',
    );

    await user.click(
      screen.getByRole('button', { name: 'Turn over to Give message' }),
    );

    expect(
      screen.getByText(
        'This side is for the people you request feedback from. They write their answer here.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Heart stamp' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stamps' })).toBeDisabled();

    await user.click(
      screen.getByRole('button', { name: 'Turn over to Request message' }),
    );

    expect(screen.getByRole('button', { name: 'Stamps' })).toBeEnabled();

    expect(
      screen.getByRole('textbox', { name: 'What you would like feedback on' }),
    ).toHaveValue('How did the kickoff go?');
  });

  it('moves, resizes, turns and takes off a stamp from the keyboard', async () => {
    const user = userEvent.setup();
    render(<LetterDemo />);

    const stamp = screen.getByRole('button', { name: 'Heart stamp' });
    // The stamp's place, size and turn are drawn on the frame around it.
    const frame = stamp.parentElement;
    const before = { ...frame?.style };

    stamp.focus();
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('+');
    await user.keyboard(']');

    expect(frame?.style.left).not.toBe(before.left);
    expect(frame?.style.width).not.toBe(before.width);
    expect(frame?.style.rotate).not.toBe(before.rotate);

    await user.keyboard('{Delete}');

    expect(
      screen.queryByRole('button', { name: 'Heart stamp' }),
    ).not.toBeInTheDocument();
  });

  it('selects a stamp with its handles, leaving the Stamps drawer shut', async () => {
    const user = userEvent.setup();
    render(<LetterDemo />);

    expect(
      screen.queryByRole('complementary', { name: 'Stamps' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Heart stamp' }));

    expect(screen.getByRole('button', { name: 'Heart stamp' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('button', { name: 'Resize the stamp' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Turn the stamp' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('complementary', { name: 'Stamps' }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Remove the Heart stamp' }),
    );

    expect(
      screen.queryByRole('button', { name: 'Heart stamp' }),
    ).not.toBeInTheDocument();
  });

  it('adds stamps from the Stamps drawer, opened from its button', async () => {
    const user = userEvent.setup();
    render(<LetterDemo />);

    await user.click(screen.getByRole('button', { name: 'Stamps' }));
    await user.click(
      screen.getByRole('button', { name: 'Add a Rocket stamp' }),
    );
    await user.click(screen.getByRole('button', { name: 'Add a Star stamp' }));

    expect(
      screen.getByRole('button', { name: 'Rocket stamp' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Star stamp' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Close stamps' }));

    expect(
      screen.queryByRole('complementary', { name: 'Stamps' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stamps' })).toHaveFocus();
  });

  it('closes the Stamps drawer on Escape, from its first stamp', async () => {
    const user = userEvent.setup();
    render(<LetterDemo />);

    await user.click(screen.getByRole('button', { name: 'Stamps' }));

    expect(
      screen.getByRole('button', { name: 'Add a Heart stamp' }),
    ).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(
      screen.queryByRole('complementary', { name: 'Stamps' }),
    ).not.toBeInTheDocument();
  });

  it('waits to send until the letter says who it is for and what it says', async () => {
    const user = userEvent.setup();
    render(<LetterDemo />);

    expect(
      screen.queryByRole('button', { name: 'Send' }),
    ).not.toBeInTheDocument();

    await choose(user, 'Give feedback');
    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: 'Dear' }), 'Mali');
    expect(send).toBeDisabled();

    await user.type(
      screen.getByRole('textbox', { name: 'Your feedback' }),
      'Clear and kind.',
    );
    expect(send).toBeEnabled();
  });

  it('asks for someone to share with when Selected people is chosen', async () => {
    const user = userEvent.setup();
    render(<LetterDemo />);

    await choose(user, 'Request feedback');
    await user.type(screen.getByRole('textbox', { name: 'Dear' }), 'Krit');
    await user.type(
      screen.getByRole('textbox', { name: 'What you would like feedback on' }),
      'How did the kickoff go?',
    );

    await user.click(
      screen.getByRole('button', { name: 'Who else can read it: Only me' }),
    );
    await user.click(screen.getByRole('radio', { name: 'Selected people' }));

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: 'Ann Lee' }));

    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
    expect(
      screen.getByRole('button', {
        name: 'Who else can read it: Selected people',
      }),
    ).toBeInTheDocument();
  });

  it('pretends to send, then leaves that side blank', async () => {
    const user = userEvent.setup();
    render(
      <>
        <LetterDemo />
        <Toaster />
      </>,
    );

    await choose(user, 'Give feedback');
    await user.type(screen.getByRole('textbox', { name: 'Dear' }), 'Mali');
    await user.type(
      screen.getByRole('textbox', { name: 'Your feedback' }),
      'Clear and kind.',
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Give message sent.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Dear' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Your feedback' })).toHaveValue(
      '',
    );
  });

  it('keeps Send for the letter being written on either side', async () => {
    const user = userEvent.setup();
    render(<LetterDemo />);

    await choose(user, 'Request feedback');
    await user.click(
      screen.getByRole('button', { name: 'Turn over to Give message' }),
    );

    expect(
      screen.getByRole('button', { name: 'Who else can read it: Only me' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });
});
