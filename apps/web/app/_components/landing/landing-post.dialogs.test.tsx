import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/*
 * The real dialogs, as the landing page opens them. Their code is held back until a test lets it
 * through, so what a visitor does while it is still on its way can be tried; the page's modules are
 * loaded afresh for every test, since each keeps a dialog once it has arrived.
 */
const DIALOG_MODULES = [
  '@/components/organisms/postcard-dialog/postcard-dialog',
  '@/components/organisms/kudos-dialog/kudos-dialog',
  '@/components/organisms/postcard-dialog/postcard-read-dialog',
];

/** Lets the dialogs' code through; until then, every fetch of it waits. */
let release: () => void = () => {};

beforeEach(() => {
  vi.resetModules();
  const ready = new Promise<void>((done) => {
    release = done;
  });
  for (const path of DIALOG_MODULES) {
    vi.doMock(path, async (importOriginal) => {
      await ready;
      return importOriginal();
    });
  }
});

async function renderDesk() {
  const { LandingPost } = await import('./landing-post');
  const { LandingDesk } = await import('./landing-desk');
  render(
    <LandingPost>
      <LandingDesk />
    </LandingPost>,
  );
}

/** The desk with the board it pins to, and the page's toasts. */
async function renderDeskAndBoard() {
  const { Toaster } = await import('@/components/atoms/toaster');
  const { LandingPost } = await import('./landing-post');
  const { LandingDesk } = await import('./landing-desk');
  const { LandingBoardCards } = await import('./landing-board-cards');
  render(
    <>
      <LandingPost>
        <LandingDesk />
        <LandingBoardCards />
      </LandingPost>
      <Toaster />
    </>,
  );
}

/** Writes a Kudos thanking Ploy and sends it. */
async function sendAKudos(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Say thanks' }));
  await user.type(
    await screen.findByRole(
      'textbox',
      { name: 'Your Kudos' },
      { timeout: 5000 },
    ),
    'Thank you for the calm release, @ploy',
  );
  const done = screen.queryByRole('button', { name: 'Done' });
  if (done) {
    await user.click(done);
  }
  await user.click(screen.getByRole('button', { name: /^Send kudos/ }));
}

async function renderMoments() {
  const { LandingMoments } = await import('./landing-moments');
  render(<LandingMoments />);
}

/** A moment for the page to act on what it has: a timer, a promise, a render. */
function aMoment() {
  return new Promise((done) => setTimeout(done, 50));
}

/**
 * Lets the dialogs' code through and waits until it has arrived and the page has acted on it, so a
 * dialog that has not opened by then never will.
 */
async function releaseAndSettle() {
  release();
  await Promise.all([
    import('@/components/organisms/postcard-dialog/postcard-dialog'),
    import('@/components/organisms/kudos-dialog/kudos-dialog'),
    import('@/components/organisms/postcard-dialog/postcard-read-dialog'),
  ]);
  await aMoment();
}

/** Escape until the card has closed: the first may only leave the text tools it opened in. */
async function escapeUntilClosed(user: ReturnType<typeof userEvent.setup>) {
  for (
    let presses = 0;
    presses < 3 && screen.queryByRole('dialog');
    presses++
  ) {
    await user.keyboard('{Escape}');
  }
}

