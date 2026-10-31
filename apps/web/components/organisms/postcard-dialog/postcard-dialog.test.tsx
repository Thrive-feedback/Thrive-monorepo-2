import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Teammate } from '@/lib/feedback/teammate.type';
import {
  type PostcardAnsweringProps,
  PostcardDialog,
  type PostcardWritingProps,
} from './postcard-dialog';
import type { PostcardAsk } from './postcard-draft.type';
import { POSTCARD_STAMPS } from './postcard-stamp.constant';
import { POSTCARD_STICKERS } from './postcard-sticker.constant';
import { DEFAULT_TEXT_STYLE } from './postcard-style.constant';
import { POSTCARD_TEMPLATES } from './postcard-template.constant';

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

const WORKSPACE_GOALS = ['Ownership'];

const ASK: PostcardAsk = {
  requester: { name: 'Mali Sombat', photoUrl: null },
  templateKey: 'system/postcard_template_3',
  stickers: [],
  stampKey: null,
  message: 'How did the demo land for you?',
  tone: 'sage',
  textStyle: DEFAULT_TEXT_STYLE,
};

function dialog(
  props: Partial<
    PostcardWritingProps & {
      title: string;
      open: boolean;
      onOpenChange: (open: boolean) => void;
    }
  > = {},
) {
  return (
    <PostcardDialog
      title="Give feedback"
      teammates={TEAMMATES}
      workspaceGoals={WORKSPACE_GOALS}
      writer={{ name: 'Ann', photoUrl: null }}
      open
      onOpenChange={vi.fn()}
      onSend={vi.fn().mockResolvedValue(true)}
      {...props}
    />
  );
}

function answerDialog(
  onSend: PostcardAnsweringProps['onSend'] = vi.fn().mockResolvedValue(true),
  ask: PostcardAsk = ASK,
) {
  return (
    <PostcardDialog
      kind="answer"
      title="Answer"
      teammates={TEAMMATES}
      workspaceGoals={WORKSPACE_GOALS}
      ask={ask}
      writer={{ name: 'Ann', photoUrl: null }}
      open
      onOpenChange={vi.fn()}
      onSend={onSend}
    />
  );
}

/** The two halves of a turn already under way, each ending with the end of its animation. */
function endTurn() {
  const card = screen.getByLabelText('Back of the postcard').parentElement;
  if (!card) {
    throw new Error('The postcard has no card around its sides.');
  }
  fireEvent.animationEnd(card);
  fireEvent.animationEnd(card);
}

/** Turns the card to its front: two halves, each ending with the end of its animation. */
async function turnToFront(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole('button', { name: 'Turn over to the front, the picture' }),
  );
  const card = screen.getByRole('region', {
    name: 'Back of the postcard',
  }).parentElement;
  if (!card) {
    throw new Error('The postcard has no card around its sides.');
  }
  fireEvent.animationEnd(card);
  fireEvent.animationEnd(card);
}

/** A template from the catalog by its place, failing the test if there is no such template. */
function templateAt(index: number) {
  const template = POSTCARD_TEMPLATES[index];
  if (!template) {
    throw new Error(`The catalog has no template ${index + 1}.`);
  }
  return template;
}

