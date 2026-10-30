import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Teammate } from '@/lib/feedback/teammate.type';
import {
  type PostcardAnsweringProps,
  PostcardDialog,
  type PostcardWritingProps,
} from './postcard-dialog';
import type { PostcardAsk } from './postcard-draft.type';
import { POSTCARD_STAMPS } from './postcard-stamp.constant';
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

const ASK: PostcardAsk = {
  requester: { name: 'Mali Sombat', photoUrl: null },
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
      writer={{ name: 'Ann', photoUrl: null }}
      open
      onOpenChange={vi.fn()}
      onSend={vi.fn()}
      {...props}
    />
  );
}

function answerDialog(onSend: PostcardAnsweringProps['onSend'] = vi.fn()) {
  return (
    <PostcardDialog
      kind="answer"
      title="Answer"
      ask={ASK}
      writer={{ name: 'Ann', photoUrl: null }}
      open
      onOpenChange={vi.fn()}
      onSend={onSend}
    />
  );
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

/** Stamps, on whichever bar is showing, with its count. */
const stampsTool = () => screen.getByRole('button', { name: /^Stamps \(/ });

/** Adds a stamp from the Stamps drawer, opening it first if it is closed. */
async function addStamp(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  if (!screen.queryByRole('dialog', { name: 'Stamps' })) {
    await user.click(stampsTool());
  }
  await user.click(
    within(screen.getByRole('dialog', { name: 'Stamps' })).getByRole('button', {
      name: `Add the ${name} stamp`,
    }),
  );
}

/** A side of the card, looked for past anything that hides it from assistive technology. */
const sideOfCard = (name: 'Front' | 'Back') =>
  screen.getByRole('region', { name: `${name} of the postcard`, hidden: true });

const message = () => screen.getByRole('textbox', { name: 'Your feedback' });
const send = () => screen.getByRole('button', { name: /Seal & Send/ });

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
    const onSend = vi.fn();
    const onOpenChange = vi.fn();
    // The third of four templates.
    vi.spyOn(Math, 'random').mockReturnValue(0.6);
    render(dialog({ onSend, onOpenChange }));

    await chooseMali(user);
    await user.type(message(), 'Thank you for the demo.');
    await user.click(send());

    expect(onSend).toHaveBeenCalledWith({
      recipientAccountIds: ['mali'],
      message: 'Thank you for the demo.',
      visibility: 'ONLY_ME',
      selectedAccountIds: new Set(),
      templateKey: 'system/postcard_template_3',
      stamps: [],
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
    const onSend = vi.fn();
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
    await user.click(send());

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
    expect(stampsTool()).toHaveFocus();
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

  it('offers Templates and Stamps', async () => {
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
      ['Stamps (0/3)', null],
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
    await user.click(screen.getByRole('button', { name: 'Templates' }));
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
    await user.click(screen.getByRole('button', { name: 'Templates' }));
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
    await user.click(templates);
    await user.keyboard('{ArrowRight>}{Escape}{/ArrowRight}');
    await user.click(templates);
    await user.click(screen.getByRole('radio', { name: templateAt(3).alt }));

    expect(
      screen.queryByRole('dialog', { name: 'Templates' }),
    ).not.toBeInTheDocument();
    expect(frontPicture()).toHaveAccessibleName(templateAt(3).alt);
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
    const onSend = vi.fn();
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

    await user.click(send());
    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({ templateKey: POSTCARD_TEMPLATES[0].key }),
    );
  });
});

describe('PostcardDialog, stamps', () => {
  it('offers every stamp', async () => {
    const user = userEvent.setup();
    render(dialog());

    await user.click(stampsTool());

    const drawer = screen.getByRole('dialog', { name: 'Stamps' });
    expect(
      within(drawer)
        .getAllByRole('button', { name: /^Add the/ })
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(POSTCARD_STAMPS.map((stamp) => `Add the ${stamp.alt} stamp`));
  });

  it('puts a stamp on the side showing, selected, and counts it on both sides', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(dialog({ defaultRecipientAccountIds: ['mali'], onSend }));
    await user.type(message(), 'Thank you.');
    await user.keyboard('{Escape}');

    await addStamp(user, 'Ocean');

    const onBack = within(sideOfCard('Back')).getByRole('button', {
      name: 'Ocean stamp',
      hidden: true,
    });
    expect(onBack).toHaveAttribute('aria-pressed', 'true');
    expect(stampsTool()).toHaveTextContent('Stamps (1/3)');

    await turnToFront(user);
    expect(stampsTool()).toHaveTextContent('Stamps (1/3)');
    expect(
      within(sideOfCard('Front')).queryByRole('button', {
        name: 'Ocean stamp',
      }),
    ).toBeNull();

    await addStamp(user, 'Night');
    await user.click(send());

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        stamps: [
          expect.objectContaining({
            stampKey: 'system/stamp-02-ocean',
            side: 'back',
            x: 50,
            y: 50,
            scale: 1,
            rotation: 0,
          }),
          expect.objectContaining({
            stampKey: 'system/stamp-03-night',
            side: 'front',
          }),
        ],
      }),
    );
  });

  it('takes the same stamp more than once, and no more than three', async () => {
    const user = userEvent.setup();
    render(dialog());

    await addStamp(user, 'Balloon');
    await addStamp(user, 'Balloon');
    await addStamp(user, 'Balloon');
    await addStamp(user, 'Mountains');

    expect(
      screen.getAllByRole('button', { name: 'Balloon stamp', hidden: true }),
    ).toHaveLength(3);
    expect(
      screen.queryByRole('button', { name: 'Mountains stamp', hidden: true }),
    ).toBeNull();
    const drawer = screen.getByRole('dialog', { name: 'Stamps' });
    expect(
      within(drawer).getByRole('button', { name: 'Add the Mountains stamp' }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(
      within(drawer).getByText(
        'Three is the most. Take one off to add another.',
      ),
    ).toBeInTheDocument();
    expect(stampsTool()).toHaveTextContent('Stamps (3/3)');
  });

  it('moves, sizes and turns the selected stamp from the keyboard', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(dialog({ defaultRecipientAccountIds: ['mali'], onSend }));
    await user.type(message(), 'Thank you.');
    await user.keyboard('{Escape}');
    await addStamp(user, 'Botanical');

    await user.click(
      screen.getByRole('button', { name: 'Botanical stamp', hidden: true }),
    );
    await user.keyboard('{ArrowRight}{ArrowDown}{Shift>}{ArrowRight}{/Shift}');
    await user.keyboard('++-');
    await user.keyboard(']]][[');
    await user.click(send());

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        stamps: [expect.objectContaining({ x: 62, y: 52, rotation: 30 })],
      }),
    );
    const [{ stamps }] = onSend.mock.calls[0] ?? [{ stamps: [] }];
    expect(stamps[0]?.scale).toBeCloseTo(1.1);
  });

  it('postmarks a stamped card as it is sent, then closes', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(dialog({ defaultRecipientAccountIds: ['mali'], onOpenChange }));
    await user.type(message(), 'Thank you.');
    await user.keyboard('{Escape}');
    await addStamp(user, 'Ocean');

    await user.click(send());

    // Decoration, hidden from screen readers, so it is found by its mark rather than a role.
    expect(document.querySelector('[data-postmark]')).toBeInTheDocument();
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('takes a stamp off with Delete, and gives the cursor to Stamps', async () => {
    const user = userEvent.setup();
    render(dialog());
    await addStamp(user, 'Night');

    await user.click(
      screen.getByRole('button', { name: 'Night stamp', hidden: true }),
    );
    await user.keyboard('{Delete}');

    expect(
      screen.queryByRole('button', { name: 'Night stamp', hidden: true }),
    ).toBeNull();
    expect(stampsTool()).toHaveTextContent('Stamps (0/3)');
    expect(stampsTool()).toHaveFocus();
  });

  it('closes only Stamps on Escape, and gives the cursor back to it', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(dialog({ onOpenChange }));

    await user.click(stampsTool());
    await user.keyboard('{Escape}');

    expect(
      screen.queryByRole('dialog', { name: 'Stamps' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: 'Close without sending?' }),
    ).not.toBeInTheDocument();
    expect(stampsTool()).toHaveFocus();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('closes Stamps once a stamp is added', async () => {
    const user = userEvent.setup();
    render(dialog());

    await addStamp(user, 'Mountains');

    expect(
      screen.queryByRole('dialog', { name: 'Stamps' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Mountains stamp' }),
    ).toBeInTheDocument();
  });

  it('closes Stamps on a press outside it, and the press still reaches the card', async () => {
    const user = userEvent.setup();
    render(dialog());
    await user.click(stampsTool());
    expect(screen.getByRole('dialog', { name: 'Stamps' })).toBeInTheDocument();

    await user.click(message());

    expect(
      screen.queryByRole('dialog', { name: 'Stamps' }),
    ).not.toBeInTheDocument();
    expect(message()).toHaveFocus();
  });

  it('closes an open Stamps when a stamp is pressed, and selects it', async () => {
    const user = userEvent.setup();
    render(dialog());
    await addStamp(user, 'Ocean');
    await addStamp(user, 'Night');
    await user.click(stampsTool());

    await user.click(
      screen.getByRole('button', { name: 'Ocean stamp', hidden: true }),
    );

    expect(
      screen.queryByRole('dialog', { name: 'Stamps' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ocean stamp' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Night stamp' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('lets go of the selected stamp on a press anywhere else', async () => {
    const user = userEvent.setup();
    render(dialog());
    await addStamp(user, 'Balloon');
    const stamp = screen.getByRole('button', { name: 'Balloon stamp' });
    expect(stamp).toHaveAttribute('aria-pressed', 'true');

    await user.click(message());

    expect(stamp).toHaveAttribute('aria-pressed', 'false');
  });

  it('lets go of the selected stamp when the card is turned over', async () => {
    const user = userEvent.setup();
    render(dialog());
    await addStamp(user, 'Balloon');

    await turnToFront(user);

    expect(
      screen.getByRole('button', { name: 'Balloon stamp', hidden: true }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('takes a stamp off with its ×, and gives the cursor to Stamps', async () => {
    const user = userEvent.setup();
    render(dialog());
    await addStamp(user, 'Mountains');

    await user.click(
      screen.getByRole('button', { name: 'Remove the Mountains stamp' }),
    );

    expect(
      screen.queryByRole('button', { name: 'Mountains stamp', hidden: true }),
    ).toBeNull();
    expect(stampsTool()).toHaveTextContent('Stamps (0/3)');
    expect(stampsTool()).toHaveFocus();
  });

  it('never lands a new stamp on one already there, even after one comes off', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(dialog({ defaultRecipientAccountIds: ['mali'], onSend }));
    await user.type(message(), 'Thank you.');
    await user.keyboard('{Escape}');
    await addStamp(user, 'Mountains');
    await addStamp(user, 'Ocean');
    await user.click(screen.getByRole('button', { name: 'Mountains stamp' }));
    await user.click(
      screen.getByRole('button', { name: 'Remove the Mountains stamp' }),
    );

    await addStamp(user, 'Night');
    await user.click(send());

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        stamps: [
          expect.objectContaining({ stampKey: 'system/stamp-02-ocean', x: 56 }),
          expect.objectContaining({ stampKey: 'system/stamp-03-night', x: 62 }),
        ],
      }),
    );
  });

  it('hands over a turn as the one it shows, however far it was turned', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(dialog({ defaultRecipientAccountIds: ['mali'], onSend }));
    await user.type(message(), 'Thank you.');
    await user.keyboard('{Escape}');
    await addStamp(user, 'Night');

    await user.click(screen.getByRole('button', { name: 'Night stamp' }));
    // Thirteen quarter-steps of 15 degrees: 195, which is -165.
    await user.keyboard(']]]]]]]]]]]]]');
    await user.click(send());

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        stamps: [expect.objectContaining({ rotation: -165 })],
      }),
    );
  });

  it('says which stamp it is when its picture will not load, and can still be sent', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(dialog({ defaultRecipientAccountIds: ['mali'], onSend }));
    await user.type(message(), 'Thank you.');
    await user.keyboard('{Escape}');
    await addStamp(user, 'Ocean');

    const stamp = screen.getByRole('button', {
      name: 'Ocean stamp',
      hidden: true,
    });
    const picture = stamp.querySelector('img');
    if (!picture) {
      throw new Error('The stamp has no picture.');
    }
    fireEvent.error(picture);

    expect(stamp.querySelector('img')).toBeNull();
    expect(within(stamp).getByText('Ocean')).toBeInTheDocument();

    await user.click(send());
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
      within(tools).getByRole('button', { name: /^Stamps/ }),
    ).toBeInTheDocument();
    expect(
      within(tools).getByRole('button', { name: /^Paper Tone/ }),
    ).toBeInTheDocument();
    expect(
      within(tools).getByRole('button', {
        name: /^Who else can read it.*Only me/,
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
    const onSend = vi.fn();
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
    await user.click(screen.getByRole('button', { name: /Send request/ }));

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientAccountIds: ['mali'],
        message: 'How did the demo land?',
        visibility: 'ONLY_ME',
      }),
    );
  });
});

describe('PostcardDialog, answering an Ask', () => {
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

  it("offers only stamps: the paper and who reads it are the Requester's", async () => {
    const user = userEvent.setup();
    render(answerDialog());

    // It opens with the cursor in the answer, so the text tools are up until Escape.
    await user.keyboard('{Escape}');

    const tools = screen.getByRole('group', { name: 'Postcard tools' });
    expect(
      within(tools)
        .getAllByRole('button')
        .map((tool) => tool.textContent),
    ).toEqual(['Stamps (0/3)']);
  });

  it('leaves Done on Stamps, the only tool, rather than losing the cursor', async () => {
    const user = userEvent.setup();
    render(answerDialog());

    await user.click(screen.getByRole('textbox', { name: 'Your answer' }));
    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(screen.getByRole('button', { name: /^Stamps/ })).toHaveFocus();
  });

  it('hands over the answer and how it looks', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(answerDialog(onSend));

    expect(screen.getByRole('button', { name: /Send answer/ })).toBeDisabled();

    await user.type(
      screen.getByRole('textbox', { name: 'Your answer' }),
      'Clear and calm.',
    );
    await user.click(screen.getByRole('button', { name: /Send answer/ }));

    expect(onSend).toHaveBeenCalledWith({
      message: 'Clear and calm.',
      stamps: [],
      textStyle: DEFAULT_TEXT_STYLE,
    });
  });

  it('takes stamps on the back only, and hands them over with the answer', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(answerDialog(onSend));
    await user.type(
      screen.getByRole('textbox', { name: 'Your answer' }),
      'Clear and calm.',
    );
    await user.keyboard('{Escape}');

    await addStamp(user, 'Mountains');
    await user.click(screen.getByRole('button', { name: /Send answer/ }));

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        stamps: [
          expect.objectContaining({
            stampKey: 'system/stamp-01-mountains',
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
      screen.queryByRole('button', { name: /^Stamps/ }),
    ).not.toBeInTheDocument();
  });

  it('shows the first picture on the front, whoever opens it', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    render(answerDialog());

    await turnToFront(user);

    expect(
      within(
        screen.getByRole('region', { name: 'Front of the postcard' }),
      ).getByRole('img'),
    ).toHaveAccessibleName(POSTCARD_TEMPLATES[0].alt);
  });
});
