import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Toaster } from '@/components/atoms/toaster';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { ComposeMenu } from './compose-menu';

const TEAMMATES: readonly Teammate[] = [
  {
    accountId: 'mali',
    name: 'Mali Sombat',
    email: 'mali@acme.test',
    photoUrl: null,
    slug: 'mali',
    displayName: 'Mali',
  },
];

const WRITER = { name: 'Ann', photoUrl: null };

function draw() {
  render(
    <>
      <ComposeMenu teammates={TEAMMATES} writer={WRITER} />
      <Toaster />
    </>,
  );
}

async function choose(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  await user.click(screen.getByRole('button', { name: 'Write something' }));
  await user.click(screen.getByRole('menuitem', { name }));
}

/** Chooses a card to write; its code arrives on demand, so this waits for the card itself. */
async function openPostcard(
  user: ReturnType<typeof userEvent.setup>,
  name: RegExp,
) {
  await choose(user, name);
  return screen.findByRole('dialog');
}

describe('ComposeMenu', () => {
  it('offers the three things to write, each saying what it is for', async () => {
    const user = userEvent.setup();
    draw();

    await user.click(screen.getByRole('button', { name: 'Write something' }));

    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent),
    ).toEqual([
      'Ask for feedbackAsk teammates what they think.',
      "Give feedbackTell a teammate what you've seen.",
      'Give kudosSay well done in a few words.',
    ]);
  });

  it('opens the postcard titled by the choice, with the focus on the card', async () => {
    const user = userEvent.setup();
    draw();

    await openPostcard(user, /Give feedback/);

    const dialog = screen.getByRole('dialog', { name: 'Give feedback' });
    expect(within(dialog).getByText('Ann')).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: /^Choose who it's for/ }),
    ).toHaveFocus();
  });

  it('opens the request postcard to ask for feedback', async () => {
    const user = userEvent.setup();
    draw();

    await openPostcard(user, /Ask for feedback/);

    const dialog = screen.getByRole('dialog', { name: 'Ask for feedback' });
    expect(
      within(dialog).getByRole('textbox', { name: 'Your request' }),
    ).toBeInTheDocument();
  });

  it('gives focus back to "+" once the postcard is closed', async () => {
    const user = userEvent.setup();
    draw();

    await openPostcard(user, /Give feedback/);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(
      screen.getByRole('button', { name: 'Write something' }),
    ).toHaveFocus();
  });

  it('says a sent postcard went, since nothing reaches the API yet', async () => {
    const user = userEvent.setup();
    draw();

    await openPostcard(user, /Give feedback/);
    await user.click(
      screen.getByRole('button', { name: /^Choose who it's for/ }),
    );
    await user.click(screen.getByRole('checkbox', { name: /Mali Sombat/ }));
    await user.click(screen.getByRole('button', { name: /^Done/ }));
    await user.type(
      screen.getByRole('textbox', { name: 'Your feedback' }),
      'Thank you for the demo.',
    );
    await user.click(screen.getByRole('button', { name: /Seal & Send/ }));

    expect(await screen.findByText('Feedback sent.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('only closes when Give kudos is chosen, since it is not built yet', async () => {
    const user = userEvent.setup();
    draw();

    await choose(user, /Give kudos/);

    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