/** Stickers, on whichever bar is showing, with its count. */
const stickersTool = () => screen.getByRole('button', { name: /^Stickers \(/ });

/** Adds a sticker from the Stickers drawer, opening it first if it is closed. */
async function addSticker(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  if (!screen.queryByRole('dialog', { name: 'Stickers' })) {
    await user.click(stickersTool());
  }
  await user.click(
    within(screen.getByRole('dialog', { name: 'Stickers' })).getByRole(
      'button',
      {
        name: `Add the ${name} sticker`,
      },
    ),
  );
}

/** A side of the card, looked for past anything that hides it from assistive technology. */
const sideOfCard = (name: 'Front' | 'Back') =>
  screen.getByRole('region', { name: `${name} of the postcard`, hidden: true });

const message = () => screen.getByRole('textbox', { name: 'Your feedback' });

/** Puts the cursor at a place in the message, as an arrow key or a click would. */
function putCursorAt(place: number) {
  const field = message();
  if (!(field instanceof HTMLTextAreaElement)) {
    throw new Error('The message is not a textarea.');
  }
  field.setSelectionRange(place, place);
}

function parentOf(element: Element) {
  const parent = element.parentElement;
  if (!parent) {
    throw new Error('The element has no parent.');
  }
  return parent;
}
const send = () => screen.getByRole('button', { name: /^Send feedback/ });

/** Send waits for the text tools to be put away, so Done comes first where they are up. */
async function leaveTextTools(user: ReturnType<typeof userEvent.setup>) {
  const done = screen.queryByRole('button', { name: 'Done' });
  if (done) {
    await user.click(done);
  }
}

async function pressSend(user: ReturnType<typeof userEvent.setup>) {
  await leaveTextTools(user);
  await user.click(send());
}

/** Drawn once the send has been answered, so it is waited for. */
function postmark() {
  return waitFor(() => {
    const mark = document.querySelector('[data-postmark]');
    expect(mark).toBeInTheDocument();
    return mark;
  });
}

/** A send the API has not answered yet: `resolve` is the answer arriving. */
function aSendInFlight() {
  let resolve: (hasGone: boolean) => void = () => {};
  const promise = new Promise<boolean>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}

async function chooseMali(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole('button', { name: /^Choose who it's for/ }),
  );
  await user.click(screen.getByRole('checkbox', { name: /Mali Sombat/ }));
  await user.click(screen.getByRole('button', { name: /^Done/ }));
}

describe('PostcardDialog', () => {
  it('opens on the back, signed by the writer, with the cursor on "To"', () => {
    render(dialog());

    const card = screen.getByRole('dialog', { name: 'Give feedback' });
    expect(within(card).getByText('Ann')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Choose who it's for/ }),
    ).toHaveFocus();
    expect(message()).toBeInTheDocument();
    expect(send()).toBeDisabled();
  });

  it('opens for the people given, with the cursor on the message', () => {
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));

    expect(
      screen.getByRole('button', { name: /Chosen: Mali Sombat/ }),
    ).toBeInTheDocument();
    expect(message()).toHaveFocus();
  });

  it('hands over who it is for, the message and how it looks, then closes', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    const onOpenChange = vi.fn();
    // The third of four templates.
    vi.spyOn(Math, 'random').mockReturnValue(0.6);
    render(dialog({ onSend, onOpenChange }));

    await chooseMali(user);
    await user.type(message(), 'Thank you for the demo.');
    await pressSend(user);

    expect(onSend).toHaveBeenCalledWith({
      recipientAccountIds: ['mali'],
      message: 'Thank you for the demo.',
      visibility: 'EVERYONE',
      selectedAccountIds: new Set(),
      templateKey: 'system/postcard_template_3',
      stickers: [],
      stampKey: null,
      tone: 'cream',
      textStyle: {
        font: 'modern',
        sizeStep: 2,
        align: 'left',
        ink: 'ink',
      },
    });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('stays put with Send busy until it has gone, then closes', async () => {
    const user = userEvent.setup();
    const { promise, resolve } = aSendInFlight();
    const onOpenChange = vi.fn();
    render(
      dialog({
        defaultRecipientAccountIds: ['mali'],
        onSend: () => promise,
        onOpenChange,
      }),
    );

    await user.type(message(), 'Thank you for the demo.');
    await pressSend(user);

    expect(send()).toHaveAttribute('aria-busy', 'true');
    expect(message()).toHaveValue('Thank you for the demo.');
    expect(onOpenChange).not.toHaveBeenCalled();

    resolve(true);

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('does not ask about closing while it waits to hear', async () => {
    const user = userEvent.setup();
    const { promise, resolve } = aSendInFlight();
    render(
      dialog({ defaultRecipientAccountIds: ['mali'], onSend: () => promise }),
    );

    await user.type(message(), 'Thank you for the demo.');
    await pressSend(user);
    await user.keyboard('{Escape}');

    expect(
      screen.queryByRole('heading', { name: 'Close without sending?' }),
    ).toBeNull();

    resolve(false);
    await waitFor(() => expect(send()).toHaveFocus());
  });

  it('keeps everything written when it did not go, with the cursor on Send', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      dialog({
        defaultRecipientAccountIds: ['mali'],
        onSend: async () => false,
        onOpenChange,
      }),
    );

    await user.type(message(), 'Thank you for the demo.');
    await pressSend(user);

    await waitFor(() => expect(send()).toHaveFocus());
    expect(send()).not.toHaveAttribute('aria-busy');
    expect(message()).toHaveValue('Thank you for the demo.');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('can be sent again after a send that did not go', async () => {
    const user = userEvent.setup();
    const onSend = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    const onOpenChange = vi.fn();
    render(
      dialog({
        defaultRecipientAccountIds: ['mali'],
        onSend,
        onOpenChange,
      }),
    );

    await user.type(message(), 'Thank you for the demo.');
    await pressSend(user);
    await waitFor(() => expect(send()).toHaveFocus());
    await pressSend(user);

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(onSend).toHaveBeenCalledTimes(2);
  });

  it('keeps everything written when the send throws, with the cursor on Send', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockRejectedValue(new Error('offline'));
    render(dialog({ defaultRecipientAccountIds: ['mali'], onSend }));
    await user.type(message(), 'Thank you.');

    await pressSend(user);

    await waitFor(() => expect(send()).toHaveFocus());
    expect(message()).toHaveValue('Thank you.');
    expect(document.querySelector('[data-postmark]')).toBeNull();
  });

  it('flies nothing off when the card was closed while it waited to hear', async () => {
    const user = userEvent.setup();
    const answer = aSendInFlight();
    const onOpenChange = vi.fn();
    const props = {
      defaultRecipientAccountIds: ['mali'],
      onSend: () => answer.promise,
      onOpenChange,
    };
    const { rerender } = render(dialog(props));
    await user.type(message(), 'Thank you.');
    await pressSend(user);

    rerender(dialog({ ...props, open: false }));
    await act(async () => answer.resolve(true));

    expect(document.querySelector('[data-postmark]')).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('shows how much is written only while the message has the cursor', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));

    expect(message()).toHaveFocus();
    await user.type(message(), 'Hi');
    expect(screen.getByText('2/1000')).toBeVisible();

    await user.tab();

    expect(screen.getByText('2/1000')).not.toBeVisible();
  });

  it('keeps the count in the page when the message loses the cursor', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));
    await user.type(message(), 'Hi');
    const count = screen.getByText('2/1000');

    await user.tab();

    // Taken out instead, it sets off the dialog's focus trap in a browser, where focus is on
    // nothing for a moment, and the text tools close under the press that was reaching them.
    expect(count).toBeInTheDocument();
  });

  it('counts a Thai cluster as one character', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));

    await user.click(message());
    await user.paste('ที่ที่');

    expect(screen.getByText('2/1000')).toBeInTheDocument();
  });

  it('stops the message at 1,000 characters', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));

    await user.click(message());
    await user.paste('a'.repeat(1005));

    expect(message()).toHaveValue('a'.repeat(1000));
    expect(screen.getByText('1000/1000')).toBeInTheDocument();
  });

  it('stops typing at 1,000 characters, one key at a time', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));

    await user.click(message());
    await user.paste('a'.repeat(999));
    await user.keyboard('bc');

    expect(message()).toHaveValue(`${'a'.repeat(999)}b`);
    expect(screen.getByText('1000/1000')).toBeInTheDocument();
  });

  it('stops Thai at 1,000 characters without splitting one', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));

    await user.click(message());
    await user.paste('ที่'.repeat(1005));

    expect(message()).toHaveValue('ที่'.repeat(1000));
    expect(screen.getByText('1000/1000')).toBeInTheDocument();
  });

  it('loses nothing already written when a key is pressed at the limit, mid-message', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));
    const written = `${'a'.repeat(998)}zz`;
    await user.click(message());
    await user.paste(written);

    putCursorAt(10);
    await user.keyboard('x');

    expect(message()).toHaveValue(written);
    expect(message()).toHaveProperty('selectionStart', 10);
  });

  it('cuts what is pasted mid-message, not the end of what was there', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));
    const written = `${'a'.repeat(996)}zz`;
    await user.click(message());
    await user.paste(written);

    putCursorAt(0);
    await user.paste('xxxxxx');

    expect(message()).toHaveValue(`xx${written}`);
    expect(message()).toHaveProperty('selectionStart', 2);
  });

  it('opens no suggestions for a key refused at the limit, just before a tag', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));
    const written = `@krit ${'b'.repeat(994)}`;
    await user.click(message());
    await user.paste(written);

    putCursorAt(0);
    await user.keyboard('x');

    expect(message()).toHaveValue(written);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('keeps what follows a tag completed at the limit', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));
    const after = ` ${'b'.repeat(995)}`;
    await user.click(message());
    await user.paste(after);

    putCursorAt(0);
    await user.keyboard('@kr');
    await user.keyboard('{Enter}');

    expect(message()).toHaveValue(`@kri${after}`);
  });

  it('stops a request at 1,000 characters too', async () => {
    const user = userEvent.setup();
    render(dialog({ kind: 'ask', title: 'Ask for feedback' }));
    const request = screen.getByRole('textbox', { name: 'Your request' });

    await user.click(request);
    await user.paste('a'.repeat(1005));

    expect(request).toHaveValue('a'.repeat(1000));
  });

  it('stops an answer at 1,000 characters too', async () => {
    const user = userEvent.setup();
    render(answerDialog());
    const answer = screen.getByRole('textbox', { name: 'Your answer' });

    await user.click(answer);
    await user.paste('a'.repeat(1005));

    expect(answer).toHaveValue('a'.repeat(1000));
  });

  it('says the limit to a screen reader, without reading out every keystroke', () => {
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));

    expect(message()).toHaveAccessibleDescription('Up to 1,000 characters.');
  });

  it('keeps Send disabled while the text tools are up, until Done', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));

    await user.type(message(), 'Thank you for the demo.');
    expect(send()).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(send()).toBeEnabled();
  });

  it('keeps Send disabled again when the message is gone back to', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));
    await user.type(message(), 'Thank you for the demo.');
    await user.click(screen.getByRole('button', { name: 'Done' }));

    await user.click(message());

    expect(send()).toBeDisabled();
  });

  it('waits for somebody to send it to and something to say', async () => {
    const user = userEvent.setup();
    render(dialog());

    await user.type(message(), 'Thank you for the demo.');
    expect(send()).toBeDisabled();

    await chooseMali(user);
    expect(send()).toBeEnabled();
  });

  it('prints it on the paper chosen and hands over who else may read it', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(dialog({ defaultRecipientAccountIds: ['mali'], onSend }));

    await user.type(message(), 'Thank you.');
    await user.keyboard('{Escape}');
    await user.click(
      screen.getByRole('button', { name: /^Paper Tone.*Cream/ }),
    );
    await user.click(screen.getByRole('menuitemradio', { name: 'Soft Sage' }));
    await user.click(
      screen.getByRole('button', { name: /^Who else can read it/ }),
    );
    await user.click(
      screen.getByRole('radio', { name: 'Everyone in the Workspace' }),
    );
    await user.keyboard('{Escape}');
    await pressSend(user);

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: 'sage',
        visibility: 'EVERYONE',
        selectedAccountIds: new Set(),
      }),
    );
  });

  it('holds the text tools while the message is written, until Done', async () => {
    const user = userEvent.setup();
    render(dialog());

    await user.click(message());

    const textTools = screen.getByRole('group', { name: 'Text style' });
    expect(
      within(textTools).getByRole('button', { name: /Modern font/ }),
    ).toBeInTheDocument();

    await user.click(within(textTools).getByRole('button', { name: 'Larger' }));
    expect(within(textTools).getByText('23 px')).toBeInTheDocument();

    await user.click(within(textTools).getByRole('button', { name: 'Done' }));

    expect(
      screen.getByRole('group', { name: 'Postcard tools' }),
    ).toBeInTheDocument();
    expect(stickersTool()).toHaveFocus();
  });

  it('asks before closing, and Keep writing puts the cursor back', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(dialog({ onOpenChange }));

    await user.type(message(), 'Half a thought');
    await user.keyboard('{Escape}');
    expect(
      screen.getByRole('group', { name: 'Postcard tools' }),
    ).toBeInTheDocument();

    await user.keyboard('{Escape}');
    const confirm = screen.getByRole('dialog', {
      name: 'Close without sending?',
    });
    expect(
      within(confirm).getByText(
        'What you wrote, and who it was for, will be lost.',
      ),
    ).toBeInTheDocument();

    await user.click(
      within(confirm).getByRole('button', { name: 'Keep writing' }),
    );

    await waitFor(() => expect(message()).toHaveFocus());
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('closes a blank card once Close is confirmed', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(dialog({ onOpenChange }));

    await user.click(screen.getByRole('button', { name: 'Close' }));
    const confirm = screen.getByRole('dialog', {
      name: 'Close without sending?',
    });
    expect(
      within(confirm).getByText('Nothing on this card will be kept.'),
    ).toBeInTheDocument();

    await user.click(within(confirm).getByRole('button', { name: 'Close' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('starts each opening as a blank card', async () => {
    const user = userEvent.setup();
    const { rerender } = render(dialog());

    await user.type(message(), 'Something left behind');
    rerender(dialog({ open: false }));
    rerender(dialog({ open: true }));

    expect(message()).toHaveValue('');
  });

  it('turns over to the picture on the front, and back', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(dialog());

    await user.click(
      screen.getByRole('button', {
        name: 'Turn over to the front, the picture',
      }),
    );
    // The card turns in two halves, each ending with the end of its animation.
    const card = screen.getByRole('region', {
      name: 'Back of the postcard',
    }).parentElement;
    if (!card) {
      throw new Error('The postcard has no card around its sides.');
    }
    fireEvent.animationEnd(card);
    fireEvent.animationEnd(card);

    expect(
      screen.getByRole('img', { name: POSTCARD_TEMPLATES[0].alt }),
    ).toBeVisible();
    expect(
      screen.queryByRole('region', { name: 'Back of the postcard' }),
    ).toBeNull();
    expect(
      screen.getByRole('button', {
        name: 'Turn over to the back, the message',
      }),
    ).toBeInTheDocument();
  });
});

/**
 * Opens Templates and waits for the cursor to reach the picture chosen, as a person's next key
 * would: the drawer moves focus into itself a frame after it opens.
 */
async function openTemplatesForKeys(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Templates' }));
  await waitFor(() =>
    expect(
      within(screen.getByRole('dialog', { name: 'Templates' })).getByRole(
        'radio',
        { checked: true },
      ),
    ).toHaveFocus(),
  );
}

describe('PostcardDialog, the front', () => {
  /**
   * The picture the front shows. While Templates is open the page behind it is hidden from
   * assistive technology, so this looks past that; the drawer's checked radio is what is heard.
   */
  const frontPicture = () =>
    within(
      screen.getByRole('region', {
        name: 'Front of the postcard',
        hidden: true,
      }),
    ).getByRole('img', { hidden: true });

  it('offers Templates and Stickers', async () => {
    const user = userEvent.setup();
    render(dialog());

    await turnToFront(user);

    const tools = screen.getByRole('group', { name: 'Front tools' });
    expect(
      within(tools)
        .getAllByRole('button')
        .map((tool) => [tool.textContent, tool.getAttribute('aria-disabled')]),
    ).toEqual([
      ['Templates', null],
      ['Stickers (0/3)', null],
      ['Who else can read it: Everyone in the Workspace', null],
    ]);
  });

  it('opens on a picture chosen at random', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    render(dialog());

    await turnToFront(user);

    expect(frontPicture()).toHaveAccessibleName(templateAt(3).alt);
  });

  it('puts the picture pressed in Templates on the front, and closes', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(dialog());

    await turnToFront(user);
    await user.click(screen.getByRole('button', { name: 'Templates' }));

    const drawer = screen.getByRole('dialog', { name: 'Templates' });
    const pictures = within(drawer).getAllByRole('radio');
    expect(
      pictures.map((picture) => picture.getAttribute('aria-label')),
    ).toEqual(POSTCARD_TEMPLATES.map((template) => template.alt));
    expect(
      within(drawer).getByRole('radio', { name: POSTCARD_TEMPLATES[0].alt }),
    ).toBeChecked();

    await user.click(
      within(drawer).getByRole('radio', { name: templateAt(2).alt }),
    );

    expect(
      screen.queryByRole('dialog', { name: 'Templates' }),
    ).not.toBeInTheDocument();
    expect(frontPicture()).toHaveAccessibleName(templateAt(2).alt);

    await user.click(screen.getByRole('button', { name: 'Templates' }));
    expect(
      within(screen.getByRole('dialog', { name: 'Templates' })).getByRole(
        'radio',
        { name: templateAt(2).alt },
      ),
    ).toBeChecked();
  });

  it('tries each picture on the front as the arrow keys move, and keeps Templates open', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(dialog());

    await turnToFront(user);
    await openTemplatesForKeys(user);
    // Held, as a person's key is while focus moves: Radix chooses on an arrow only then.
    await user.keyboard('{ArrowRight>}');
    await waitFor(() =>
      expect(frontPicture()).toHaveAccessibleName(templateAt(1).alt),
    );
    await user.keyboard('{/ArrowRight}');
    expect(
      screen.getByRole('dialog', { name: 'Templates' }),
    ).toBeInTheDocument();

    await user.keyboard(' ');

    expect(
      screen.queryByRole('dialog', { name: 'Templates' }),
    ).not.toBeInTheDocument();
    expect(frontPicture()).toHaveAccessibleName(templateAt(1).alt);
  });

  it('keeps a picture reached with End and chosen with Space, and closes', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(dialog());

    await turnToFront(user);
    await openTemplatesForKeys(user);
    await user.keyboard('{End}');
    await waitFor(() =>
      expect(
        screen.getByRole('radio', { name: templateAt(3).alt }),
      ).toHaveFocus(),
    );
    await user.keyboard(' ');

    expect(
      screen.queryByRole('dialog', { name: 'Templates' }),
    ).not.toBeInTheDocument();
    expect(frontPicture()).toHaveAccessibleName(templateAt(3).alt);
  });

  it('closes Templates on a choice made by assistive technology, which presses no key', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(dialog());

    await turnToFront(user);
    await user.click(screen.getByRole('button', { name: 'Templates' }));
    // A screen reader's activation is a click with no pointer and no key behind it.
    fireEvent.click(screen.getByRole('radio', { name: templateAt(2).alt }));

    expect(
      screen.queryByRole('dialog', { name: 'Templates' }),
    ).not.toBeInTheDocument();
    expect(frontPicture()).toHaveAccessibleName(templateAt(2).alt);
  });

  it('still closes Templates on a choice after an arrow was let go with the drawer shut', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(dialog());

    await turnToFront(user);
    const templates = screen.getByRole('button', { name: 'Templates' });
    await openTemplatesForKeys(user);
    await user.keyboard('{ArrowRight>}{Escape}{/ArrowRight}');
    await user.click(templates);
    await user.click(screen.getByRole('radio', { name: templateAt(3).alt }));

    expect(
      screen.queryByRole('dialog', { name: 'Templates' }),
    ).not.toBeInTheDocument();
    expect(frontPicture()).toHaveAccessibleName(templateAt(3).alt);
  });

  it('closes Templates as a mouse press on the card goes down, not when it is let go', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(dialog());

    await turnToFront(user);
    await user.click(screen.getByRole('button', { name: 'Templates' }));
    await user.pointer({ keys: '[MouseLeft>]', target: frontPicture() });

    expect(
      screen.queryByRole('dialog', { name: 'Templates' }),
    ).not.toBeInTheDocument();
    await user.pointer({ keys: '[/MouseLeft]' });
  });

  it('closes Templates on a press outside it, and the press still reaches the card', async () => {
    const user = userEvent.setup();
    render(dialog());

    await turnToFront(user);
    await user.click(screen.getByRole('button', { name: 'Templates' }));
    await user.click(
      screen.getByRole('button', {
        name: 'Turn over to the back, the message',
      }),
    );

    expect(
      screen.queryByRole('dialog', { name: 'Templates' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Turn over to the front, the picture',
      }),
    ).toBeInTheDocument();
  });

  it('closes only Templates on Escape, and gives the cursor back to it', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(dialog({ onOpenChange }));

    await turnToFront(user);
    const templates = screen.getByRole('button', { name: 'Templates' });
    await user.click(templates);
    await user.keyboard('{Escape}');

    expect(
      screen.queryByRole('dialog', { name: 'Templates' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: 'Close without sending?' }),
    ).not.toBeInTheDocument();
    expect(templates).toHaveFocus();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('says what the picture shows when it will not load, and can still be sent', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(dialog({ defaultRecipientAccountIds: ['mali'], onSend }));

    await user.type(message(), 'Thank you.');
    await user.keyboard('{Escape}');
    await turnToFront(user);
    fireEvent.error(frontPicture());

    const front = screen.getByRole('region', { name: 'Front of the postcard' });
    expect(within(front).queryByRole('img')).toBeNull();
    expect(
      within(front).getByText(POSTCARD_TEMPLATES[0].alt),
    ).toBeInTheDocument();

    await pressSend(user);
    endTurn();
    await waitFor(() =>
      expect(onSend).toHaveBeenCalledWith(
        expect.objectContaining({ templateKey: POSTCARD_TEMPLATES[0].key }),
      ),
    );
  });
});

