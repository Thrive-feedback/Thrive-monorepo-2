import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Toaster } from '@/components/atoms/toaster';
import { LetterDesk } from './letter-desk';

async function choose(user: ReturnType<typeof userEvent.setup>, kind: string) {
  await user.click(screen.getByRole('button', { name: 'Write a letter' }));
  await user.click(screen.getByRole('menuitemcheckbox', { name: kind }));
}

describe('LetterDesk', () => {
  it('opens on a Feedback message, ready to write', () => {
    render(<LetterDesk />);

    expect(
      screen.getByRole('heading', { name: 'Feedback message' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Dear' })).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Your feedback' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Who else can read it: Only them' }),
    ).toBeInTheDocument();
  });

  it('offers the letters to write, Give feedback checked and Kudo not ready', async () => {
    const user = userEvent.setup();
    render(<LetterDesk />);

    await user.click(screen.getByRole('button', { name: 'Write a letter' }));

    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Give feedback' }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Request feedback' }),
    ).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('menuitem', { name: /Kudo/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('turns to the Request message when feedback is requested, starting at who it is for', async () => {
    const user = userEvent.setup();
    render(<LetterDesk />);

    await choose(user, 'Request feedback');

    expect(
      screen.getByRole('heading', { name: 'Request message' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitemcheckbox', { name: 'Request feedback' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Dear' })).toHaveFocus();
    expect(
      screen.getByRole('button', { name: 'Who else can read it: Only me' }),
    ).toBeInTheDocument();
  });

  it('will not turn over while the Feedback message is written', async () => {
    const user = userEvent.setup();
    render(<LetterDesk />);

    await user.click(
      screen.getByRole('button', { name: 'Turn over to Request message' }),
    );

    expect(
      screen.getByRole('heading', { name: 'Feedback message' }),
    ).toBeInTheDocument();
  });

  it('turns over freely while a Request message is written', async () => {
    const user = userEvent.setup();
    render(<LetterDesk />);

    await choose(user, 'Request feedback');
    await user.click(
      screen.getByRole('button', { name: 'Turn over to Feedback message' }),
    );

    expect(
      screen.getByRole('heading', { name: 'Feedback message' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'This side is for the people you request feedback from. They write their answer here.',
      ),
    ).toBeInTheDocument();
  });

  it('keeps a separate draft for each kind of letter', async () => {
    const user = userEvent.setup();
    render(<LetterDesk />);

    await user.type(screen.getByRole('textbox', { name: 'Dear' }), 'Mali');
    await choose(user, 'Request feedback');

    expect(screen.getByRole('textbox', { name: 'Dear' })).toHaveValue('');

    await choose(user, 'Give feedback');

    expect(screen.getByRole('textbox', { name: 'Dear' })).toHaveValue('Mali');
    expect(
      screen.getByRole('textbox', { name: 'Your feedback' }),
    ).toHaveFocus();
  });

  it('waits to send until the letter says who it is for and what it says', async () => {
    const user = userEvent.setup();
    render(<LetterDesk />);

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
    render(<LetterDesk />);

    await user.type(screen.getByRole('textbox', { name: 'Dear' }), 'Mali');
    await user.type(
      screen.getByRole('textbox', { name: 'Your feedback' }),
      'Clear and kind.',
    );
    await user.click(
      screen.getByRole('button', { name: 'Who else can read it: Only them' }),
    );
    await user.click(screen.getByRole('radio', { name: 'Selected people' }));

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: 'Ann Lee' }));

    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });

  it('pretends to send, then leaves that letter blank', async () => {
    const user = userEvent.setup();
    render(
      <>
        <LetterDesk />
        <Toaster />
      </>,
    );

    await user.type(screen.getByRole('textbox', { name: 'Dear' }), 'Mali');
    await user.type(
      screen.getByRole('textbox', { name: 'Your feedback' }),
      'Clear and kind.',
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(
      await screen.findByText('Feedback message sent.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Dear' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Dear' })).toHaveFocus();
    expect(screen.getByRole('textbox', { name: 'Your feedback' })).toHaveValue(
      '',
    );
  });
});
