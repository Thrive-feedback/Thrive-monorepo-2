import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POSTCARD_STICKERS } from '@/components/organisms/postcard-dialog/postcard-sticker.constant';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { KudosDialog, type KudosDialogProps } from './kudos-dialog';
import {
  KUDOS_TEMPLATE_KEYS,
  KUDOS_TEMPLATES,
} from './kudos-template.constant';

const TEAMMATES: readonly Teammate[] = [
  {
    accountId: 'mali',
    name: 'Mali Sombat',
    email: 'mali@acme.test',
    photoUrl: null,
    slug: 'mali',
    displayName: 'Mali',
  },
  {
    accountId: 'krit',
    name: 'Krit Chan',
    email: 'krit@acme.test',
    photoUrl: null,
    slug: 'krit',
    displayName: 'Krit',
  },
];

function dialog(props: Partial<KudosDialogProps> = {}) {
  return (
    <KudosDialog
      teammates={TEAMMATES}
      workspaceGoals={['Ownership']}
      open
      onOpenChange={vi.fn()}
      onSend={vi.fn().mockResolvedValue(true)}
      onGoToBoard={vi.fn()}
      onBackToHome={vi.fn()}
      {...props}
    />
  );
}

function message() {
  return screen.getByRole('textbox', { name: 'Your Kudos' });
}

function sendButton() {
  return screen.getByRole('button', { name: /^Send kudos/ });
}

/** Writes on the card and leaves the text tools, so Send is there to press. */
async function write(user: ReturnType<typeof userEvent.setup>, words: string) {
  await user.type(message(), words);
  await user.click(screen.getByRole('button', { name: 'Done' }));
}

async function addSticker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^Stickers/ }));
  const [sticker] = POSTCARD_STICKERS;
  await user.click(
    await screen.findByRole('button', {
      name: `Add the ${sticker?.alt} sticker`,
    }),
  );
}