describe('PostcardDialog, as the composer on Home', () => {
  /** The visibility tool, which says the current choice, and the choices it opens. */
  const visibilityTool = () =>
    screen.getByRole('button', { name: /Who else can read it/ });

  it('starts shared with everyone, as the composer does', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));

    await user.keyboard('{Escape}');

    expect(visibilityTool()).toHaveTextContent('Everyone');
  });

  it('offers teammates on @, and writes the one picked', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));

    await user.type(message(), 'thanks @kr');
    expect(
      screen.getByRole('listbox', { name: 'Teammates' }),
    ).toBeInTheDocument();
    await user.keyboard('{Enter}');

    expect(message()).toHaveValue('thanks @krit ');
  });

  it('offers Workspace Goals on #, and writes the one picked', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));

    await user.type(message(), 'that was #own');
    expect(
      screen.getByRole('listbox', { name: 'Workspace Goals' }),
    ).toBeInTheDocument();
    await user.keyboard('{Enter}');

    expect(message()).toHaveValue('that was #Ownership ');
  });

  it('closes the suggestions on Escape and stays in the text tools', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));
    await user.type(message(), 'thanks @kr');

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });

  it('moves Only them to Selected people when someone else is mentioned, and says why', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(dialog({ defaultRecipientAccountIds: ['mali'], onSend }));
    await user.keyboard('{Escape}');
    await user.click(visibilityTool());
    await user.click(screen.getByRole('radio', { name: /Only them/ }));
    await user.keyboard('{Escape}');

    await user.type(message(), 'with @krit ');

    await user.keyboard('{Escape}');
    await user.click(visibilityTool());
    expect(
      screen.getByText(
        /Changed to Selected people because you mentioned Krit Chan/,
      ),
    ).toBeVisible();
    await user.keyboard('{Escape}');

    await pressSend(user);
    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        visibility: 'SELECTED_PEOPLE',
        selectedAccountIds: new Set(['krit']),
      }),
    );
  });

  it('keeps someone mentioned selected, and lets them go with the mention', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));
    await user.type(message(), 'with @krit ');
    await user.keyboard('{Escape}');

    await user.click(visibilityTool());
    await user.click(screen.getByRole('radio', { name: /Selected people/ }));
    await user.click(
      screen.getByRole('button', { name: /^Choose who else can read/ }),
    );

    const krit = screen.getByRole('checkbox', { name: /Krit Chan/ });
    expect(krit).toBeChecked();
    expect(screen.getByText('Mentioned in your message')).toBeVisible();
    await user.click(krit);
    expect(krit).toBeChecked();
    await user.click(screen.getByRole('button', { name: /^Done/ }));
    await user.keyboard('{Escape}');

    await user.clear(message());
    await user.type(message(), 'Thank you.');

    await leaveTextTools(user);
    expect(send()).toBeDisabled();
  });

  it('will not offer Only them while someone else is mentioned, and names them', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));
    await user.type(message(), 'with @krit ');
    await user.keyboard('{Escape}');

    await user.click(visibilityTool());

    expect(screen.getByRole('radio', { name: /Only them/ })).toBeDisabled();
    expect(screen.getByText(/is mentioned, so they can read it/)).toBeVisible();
  });

  it('lets a mention of who it is for stay between them', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));
    await user.type(message(), 'thanks @mali ');
    await user.keyboard('{Escape}');

    await user.click(visibilityTool());

    expect(screen.getByRole('radio', { name: /Only them/ })).toBeEnabled();
  });

  it('lets a request be shared with someone it asks, as the composer does', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(
      dialog({ kind: 'ask', defaultRecipientAccountIds: ['mali'], onSend }),
    );
    await user.keyboard('{Escape}');
    await user.click(visibilityTool());
    await user.click(screen.getByRole('radio', { name: /Selected people/ }));
    await user.click(screen.getByRole('checkbox', { name: /Mali Sombat/ }));
    await user.click(screen.getByRole('button', { name: /^Done/ }));
    await user.keyboard('{Escape}');
    await user.type(
      screen.getByRole('textbox', { name: 'Your request' }),
      'How was it?',
    );

    await leaveTextTools(user);
    await user.click(screen.getByRole('button', { name: /Send request/ }));

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({ selectedAccountIds: new Set(['mali']) }),
    );
  });
});

