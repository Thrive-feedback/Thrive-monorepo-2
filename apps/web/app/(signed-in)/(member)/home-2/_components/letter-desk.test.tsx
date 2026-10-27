import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Toaster } from '@/components/atoms/toaster';
import { LetterDesk } from './letter-desk';

async function choose(user: ReturnType<typeof userEvent.setup>, kind: string) {
  await user.click(screen.getByRole('button', { name: 'Write a letter' }));
  await user.click(screen.getByRole('menuitemcheckbox', { name: kind }));
}

/** The button after "Dear": named for what it chooses, then everyone chosen. */
function dear(name: RegExp = /^Choose who (it's for|to ask)/) {
  return screen.getByRole('button', { name });
}

/** Chooses who the letter is for by typing their handles in the dialog, then Done. */
async function address(
  user: ReturnType<typeof userEvent.setup>,
  handles: string,
) {
  await user.click(dear());
  await user.keyboard(`${handles} `);
  await user.click(screen.getByRole('button', { name: /^Done/ }));
}

describe('LetterDesk', () => {
  it('opens on a Feedback message, ready to write', () => {
    render(<LetterDesk />);

    expect(
      screen.getByRole('heading', { name: 'Feedback message' }),
    ).toBeInTheDocument();
    expect(dear(/^Choose who it's for$/)).toBeInTheDocument();
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
    expect(dear(/^Choose who to ask$/)).toHaveFocus();
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

    await address(user, '@mali');
    await choose(user, 'Request feedback');

    expect(dear(/^Choose who to ask$/)).toBeInTheDocument();

    await choose(user, 'Give feedback');

    expect(dear(/Chosen: Mali Sombat$/)).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Your feedback' }),
    ).toHaveFocus();
  });

  it('waits to send until the letter says who it is for and what it says', async () => {
    const user = userEvent.setup();
    render(<LetterDesk />);

    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toBeDisabled();

    await address(user, '@mali @krit');
    expect(dear(/Chosen: Mali Sombat and Krit Chan$/)).toBeInTheDocument();
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

    await address(user, '@mali');
    await user.type(
      screen.getByRole('textbox', { name: 'Your feedback' }),
      'Clear and kind.',
    );
    await user.click(
      screen.getByRole('button', { name: 'Who else can read it: Only them' }),
    );
    await user.click(screen.getByRole('radio', { name: 'Selected people' }));

    expect(
      screen.getByRole('dialog', { name: 'Choose who else can read' }),
    ).toHaveAccessibleDescription('Mali Sombat and you can always read it.');

    await user.click(screen.getByRole('checkbox', { name: 'Ann Lee' }));
    await user.click(screen.getByRole('button', { name: 'Done (1)' }));

    expect(
      screen.getByRole('button', {
        name: 'Choose who else can read. Chosen: Ann Lee',
      }),
    ).toBeInTheDocument();
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

    await address(user, '@mali');
    await user.type(
      screen.getByRole('textbox', { name: 'Your feedback' }),
      'Clear and kind.',
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(
      await screen.findByText('Feedback message sent.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(dear(/^Choose who it's for$/)).toHaveFocus());
    expect(screen.getByRole('textbox', { name: 'Your feedback' })).toHaveValue(
      '',
    );
  });
});
