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
  type PostcardDialogProps,
} from './postcard-dialog';
import type { PostcardAsk } from './postcard-draft.type';
import { DEFAULT_TEXT_STYLE } from './postcard-style.constant';

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

/** The props of a card being written, given or asked: everything but an answer's. */
type WritingDialogProps = Extract<
  PostcardDialogProps,
  { teammates: readonly Teammate[] }
>;

function dialog(props: Partial<WritingDialogProps> = {}) {
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
    render(dialog({ onSend, onOpenChange }));

    await chooseMali(user);
    await user.type(message(), 'Thank you for the demo.');
    await user.click(send());

    expect(onSend).toHaveBeenCalledWith({
      recipientAccountIds: ['mali'],
      message: 'Thank you for the demo.',
      visibility: 'ONLY_ME',
      selectedAccountIds: new Set(),
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
    expect(
      screen.getByRole('button', { name: /^Paper Tone.*Cream/ }),
    ).toHaveFocus();
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
      screen.getByRole('img', {
        name: /A sun rising over rolling green hills/,
      }),
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
  it('offers Templates and Stamps on the front, neither ready yet', async () => {
    const user = userEvent.setup();
    render(dialog());

    await turnToFront(user);

    const tools = screen.getByRole('group', { name: 'Front tools' });
    expect(
      within(tools)
        .getAllByRole('button')
        .map((tool) => [tool.textContent, tool.getAttribute('aria-disabled')]),
    ).toEqual([
      ['Templates', 'true'],
      ['Stamps (0/3)', 'true'],
    ]);
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
      textStyle: DEFAULT_TEXT_STYLE,
    });
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
  });
});