describe('PostcardDialog, on its front', () => {
  it('says who else can read it, and lets it be changed there', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));
    await user.keyboard('{Escape}');
    await turnToFront(user);

    const tool = screen.getByRole('button', { name: /Who else can read it/ });
    expect(tool).toHaveTextContent('Everyone');

    await user.click(tool);
    await user.click(screen.getByRole('radio', { name: /Only them/ }));

    expect(tool).toHaveTextContent('Only them');
  });

  it('turns over to the back before anything is sent', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(dialog({ defaultRecipientAccountIds: ['mali'], onSend }));
    await user.type(message(), 'Thank you.');
    await user.keyboard('{Escape}');
    await turnToFront(user);

    await user.click(send());

    expect(onSend).not.toHaveBeenCalled();

    endTurn();

    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1));
    expect(message()).toBeVisible();
  });

  it('sends anyway if the turn never finishes, as in a tab in the background', async () => {
    // Only timeouts: a frame asked for under fake timers never comes, and stalls Motion for good.
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout'],
      shouldAdvanceTime: true,
    });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onSend = vi.fn().mockResolvedValue(true);
      render(dialog({ defaultRecipientAccountIds: ['mali'], onSend }));
      await user.type(message(), 'Thank you.');
      await user.keyboard('{Escape}');
      await turnToFront(user);

      await user.click(send());
      expect(onSend).not.toHaveBeenCalled();

      await act(() => vi.advanceTimersByTimeAsync(1000));

      expect(onSend).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('waits for the turn back when Send is pressed as the card lands on its front', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(dialog({ defaultRecipientAccountIds: ['mali'], onSend }));
    await user.type(message(), 'Thank you.');
    await user.keyboard('{Escape}');
    await user.click(
      screen.getByRole('button', {
        name: 'Turn over to the front, the picture',
      }),
    );
    const card = parentOf(sideOfCard('Back'));
    fireEvent.animationEnd(card);

    await user.click(send());
    fireEvent.animationEnd(card);

    expect(onSend).not.toHaveBeenCalled();

    fireEvent.animationEnd(card);
    fireEvent.animationEnd(card);

    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1));
  });

  it('stays on the back with the cursor on Send when a send from the front did not go', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(false);
    render(dialog({ defaultRecipientAccountIds: ['mali'], onSend }));
    await user.type(message(), 'Thank you.');
    await user.keyboard('{Escape}');
    await turnToFront(user);

    await user.click(send());
    endTurn();

    await waitFor(() => expect(send()).toHaveFocus());
    expect(message()).toBeVisible();
    expect(message()).toHaveValue('Thank you.');
  });

  it('says what the turn-over button does when pointed at', async () => {
    const user = userEvent.setup();
    render(dialog());

    await user.hover(
      screen.getByRole('button', {
        name: 'Turn over to the front, the picture',
      }),
    );

    expect(
      await screen.findByRole('tooltip', {
        name: 'Turn over to see the front',
      }),
    ).toBeInTheDocument();
  });
});