describe('KudosDialog', () => {
  // Each card opens on a template chosen at random; these open on the first, so they are the same
  // every run.
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens on a template chosen at random, set as that template sets it', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const onSend = vi.fn().mockResolvedValue(true);
    render(dialog({ onSend }));

    expect(screen.getByRole('radio', { name: 'Sky Note' })).toBeChecked();

    await write(user, '@mali thank you.');
    await user.click(sendButton());
    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        templateKey: 'sky-note',
        textStyle: expect.objectContaining({ font: 'signature', ink: 'navy' }),
      }),
    );
  });

  it('can open on every template', () => {
    const opened = KUDOS_TEMPLATE_KEYS.map((key, place) => {
      vi.spyOn(Math, 'random').mockReturnValue(
        place / KUDOS_TEMPLATE_KEYS.length,
      );
      const { unmount } = render(dialog());
      const name = KUDOS_TEMPLATES[key].label;
      const isChosen = screen.getByRole<HTMLInputElement>('radio', {
        name,
      }).checked;
      unmount();
      return isChosen;
    });

    expect(opened).toEqual(KUDOS_TEMPLATE_KEYS.map(() => true));
  });

  it('opens on a blank card with the cursor in the words', () => {
    render(dialog());

    expect(
      screen.getByRole('dialog', { name: 'Give kudos' }),
    ).toBeInTheDocument();
    expect(message()).toHaveFocus();
    expect(message()).toHaveValue('');
  });

  it('has no other side, no stamp, nobody to choose and nobody to share it with', async () => {
    const user = userEvent.setup();
    render(dialog());

    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(screen.queryByRole('button', { name: /Turn over/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Stamp/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Choose who/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /read/i })).toBeNull();
  });

  it('offers every template as a small card, the first one chosen', () => {
    render(dialog());

    const templates = within(
      screen.getByRole('radiogroup', { name: 'Card template' }),
    ).getAllByRole('radio');

    expect(templates.map((radio) => radio.getAttribute('aria-label'))).toEqual(
      KUDOS_TEMPLATE_KEYS.map((key) => KUDOS_TEMPLATES[key].label),
    );
    expect(screen.getByRole('radio', { name: 'Cobalt Dash' })).toBeChecked();
  });

  it('keeps the text tools up while a template is chosen', async () => {
    const user = userEvent.setup();
    render(dialog());

    await user.click(screen.getByRole('radio', { name: 'Mint Breeze' }));

    expect(screen.getByRole('radio', { name: 'Mint Breeze' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });

  it('cannot be sent with nothing written', async () => {
    const user = userEvent.setup();
    render(dialog());

    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(sendButton()).toBeDisabled();
  });

  it('can be sent naming nobody, and says it is for the whole Workspace', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(dialog({ onSend }));

    await write(user, 'Great launch, everyone.');

    expect(
      screen.getByText(/^For everyone in your Workspace\./),
    ).toBeInTheDocument();
    await user.click(sendButton());
    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Great launch, everyone.' }),
    );
  });

  it('says who it is for as soon as the words name a teammate', async () => {
    const user = userEvent.setup();
    render(dialog());

    await user.type(message(), 'Thank you, @mali');

    expect(screen.getByText(/^For Mali Sombat\./)).toBeInTheDocument();
  });

  it('names everyone the words mention, and says the whole Workspace reads it', async () => {
    const user = userEvent.setup();
    render(dialog());

    await user.type(message(), '@mali and @krit, thank you.');

    expect(
      screen.getByText(
        'For Mali Sombat and Krit Chan. Everyone in your Workspace reads a Kudos.',
      ),
    ).toBeInTheDocument();
  });

  it('says it is for everyone when a name is nobody in the Workspace', async () => {
    const user = userEvent.setup();
    render(dialog());

    await user.type(message(), '@stranger thank you.');

    expect(
      screen.getByText(/^For everyone in your Workspace\./),
    ).toBeInTheDocument();
  });

  it('stops at 280 characters, and says how far along it is', () => {
    render(dialog());

    fireEvent.change(message(), { target: { value: 'a'.repeat(300) } });

    expect(message()).toHaveValue('a'.repeat(280));
    expect(screen.getByText('280/280')).toBeInTheDocument();
  });

  it('hands over the words and how the card looks', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(dialog({ onSend }));

    await write(user, '@mali thank you.');
    await user.click(sendButton());

    expect(onSend).toHaveBeenCalledWith({
      message: '@mali thank you.',
      templateKey: 'cobalt-dash',
      textStyle: {
        font: 'signature',
        ink: 'paper',
        sizeStep: 4,
        align: 'center',
      },
      stickers: [],
    });
  });

  it('takes its font and ink from the template, and keeps the size and alignment chosen', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(dialog({ onSend }));

    await user.type(message(), '@mali thank you.');
    await user.click(screen.getByRole('button', { name: 'Smaller' }));
    await user.click(screen.getByRole('button', { name: 'Align left' }));
    await user.click(screen.getByRole('radio', { name: 'Sky Note' }));
    await user.click(screen.getByRole('button', { name: 'Done' }));
    await user.click(sendButton());

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        templateKey: 'sky-note',
        textStyle: {
          font: 'signature',
          ink: 'navy',
          sizeStep: 3,
          align: 'left',
        },
      }),
    );
  });

  it('sets Peach Pop in the classic font', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(dialog({ onSend }));

    await user.type(message(), '@mali thank you.');
    await user.click(screen.getByRole('radio', { name: 'Peach Pop' }));
    await user.click(screen.getByRole('button', { name: 'Done' }));
    await user.click(sendButton());

    expect(onSend.mock.calls[0]?.[0].textStyle.font).toBe('classic');
  });

  it('offers only the ink that can be read on the dark template', async () => {
    const user = userEvent.setup();
    render(dialog());

    await user.click(screen.getByRole('button', { name: /Paper\s+ink/ }));

    expect(
      screen.getAllByRole('menuitemradio').map((ink) => ink.textContent),
    ).toEqual(['Paper']);
  });

  it('offers the postcard inks on the light templates', async () => {
    const user = userEvent.setup();
    render(dialog());
    await user.click(screen.getByRole('radio', { name: 'Red Squiggle' }));

    await user.click(screen.getByRole('button', { name: /Ink\s+ink/ }));

    expect(
      screen.getAllByRole('menuitemradio').map((ink) => ink.textContent),
    ).toEqual(['Ink', 'Navy', 'Forest', 'Plum', 'Brick']);
  });

  it('hides the stickers to read what is under them, and still sends them', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(dialog({ onSend }));
    await write(user, '@mali thank you.');
    expect(
      screen.getByRole('button', { name: 'Hide stickers' }),
    ).toBeDisabled();

    await addSticker(user);
    expect(screen.getByRole('button', { name: /^Stickers/ })).toHaveTextContent(
      '(1/3)',
    );
    await user.click(screen.getByRole('button', { name: 'Hide stickers' }));
    expect(document.querySelector('[data-sticker]')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Show stickers' }));
    expect(document.querySelector('[data-sticker]')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Hide stickers' }));
    await user.click(sendButton());

    expect(onSend.mock.calls[0]?.[0].stickers).toHaveLength(1);
  });

  it('stays on the board once the card is pinned, with the cursor on the way back', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(dialog({ onOpenChange }));

    await write(user, '@mali thank you.');
    await user.click(sendButton());

    const back = await screen.findByRole('button', { name: 'Back to home' });
    await waitFor(() => expect(back).toHaveFocus());
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('offers the Kudos board first, and goes there when pressed', async () => {
    const user = userEvent.setup();
    const onGoToBoard = vi.fn();
    render(dialog({ onGoToBoard }));

    await write(user, '@mali thank you.');
    await user.click(sendButton());
    await user.click(
      await screen.findByRole('button', { name: 'Go to Kudos board' }),
    );

    expect(onGoToBoard).toHaveBeenCalledOnce();
  });

  it('opens holding what was typed before, as much of it as a Kudos can', async () => {
    render(dialog({ defaultMessage: 'a'.repeat(300) }));

    expect(await screen.findByRole('textbox')).toHaveValue('a'.repeat(280));
  });

  it('hands going back to Home to the caller, which may be leaving the page too', async () => {
    const user = userEvent.setup();
    const onBackToHome = vi.fn();
    render(dialog({ onBackToHome }));
    await write(user, '@mali thank you.');
    await user.click(sendButton());

    await user.click(
      await screen.findByRole('button', { name: 'Back to home' }),
    );

    expect(onBackToHome).toHaveBeenCalledOnce();
  });

  it('goes back to Home on Escape, with nothing to ask once the card has gone', async () => {
    const user = userEvent.setup();
    const onBackToHome = vi.fn();
    render(dialog({ onBackToHome }));
    await write(user, '@mali thank you.');
    await user.click(sendButton());
    await screen.findByRole('button', { name: 'Back to home' });

    await user.keyboard('{Escape}');

    expect(onBackToHome).toHaveBeenCalledOnce();
    expect(screen.queryByText('Close without sending?')).toBeNull();
  });

  it('stays open with everything on it when it has not gone', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(dialog({ onOpenChange, onSend: vi.fn().mockResolvedValue(false) }));

    await write(user, '@mali thank you.');
    await user.click(sendButton());

    await waitFor(() => expect(sendButton()).toHaveFocus());
    expect(message()).toHaveValue('@mali thank you.');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('asks before closing, and keeps the words if asked to', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(dialog({ onOpenChange }));
    await write(user, 'Thank you.');

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(
      screen.getByText('What you wrote will be lost.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Keep writing' }));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(message()).toHaveValue('Thank you.');
  });

  it('closes when the writer discards it', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(dialog({ onOpenChange }));
    await write(user, 'Thank you.');

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('starts blank every time it opens', async () => {
    const user = userEvent.setup();
    const { rerender } = render(dialog());
    await user.type(message(), 'Thank you.');

    rerender(dialog({ open: false }));
    rerender(dialog());

    expect(
      await screen.findByRole('textbox', { name: 'Your Kudos' }),
    ).toHaveValue('');
  });
});