describe('The landing page’s dialogs', () => {
  it('closes the Kudos card on Close without asking, and gives focus back to its card', async () => {
    release();
    const user = userEvent.setup();
    await renderDesk();

    await user.click(screen.getByRole('button', { name: 'Say thanks' }));
    const dialog = await screen.findByRole('dialog', {}, { timeout: 5000 });
    await user.click(
      screen
        .getAllByRole('button', { name: 'Close' })
        .find((button) => dialog.contains(button)) ?? dialog,
    );

    expect(screen.queryByText('Close without sending?')).toBeNull();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('button', { name: 'Say thanks' })).toHaveFocus();
  });

  it('closes a postcard on Escape without asking', async () => {
    release();
    const user = userEvent.setup();
    await renderDesk();

    await user.click(
      screen.getByRole('button', { name: 'Give feedback unasked' }),
    );
    await screen.findByRole(
      'dialog',
      { name: /Give feedback/ },
      { timeout: 5000 },
    );
    await escapeUntilClosed(user);

    expect(screen.queryByText('Close without sending?')).toBeNull();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('never opens a card turned away from while its dialog is on its way', async () => {
    const user = userEvent.setup();
    await renderDesk();

    await user.click(
      screen.getByRole('button', { name: 'Give feedback unasked' }),
    );
    // The card has turned to the front and asked for its dialog, which is still on its way.
    await aMoment();
    await user.click(
      screen.getByRole('button', {
        name: 'Bring the card on the left to the front',
      }),
    );
    await releaseAndSettle();

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens only the card pressed last when two are pressed before the dialogs arrive', async () => {
    const user = userEvent.setup();
    await renderDesk();

    await user.click(screen.getByRole('button', { name: 'Say thanks' }));
    await user.click(screen.getByRole('button', { name: 'Ask how it went' }));
    await releaseAndSettle();

    expect(
      await screen.findByRole(
        'dialog',
        { name: /Ask for feedback/ },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('opens the given Moment to read, titled for who wrote it, and gives focus back on close', async () => {
    release();
    const user = userEvent.setup();
    await renderMoments();
    const card = screen.getByRole('button', {
      name: 'Read the card: After rehearsing the final presentation',
    });

    await user.click(card);
    await screen.findByRole(
      'dialog',
      { name: /Feedback from Fern Somsak/ },
      { timeout: 5000 },
    );
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(card).toHaveFocus();
  });

  it('opens one reading dialog when both Moments are pressed before it arrives', async () => {
    const user = userEvent.setup();
    await renderMoments();

    await user.click(
      screen.getByRole('button', {
        name: 'Read the card: Right after sprint planning',
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: 'Read the card: After rehearsing the final presentation',
      }),
    );
    await releaseAndSettle();

    expect(
      await screen.findByRole(
        'dialog',
        { name: /Feedback from Fern Somsak/ },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('says a postcard was sent, and that nothing left the page, and closes it', async () => {
    release();
    const user = userEvent.setup();
    await renderDeskAndBoard();

    await user.click(
      screen.getByRole('button', { name: 'Give feedback unasked' }),
    );
    await screen.findByRole(
      'dialog',
      { name: /Give feedback/ },
      { timeout: 5000 },
    );
    await user.click(
      screen.getByRole('button', { name: /^Choose who it's for/ }),
    );
    await user.click(screen.getByRole('checkbox', { name: /Ploy Srisuk/ }));
    await user.click(screen.getByRole('button', { name: /^Done/ }));
    await user.type(
      screen.getByRole('textbox', { name: 'Your feedback' }),
      'Thank you for the demo.',
    );
    const done = screen.queryByRole('button', { name: 'Done' });
    if (done) {
      await user.click(done);
    }
    await user.click(screen.getByRole('button', { name: /^Send feedback/ }));

    expect(
      await screen.findByText('Sent successfully', {}, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'In your team, it would go to the people you picked. Here, nothing was sent.',
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), {
      timeout: 5000,
    });
  });

  it('pins a sent Kudos first on the board, as the visitor’s own, to whom it mentions', async () => {
    release();
    const user = userEvent.setup();
    await renderDeskAndBoard();

    await sendAKudos(user);
    // Sent, the dialog shows it pinned; going back to the page closes it.
    await user.click(
      await screen.findByRole(
        'button',
        { name: 'Back to home' },
        { timeout: 5000 },
      ),
    );

    await waitFor(
      () => {
        const [first] = screen.getAllByRole('figure');
        if (!first) throw new Error('The board has no cards.');
        expect(
          within(first).getByText('Yours. Only on this page.'),
        ).toBeInTheDocument();
        expect(
          within(first).getByText('From You to Ploy Srisuk'),
        ).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it('takes focus to the pinned Kudos when the visitor goes to the board', async () => {
    release();
    const user = userEvent.setup();
    await renderDeskAndBoard();

    await sendAKudos(user);
    await user.click(
      await screen.findByRole(
        'button',
        { name: /Go to Kudos board/ },
        { timeout: 5000 },
      ),
    );

    await waitFor(
      () => {
        const [first] = screen.getAllByRole('figure');
        expect(first?.closest('li')).toHaveFocus();
      },
      { timeout: 5000 },
    );
  });
});