describe('PostcardDialog, the stamp', () => {
  const stampTool = () => screen.getByRole('button', { name: 'Stamp' });

  async function chooseStamp(
    user: ReturnType<typeof userEvent.setup>,
    name: string,
  ) {
    await user.click(stampTool());
    await user.click(
      within(screen.getByRole('dialog', { name: 'Stamp' })).getByRole(
        'button',
        { name: `Use the ${name} stamp` },
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Stamp' })).toBeNull(),
    );
  }

  it('offers every stamp, and is offered on the back alone', async () => {
    const user = userEvent.setup();
    render(dialog());

    await user.click(stampTool());

    const drawer = screen.getByRole('dialog', { name: 'Stamp' });
    expect(
      within(drawer)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label'))
        .filter((label) => label?.startsWith('Use the')),
    ).toEqual(POSTCARD_STAMPS.map((stamp) => `Use the ${stamp.alt} stamp`));
    await user.keyboard('{Escape}');

    await user.click(
      screen.getByRole('button', { name: /Turn over to the front/ }),
    );

    expect(screen.queryByRole('button', { name: 'Stamp' })).toBeNull();
  });

  it('holds one stamp: another swaps it', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(dialog({ defaultRecipientAccountIds: ['mali'], onSend }));
    await user.type(message(), 'Thank you.');
    await user.keyboard('{Escape}');

    await chooseStamp(user, 'Ocean');
    await chooseStamp(user, 'Night');

    expect(screen.queryByRole('button', { name: 'Ocean stamp' })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Night stamp' }),
    ).toBeInTheDocument();
    await pressSend(user);
    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        stampKey: 'system/stamp-03-night',
        stickers: [],
      }),
    );
  });

  it('prints the word Stamp in the box, with no icon', () => {
    render(dialog());

    const box = screen.getByRole('button', { name: 'Choose a stamp' });
    expect(box).toHaveTextContent('Stamp');
    expect(box.querySelector('svg')).not.toBeInTheDocument();
  });

  it('opens the stamps from the box printed in the corner', async () => {
    const user = userEvent.setup();
    render(dialog());

    await user.click(screen.getByRole('button', { name: 'Choose a stamp' }));

    expect(
      await screen.findByRole('dialog', { name: 'Stamp' }),
    ).toBeInTheDocument();
  });

  it('opens the stamps from the box while the text tools are up', async () => {
    const user = userEvent.setup();
    render(dialog());
    await user.click(message());

    await user.click(screen.getByRole('button', { name: 'Choose a stamp' }));

    expect(
      await screen.findByRole('dialog', { name: 'Stamp' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Done' })).toBeNull();
  });

  it('gives the cursor to Stamp after choosing from the box, which has gone', async () => {
    const user = userEvent.setup();
    render(dialog());
    await user.click(screen.getByRole('button', { name: 'Choose a stamp' }));

    await user.click(
      within(await screen.findByRole('dialog', { name: 'Stamp' })).getByRole(
        'button',
        { name: `Use the ${POSTCARD_STAMPS[0]?.alt} stamp` },
      ),
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Stamp' })).toBeNull(),
    );
    expect(stampTool()).toHaveFocus();
  });

  it('shuts the stamps when the message takes the cursor, and leaves them shut after Done', async () => {
    const user = userEvent.setup();
    render(dialog());
    await user.click(stampTool());
    await screen.findByRole('dialog', { name: 'Stamp' });

    await user.click(message());
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Stamp' })).toBeNull(),
    );
    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(screen.queryByRole('dialog', { name: 'Stamp' })).toBeNull();
  });

  it('shuts the stamps when the card is turned over', async () => {
    const user = userEvent.setup();
    render(dialog());
    await user.click(stampTool());
    await screen.findByRole('dialog', { name: 'Stamp' });

    await user.click(
      screen.getByRole('button', {
        name: 'Turn over to the front, the picture',
      }),
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Stamp' })).toBeNull(),
    );
  });

  it('prints no box once a stamp is on, and brings it back when it comes off', async () => {
    const user = userEvent.setup();
    render(dialog());

    await chooseStamp(user, 'Ocean');
    expect(screen.queryByRole('button', { name: 'Choose a stamp' })).toBeNull();

    await user.click(
      screen.getByRole('button', { name: 'Remove the Ocean stamp' }),
    );

    expect(
      screen.getByRole('button', { name: 'Choose a stamp' }),
    ).toBeInTheDocument();
  });

  it('marks the stamp on the card in the drawer', async () => {
    const user = userEvent.setup();
    render(dialog());
    await chooseStamp(user, 'Balloon');

    await user.click(stampTool());

    const drawer = screen.getByRole('dialog', { name: 'Stamp' });
    expect(
      within(drawer).getByRole('button', { name: 'Use the Balloon stamp' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(drawer).getByRole('button', { name: 'Use the Night stamp' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('selects a stamp as it is chosen, with a way to take it off and nothing else', async () => {
    const user = userEvent.setup();
    render(dialog());

    await chooseStamp(user, 'Ocean');

    expect(screen.getByRole('button', { name: 'Ocean stamp' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('button', { name: 'Remove the Ocean stamp' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Turn the/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Resize/ })).toBeNull();
  });

  it('takes the stamp off with Delete, and gives the cursor to Stamp', async () => {
    const user = userEvent.setup();
    render(dialog());
    await chooseStamp(user, 'Night');
    screen.getByRole('button', { name: 'Night stamp' }).focus();

    await user.keyboard('{Delete}');

    expect(screen.queryByRole('button', { name: 'Night stamp' })).toBeNull();
    expect(stampTool()).toHaveFocus();
  });

  it('takes the stamp off with its ×', async () => {
    const user = userEvent.setup();
    render(dialog());
    await chooseStamp(user, 'Mountains');

    await user.click(
      screen.getByRole('button', { name: 'Remove the Mountains stamp' }),
    );

    expect(
      screen.queryByRole('button', { name: 'Mountains stamp' }),
    ).toBeNull();
  });

  it('counts as something written, so closing warns about losing it', async () => {
    const user = userEvent.setup();
    render(dialog());
    await chooseStamp(user, 'Ocean');

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.getByRole('button', { name: 'Discard' })).toBeInTheDocument();
  });
});

describe('PostcardDialog, stickers', () => {
  it('offers every sticker', async () => {
    const user = userEvent.setup();
    render(dialog());

    await user.click(stickersTool());

    const drawer = screen.getByRole('dialog', { name: 'Stickers' });
    expect(
      within(drawer)
        .getAllByRole('button', { name: /^Add the/ })
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(
      POSTCARD_STICKERS.map((sticker) => `Add the ${sticker.alt} sticker`),
    );
  });

  it('puts a sticker on the side showing, selected, and counts it on both sides', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(dialog({ defaultRecipientAccountIds: ['mali'], onSend }));
    await user.type(message(), 'Thank you.');
    await user.keyboard('{Escape}');

    await addSticker(user, 'Love');

    const onBack = within(sideOfCard('Back')).getByRole('button', {
      name: 'Love sticker',
      hidden: true,
    });
    expect(onBack).toHaveAttribute('aria-pressed', 'true');
    expect(stickersTool()).toHaveTextContent('Stickers (1/3)');

    await turnToFront(user);
    expect(stickersTool()).toHaveTextContent('Stickers (1/3)');
    expect(
      within(sideOfCard('Front')).queryByRole('button', {
        name: 'Love sticker',
      }),
    ).toBeNull();

    await addSticker(user, 'Star');
    await pressSend(user);
    endTurn();

    await waitFor(() =>
      expect(onSend).toHaveBeenCalledWith(
        expect.objectContaining({
          stickers: [
            expect.objectContaining({
              stickerKey: 'system/sticker-03-love',
              side: 'back',
              x: 50,
              y: 50,
              scale: 1,
              rotation: 0,
            }),
            expect.objectContaining({
              stickerKey: 'system/sticker-09-star',
              side: 'front',
            }),
          ],
        }),
      ),
    );
  });

  it('takes the same sticker more than once, and no more than three', async () => {
    const user = userEvent.setup();
    render(dialog());

    await addSticker(user, 'Party');
    await addSticker(user, 'Party');
    await addSticker(user, 'Party');
    await addSticker(user, 'Rocket');

    expect(
      screen.getAllByRole('button', { name: 'Party sticker', hidden: true }),
    ).toHaveLength(3);
    expect(
      screen.queryByRole('button', { name: 'Rocket sticker', hidden: true }),
    ).toBeNull();
    const drawer = screen.getByRole('dialog', { name: 'Stickers' });
    expect(
      within(drawer).getByRole('button', { name: 'Add the Rocket sticker' }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(
      within(drawer).getByText(
        'Three is the most. Take one off to add another.',
      ),
    ).toBeInTheDocument();
    expect(stickersTool()).toHaveTextContent('Stickers (3/3)');
  });

  it('moves, sizes and turns the selected sticker from the keyboard', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(dialog({ defaultRecipientAccountIds: ['mali'], onSend }));
    await user.type(message(), 'Thank you.');
    await user.keyboard('{Escape}');
    await addSticker(user, 'Flower');

    await user.click(
      screen.getByRole('button', { name: 'Flower sticker', hidden: true }),
    );
    await user.keyboard('{ArrowRight}{ArrowDown}{Shift>}{ArrowRight}{/Shift}');
    await user.keyboard('++-');
    await user.keyboard(']]][[');
    await pressSend(user);

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        stickers: [expect.objectContaining({ x: 62, y: 52, rotation: 30 })],
      }),
    );
    const [{ stickers }] = onSend.mock.calls[0] ?? [{ stickers: [] }];
    expect(stickers[0]?.scale).toBeCloseTo(1.1);
  });

  describe('dragged', () => {
    /** Where the sticker lands: the middle of a side 400 by 200 at the top left of the screen. */
    const CENTRE = { x: 200, y: 100 };

    /** jsdom lays nothing out, so every side is given that size and each element its parent. */
    function layOutTheSides() {
      vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockImplementation(
        function offsetParent(this: HTMLElement) {
          return this.parentElement;
        },
      );
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
        new DOMRect(0, 0, 400, 200),
      );
    }

    afterEach(() => {
      vi.restoreAllMocks();
    });

    type At = { x: number; y: number };

    /** jsdom has no pointer event that carries a position; a mouse event of that name does. */
    const pointer = (type: string, target: Element, at?: At) =>
      fireEvent(
        target,
        new MouseEvent(type, {
          bubbles: true,
          clientX: at?.x,
          clientY: at?.y,
        }),
      );
    const press = (target: Element, at: At) =>
      pointer('pointerdown', target, at);
    const moveTo = (target: Element, at: At) =>
      pointer('pointermove', target, at);
    const letGo = (target: Element) => pointer('pointerup', target);

    function drag(target: Element, from: At, to: At) {
      press(target, from);
      moveTo(target, to);
      letGo(target);
    }

    const flower = () =>
      screen.getByRole('button', { name: 'Flower sticker', hidden: true });
    const handle = (name: string) =>
      screen.getByRole('button', { name, hidden: true });

    /** A card ready to send, with a Flower on it, and what sends it. */
    async function aCardWithAFlower() {
      const user = userEvent.setup();
      const onSend = vi.fn().mockResolvedValue(true);
      render(dialog({ defaultRecipientAccountIds: ['mali'], onSend }));
      await user.type(message(), 'Thank you.');
      await user.keyboard('{Escape}');
      await addSticker(user, 'Flower');
      layOutTheSides();
      return {
        async sticker() {
          await pressSend(user);
          const [{ stickers }] = onSend.mock.calls[0] ?? [{ stickers: [] }];
          return stickers[0];
        },
      };
    }

    it('moves from where it was grabbed, so it does not jump to the pointer', async () => {
      const card = await aCardWithAFlower();

      drag(flower(), { x: CENTRE.x + 10, y: CENTRE.y + 5 }, { x: 310, y: 55 });

      expect(await card.sticker()).toMatchObject({ x: 75, y: 25 });
    });

    it('moves from where the last drag left it', async () => {
      const card = await aCardWithAFlower();

      drag(flower(), CENTRE, { x: 300, y: 150 });
      drag(flower(), { x: 300, y: 150 }, { x: 100, y: 50 });

      expect(await card.sticker()).toMatchObject({ x: 25, y: 25 });
    });

    it('stays on the card, however far it is dragged', async () => {
      const card = await aCardWithAFlower();

      drag(flower(), CENTRE, { x: 1000, y: -500 });

      expect(await card.sticker()).toMatchObject({ x: 100, y: 0 });
    });

    it('follows the pointer as it is dragged', async () => {
      await aCardWithAFlower();
      const place = parentOf(flower());

      press(flower(), CENTRE);
      moveTo(flower(), { x: 300, y: 150 });

      expect(place).toHaveStyle({ left: '75%', top: '75%' });
    });

    it('keeps where a drag got to when the browser cuts it short', async () => {
      const card = await aCardWithAFlower();

      press(flower(), CENTRE);
      moveTo(flower(), { x: 300, y: 150 });
      pointer('pointercancel', flower());

      expect(await card.sticker()).toMatchObject({ x: 75, y: 75 });
    });

    it('keeps what a drag did when a second finger lets go of the sticker', async () => {
      const card = await aCardWithAFlower();
      const resize = handle('Resize the sticker');

      press(resize, { x: CENTRE.x + 40, y: CENTRE.y });
      moveTo(resize, { x: CENTRE.x + 60, y: CENTRE.y });
      pointer('pointerdown', document.body, { x: 0, y: 0 });

      expect((await card.sticker()).scale).toBeCloseTo(1.5);
    });

    it('stays where it is when it is only pressed', async () => {
      const card = await aCardWithAFlower();

      press(flower(), CENTRE);
      letGo(flower());

      expect(await card.sticker()).toMatchObject({ x: 50, y: 50, scale: 1 });
    });

    it('grows and shrinks with how far its corner is from the centre', async () => {
      const card = await aCardWithAFlower();

      drag(
        handle('Resize the sticker'),
        { x: CENTRE.x + 40, y: CENTRE.y },
        { x: CENTRE.x + 60, y: CENTRE.y },
      );

      expect((await card.sticker()).scale).toBeCloseTo(1.5);
    });

    it('grows no further than its largest size', async () => {
      const card = await aCardWithAFlower();

      drag(
        handle('Resize the sticker'),
        { x: CENTRE.x + 40, y: CENTRE.y },
        { x: CENTRE.x + 4000, y: CENTRE.y },
      );

      expect((await card.sticker()).scale).toBe(2.5);
    });

    it('shrinks no further than its smallest size', async () => {
      const card = await aCardWithAFlower();

      drag(
        handle('Resize the sticker'),
        { x: CENTRE.x + 40, y: CENTRE.y },
        { x: CENTRE.x + 1, y: CENTRE.y },
      );

      expect((await card.sticker()).scale).toBe(0.5);
    });

    it('turns to follow its handle, which starts below it', async () => {
      const card = await aCardWithAFlower();

      drag(
        handle('Turn the sticker'),
        { x: CENTRE.x, y: CENTRE.y + 40 },
        { x: CENTRE.x + 60, y: CENTRE.y },
      );

      expect((await card.sticker()).rotation).toBe(-90);
    });

    it('hands over the turn it shows when dragged past a half turn', async () => {
      const card = await aCardWithAFlower();

      drag(
        handle('Turn the sticker'),
        { x: CENTRE.x, y: CENTRE.y + 40 },
        { x: CENTRE.x + 60, y: CENTRE.y - 60 },
      );

      expect((await card.sticker()).rotation).toBe(-135);
    });
  });

  it('postmarks a card with a sticker in its top-right corner, not on the sticker, then closes', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(dialog({ defaultRecipientAccountIds: ['mali'], onOpenChange }));
    await user.type(message(), 'Thank you.');
    await user.keyboard('{Escape}');
    await addSticker(user, 'Love');

    await pressSend(user);

    // Decoration, hidden from screen readers, so it is found by its mark rather than a role.
    expect(await postmark()).toHaveStyle({ left: '90%', top: '15%' });
    // The whole flight, which jsdom plays in real time.
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false), {
      timeout: 5000,
    });
  });

  it('postmarks a card with nothing on it in the same corner', async () => {
    const user = userEvent.setup();
    render(dialog({ defaultRecipientAccountIds: ['mali'] }));
    await user.type(message(), 'Thank you.');

    await pressSend(user);

    expect(await postmark()).toHaveStyle({ left: '90%', top: '15%' });
  });

  it('takes a sticker off with Delete, and gives the cursor to Stickers', async () => {
    const user = userEvent.setup();
    render(dialog());
    await addSticker(user, 'Star');

    await user.click(
      screen.getByRole('button', { name: 'Star sticker', hidden: true }),
    );
    await user.keyboard('{Delete}');

    expect(
      screen.queryByRole('button', { name: 'Star sticker', hidden: true }),
    ).toBeNull();
    expect(stickersTool()).toHaveTextContent('Stickers (0/3)');
    expect(stickersTool()).toHaveFocus();
  });

  it('closes only Stickers on Escape, and gives the cursor back to it', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(dialog({ onOpenChange }));

    await user.click(stickersTool());
    await user.keyboard('{Escape}');

    expect(
      screen.queryByRole('dialog', { name: 'Stickers' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: 'Close without sending?' }),
    ).not.toBeInTheDocument();
    expect(stickersTool()).toHaveFocus();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('closes Stickers once a sticker is added', async () => {
    const user = userEvent.setup();
    render(dialog());

    await addSticker(user, 'Rocket');

    expect(
      screen.queryByRole('dialog', { name: 'Stickers' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Rocket sticker' }),
    ).toBeInTheDocument();
  });

  it('closes Stickers on a press outside it, and the press still reaches the card', async () => {
    const user = userEvent.setup();
    render(dialog());
    await user.click(stickersTool());
    expect(
      screen.getByRole('dialog', { name: 'Stickers' }),
    ).toBeInTheDocument();

    await user.click(message());

    expect(
      screen.queryByRole('dialog', { name: 'Stickers' }),
    ).not.toBeInTheDocument();
    expect(message()).toHaveFocus();
  });

  it('closes an open Stickers when a sticker is pressed, and selects it', async () => {
    const user = userEvent.setup();
    render(dialog());
    await addSticker(user, 'Love');
    await addSticker(user, 'Star');
    await user.click(stickersTool());

    await user.click(
      screen.getByRole('button', { name: 'Love sticker', hidden: true }),
    );

    expect(
      screen.queryByRole('dialog', { name: 'Stickers' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Love sticker' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Star sticker' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('lets go of the selected sticker on a press anywhere else', async () => {
    const user = userEvent.setup();
    render(dialog());
    await addSticker(user, 'Party');
    const sticker = screen.getByRole('button', { name: 'Party sticker' });
    expect(sticker).toHaveAttribute('aria-pressed', 'true');

    await user.click(message());

    expect(sticker).toHaveAttribute('aria-pressed', 'false');
  });

  it('lets go of the selected sticker when the card is turned over', async () => {
    const user = userEvent.setup();
    render(dialog());
    await addSticker(user, 'Party');

    await turnToFront(user);

    expect(
      screen.getByRole('button', { name: 'Party sticker', hidden: true }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('takes a sticker off with its ×, and gives the cursor to Stickers', async () => {
    const user = userEvent.setup();
    render(dialog());
    await addSticker(user, 'Rocket');

    await user.click(
      screen.getByRole('button', { name: 'Remove the Rocket sticker' }),
    );

    expect(
      screen.queryByRole('button', { name: 'Rocket sticker', hidden: true }),
    ).toBeNull();
    expect(stickersTool()).toHaveTextContent('Stickers (0/3)');
    expect(stickersTool()).toHaveFocus();
  });

  it('never lands a new sticker on one already there, even after one comes off', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(dialog({ defaultRecipientAccountIds: ['mali'], onSend }));
    await user.type(message(), 'Thank you.');
    await user.keyboard('{Escape}');
    await addSticker(user, 'Rocket');
    await addSticker(user, 'Love');
    await user.click(screen.getByRole('button', { name: 'Rocket sticker' }));
    await user.click(
      screen.getByRole('button', { name: 'Remove the Rocket sticker' }),
    );

    await addSticker(user, 'Star');
    await pressSend(user);

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        stickers: [
          expect.objectContaining({
            stickerKey: 'system/sticker-03-love',
            x: 56,
          }),
          expect.objectContaining({
            stickerKey: 'system/sticker-09-star',
            x: 62,
          }),
        ],
      }),
    );
  });

  it('hands over a turn as the one it shows, however far it was turned', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(dialog({ defaultRecipientAccountIds: ['mali'], onSend }));
    await user.type(message(), 'Thank you.');
    await user.keyboard('{Escape}');
    await addSticker(user, 'Star');

    await user.click(screen.getByRole('button', { name: 'Star sticker' }));
    // Thirteen quarter-steps of 15 degrees: 195, which is -165.
    await user.keyboard(']]]]]]]]]]]]]');
    await pressSend(user);

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        stickers: [expect.objectContaining({ rotation: -165 })],
      }),
    );
  });

  it('says which sticker it is when its picture will not load, and can still be sent', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(dialog({ defaultRecipientAccountIds: ['mali'], onSend }));
    await user.type(message(), 'Thank you.');
    await user.keyboard('{Escape}');
    await addSticker(user, 'Love');

    const sticker = screen.getByRole('button', {
      name: 'Love sticker',
      hidden: true,
    });
    const picture = sticker.querySelector('img');
    if (!picture) {
      throw new Error('The sticker has no picture.');
    }
    fireEvent.error(picture);

    expect(sticker.querySelector('img')).toBeNull();
    expect(within(sticker).getByText('Love')).toBeInTheDocument();

    await pressSend(user);
    expect(onSend).toHaveBeenCalled();
  });
});

describe('PostcardDialog, asking for feedback', () => {
  it('halves the back: the request on the left, the right left for the answers', () => {
    render(dialog({ kind: 'ask', title: 'Ask for feedback' }));

    expect(
      screen.getByRole('button', { name: /^Choose who to ask/ }),
    ).toHaveFocus();
    expect(
      screen.getByRole('textbox', { name: 'Your request' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Send request/ })).toBeDisabled();
  });

  it('offers the same tools as giving, and every font', async () => {
    const user = userEvent.setup();
    render(dialog({ kind: 'ask', title: 'Ask for feedback' }));

    const tools = screen.getByRole('group', { name: 'Postcard tools' });
    expect(
      within(tools).getByRole('button', { name: /^Stickers/ }),
    ).toBeInTheDocument();
    expect(
      within(tools).getByRole('button', { name: /^Paper Tone/ }),
    ).toBeInTheDocument();
    expect(
      within(tools).getByRole('button', {
        name: /^Who else can read it.*Everyone/,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('textbox', { name: 'Your request' }));
    await user.click(screen.getByRole('button', { name: /Modern font/ }));

    expect(
      screen.getAllByRole('menuitemradio').map((font) => font.textContent),
    ).toEqual([
      'ModernClean and friendly',
      'ClassicLike a letter',
      'SignatureHandwritten',
    ]);
  });

  it('hands over who is asked and the request', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(
      dialog({
        kind: 'ask',
        title: 'Ask for feedback',
        defaultRecipientAccountIds: ['mali'],
        onSend,
      }),
    );

    await user.type(
      screen.getByRole('textbox', { name: 'Your request' }),
      'How did the demo land?',
    );
    await leaveTextTools(user);
    await user.click(screen.getByRole('button', { name: /Send request/ }));

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientAccountIds: ['mali'],
        message: 'How did the demo land?',
        visibility: 'EVERYONE',
      }),
    );
  });
});

describe('PostcardDialog, answering an Ask', () => {
  const STICKERED: PostcardAsk = {
    ...ASK,
    stampKey: 'system/stamp-02-ocean',
    stickers: [
      {
        stickerKey: 'system/sticker-03-love',
        side: 'back',
        x: 30,
        y: 78,
        scale: 1,
        rotation: -10,
      },
      {
        stickerKey: 'system/sticker-09-star',
        side: 'front',
        x: 20,
        y: 25,
        scale: 1.2,
        rotation: 12,
      },
    ],
  };

  it("shows the Requester's stamp and stickers, which can only be looked at", () => {
    render(answerDialog(vi.fn().mockResolvedValue(true), STICKERED));

    expect(
      screen.getByRole('img', { name: 'Ocean stamp' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Love sticker' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /stamp/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Love sticker/ })).toBeNull();
  });

  it('prints no box for a stamp when the Requester put none on', () => {
    render(answerDialog());

    expect(
      screen.queryByRole('button', { name: 'Choose a stamp' }),
    ).not.toBeInTheDocument();
  });

  it("has the Requester's picture and sticker on its front", () => {
    render(answerDialog(vi.fn().mockResolvedValue(true), STICKERED));

    // The front is turned away as a card opens, so what is on it is hidden until it turns.
    expect(
      screen.getByRole('img', { name: 'Postcard picture 3', hidden: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Star sticker', hidden: true }),
    ).toBeInTheDocument();
  });

  it("hands over only the answer's own stickers", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(answerDialog(onSend, STICKERED));
    await user.type(
      screen.getByRole('textbox', { name: 'Your answer' }),
      'It landed well.',
    );
    await user.keyboard('{Escape}');
    await addSticker(user, 'Rocket');

    await leaveTextTools(user);
    await user.click(screen.getByRole('button', { name: /Send answer/ }));

    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1));
    expect(onSend.mock.calls[0]?.[0].stickers).toEqual([
      expect.objectContaining({ stickerKey: 'system/sticker-07-rocket' }),
    ]);
  });

  it('shows the Ask read-only on the left and the answer to write on the right', () => {
    render(answerDialog());

    expect(screen.getByText('Mali Sombat')).toBeInTheDocument();
    expect(
      screen.getByText('How did the demo land for you?'),
    ).toBeInTheDocument();
    expect(screen.getByText('Ann')).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.getByRole('textbox', { name: 'Your answer' })).toHaveFocus();
  });

  it("offers only stickers: the paper and who reads it are the Requester's", async () => {
    const user = userEvent.setup();
    render(answerDialog());

    // It opens with the cursor in the answer, so the text tools are up until Escape.
    await user.keyboard('{Escape}');

    const tools = screen.getByRole('group', { name: 'Postcard tools' });
    expect(
      within(tools)
        .getAllByRole('button')
        .map((tool) => tool.textContent),
    ).toEqual(['Stickers (0/3)']);
  });

  it('leaves Done on Stickers, the only tool, rather than losing the cursor', async () => {
    const user = userEvent.setup();
    render(answerDialog());

    await user.click(screen.getByRole('textbox', { name: 'Your answer' }));
    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(screen.getByRole('button', { name: /^Stickers/ })).toHaveFocus();
  });

  it('hands over the answer and how it looks', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(answerDialog(onSend));

    expect(screen.getByRole('button', { name: /Send answer/ })).toBeDisabled();

    await user.type(
      screen.getByRole('textbox', { name: 'Your answer' }),
      'Clear and calm.',
    );
    await leaveTextTools(user);
    await user.click(screen.getByRole('button', { name: /Send answer/ }));

    expect(onSend).toHaveBeenCalledWith({
      message: 'Clear and calm.',
      stickers: [],
      textStyle: DEFAULT_TEXT_STYLE,
    });
  });

  it('takes stickers on the back only, and hands them over with the answer', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(answerDialog(onSend));
    await user.type(
      screen.getByRole('textbox', { name: 'Your answer' }),
      'Clear and calm.',
    );
    await user.keyboard('{Escape}');

    await addSticker(user, 'Rocket');
    await leaveTextTools(user);
    await user.click(screen.getByRole('button', { name: /Send answer/ }));

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        stickers: [
          expect.objectContaining({
            stickerKey: 'system/sticker-07-rocket',
            side: 'back',
          }),
        ],
      }),
    );
  });

  it("says the front is the Requester's and cannot be changed", async () => {
    const user = userEvent.setup();
    render(answerDialog());

    await turnToFront(user);

    expect(
      screen.getByText(
        "The front is Mali Sombat's picture. You can look, not change it.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Templates' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Stickers/ }),
    ).not.toBeInTheDocument();
  });
});
