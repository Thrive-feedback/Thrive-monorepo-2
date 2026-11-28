import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FeedbackStyleProvider } from '@/components/organisms/feedback-style-provider';
import type { Teammate } from '@/lib/feedback/teammate.type';
import type { FeedbackStyle } from '@/lib/feedback-style/feedback-style.constant';
import {
  type PostcardAnsweringProps,
  PostcardDialog,
  type PostcardWritingProps,
} from './postcard-dialog';
import type { PostcardAsk } from './postcard-draft.type';
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
  templateKey: 'system/postcard_template_3',
  stickers: [],
  stampKey: null,
  message: 'How did the demo land for you?',
  tone: 'sage',
  textStyle: DEFAULT_TEXT_STYLE,
};

/** The browser's Cookie Store, which jsdom does not have: what the choice is kept in. */
const cookieStore = { set: vi.fn() };

beforeEach(() => {
  cookieStore.set.mockReset().mockResolvedValue(undefined);
  vi.stubGlobal('cookieStore', cookieStore);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function writing(
  props: Partial<
    PostcardWritingProps & {
      title: string;
      onOpenChange: (open: boolean) => void;
    }
  > = {},
  style: FeedbackStyle = 'plain',
) {
  return (
    <FeedbackStyleProvider initialStyle={style}>
      <PostcardDialog
        title="Give feedback"
        teammates={TEAMMATES}
        workspaceGoals={['Ownership']}
        writer={{ name: 'Ann', photoUrl: null }}
        open
        onOpenChange={vi.fn()}
        onSend={vi.fn().mockResolvedValue(true)}
        {...props}
      />
    </FeedbackStyleProvider>
  );
}

function answering(
  onSend: PostcardAnsweringProps['onSend'],
  style: FeedbackStyle = 'plain',
) {
  return (
    <FeedbackStyleProvider initialStyle={style}>
      <PostcardDialog
        kind="answer"
        title="Answer"
        teammates={TEAMMATES}
        workspaceGoals={[]}
        ask={ASK}
        writer={{ name: 'Ann', photoUrl: null }}
        open
        onOpenChange={vi.fn()}
        onSend={onSend}
      />
    </FeedbackStyleProvider>
  );
}

const message = (name = 'Your feedback') =>
  screen.getByRole('textbox', { name });
const plainSwitch = () => screen.getByRole('switch', { name: 'Plain style' });
const visibilityTool = () =>
  screen.getByRole('button', { name: /^Who else can read it/ });

/** On a postcard, Send and who can read it are away while the text tools are up. */
async function leaveTextTools(user: ReturnType<typeof userEvent.setup>) {
  const done = screen.queryByRole('button', { name: 'Done' });
  if (done) {
    await user.click(done);
  }
}

async function chooseMali(
  user: ReturnType<typeof userEvent.setup>,
  choose = "Choose who it's for",
) {
  await user.click(
    screen.getByRole('button', { name: new RegExp(`^${choose}`) }),
  );
  await user.click(screen.getByRole('checkbox', { name: /Mali Sombat/ }));
  await user.click(screen.getByRole('button', { name: /^Done/ }));
}

describe('PostcardDialog in the plain style', () => {
  it('opens as a sheet with no card to turn, the cursor on "To", and says what Send waits for', () => {
    render(writing());

    expect(
      screen.getByRole('dialog', { name: 'Give feedback' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: /of the postcard/, hidden: true }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: /^Choose who it's for/ }),
    ).toHaveFocus();
    expect(
      screen.getByRole('button', { name: /^Send feedback/ }),
    ).toBeDisabled();
    expect(screen.getByText("pick who it's for first")).toBeInTheDocument();
  });

  it('hands over what a new postcard carries — a picture at random and no stamp — then closes', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    const onOpenChange = vi.fn();
    vi.spyOn(Math, 'random').mockReturnValue(2.5 / POSTCARD_TEMPLATES.length);
    render(writing({ onSend, onOpenChange }));

    await chooseMali(user);
    await user.type(message(), 'Thank you for the demo.');
    await user.click(screen.getByRole('button', { name: /^Send feedback/ }));

    expect(onSend).toHaveBeenCalledWith({
      recipientAccountIds: ['mali'],
      message: 'Thank you for the demo.',
      visibility: 'EVERYONE',
      selectedAccountIds: new Set(),
      templateKey: 'system/postcard_template_3',
      stickers: [],
      stampKey: null,
      tone: 'cream',
      textStyle: DEFAULT_TEXT_STYLE,
    });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('sends a request to the people asked', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(writing({ kind: 'ask', title: 'Ask for feedback', onSend }));

    await chooseMali(user, 'Choose who to ask');
    await user.type(message('Your request'), 'How did the demo land?');
    await user.click(screen.getByRole('button', { name: /^Send request/ }));

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientAccountIds: ['mali'],
        message: 'How did the demo land?',
      }),
    );
  });

  it('answers under the request, read as it was written', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(answering(onSend));

    const request = screen.getByRole('region', { name: 'Their request' });
    expect(
      within(request).getByText('How did the demo land for you?'),
    ).toBeInTheDocument();
    expect(within(request).getByText('Mali Sombat asked')).toBeInTheDocument();

    await user.type(message('Your answer'), 'It landed well.');
    await user.click(screen.getByRole('button', { name: /^Send answer/ }));

    expect(onSend).toHaveBeenCalledWith({
      message: 'It landed well.',
      stickers: [],
      textStyle: DEFAULT_TEXT_STYLE,
    });
  });

  it('keeps everything written when it did not go, and can be sent again', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(false);
    const onOpenChange = vi.fn();
    render(
      writing({ defaultRecipientAccountIds: ['mali'], onSend, onOpenChange }),
    );

    await user.type(message(), 'Thank you.');
    await user.click(screen.getByRole('button', { name: /^Send feedback/ }));

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /^Send feedback/ }),
      ).toBeEnabled(),
    );
    expect(message()).toHaveValue('Thank you.');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('moves Only them to Selected people when someone else is mentioned', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(writing({ defaultRecipientAccountIds: ['mali'], onSend }));
    await user.click(
      screen.getByRole('button', { name: /^Who else can read it/ }),
    );
    await user.click(screen.getByRole('radio', { name: /Only them/ }));
    await user.keyboard('{Escape}');

    await user.type(message(), 'with @krit ');
    await user.click(screen.getByRole('button', { name: /^Send feedback/ }));

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        visibility: 'SELECTED_PEOPLE',
        selectedAccountIds: new Set(['krit']),
      }),
    );
  });

  it('asks before closing what has been written, and Keep writing stays', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(writing({ onOpenChange }));

    await user.type(message(), 'Half a thought');
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

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(message()).toHaveValue('Half a thought');
  });

  it('keeps the message and who it is for when switched from the postcard to plain, and remembers the choice', async () => {
    const user = userEvent.setup();
    render(writing({ defaultRecipientAccountIds: ['mali'] }, 'postcard'));
    expect(
      screen.getByRole('region', { name: 'Back of the postcard' }),
    ).toBeInTheDocument();

    await user.type(message(), 'Thank you for the demo.');
    await user.click(screen.getByRole('switch', { name: 'Plain style' }));

    expect(
      screen.queryByRole('region', { name: /of the postcard/, hidden: true }),
    ).toBeNull();
    expect(message()).toHaveValue('Thank you for the demo.');
    expect(
      screen.getByRole('button', { name: /Chosen: Mali Sombat/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Plain style' })).toBeChecked();
    expect(cookieStore.set).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: 'plain' }),
    );
  });

  it('keeps the title where it is and the cursor on the switch, whichever way it is switched', async () => {
    const user = userEvent.setup();
    render(writing({ defaultRecipientAccountIds: ['mali'] }, 'postcard'));
    const plainSwitch = () =>
      screen.getByRole('switch', { name: 'Plain style' });

    await user.click(plainSwitch());

    expect(
      screen.getByRole('dialog', { name: 'Give feedback' }),
    ).toBeInTheDocument();
    await waitFor(() => expect(plainSwitch()).toHaveFocus());

    await user.click(plainSwitch());

    expect(
      screen.getByRole('region', { name: 'Back of the postcard' }),
    ).toBeInTheDocument();
    await waitFor(() => expect(plainSwitch()).toHaveFocus());
  });

  it('gives focus back to what opened it when closed after a switch', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    function Opener() {
      const [open, setOpen] = useState(false);
      return (
        <FeedbackStyleProvider initialStyle="postcard">
          <button type="button" onClick={() => setOpen(true)}>
            Write
          </button>
          <PostcardDialog
            title="Give feedback"
            teammates={TEAMMATES}
            workspaceGoals={[]}
            writer={{ name: 'Ann', photoUrl: null }}
            open={open}
            onOpenChange={(next) => {
              onOpenChange(next);
              setOpen(next);
            }}
            onSend={vi.fn().mockResolvedValue(true)}
          />
        </FeedbackStyleProvider>
      );
    }
    render(<Opener />);

    await user.click(screen.getByRole('button', { name: 'Write' }));
    await user.click(screen.getByRole('switch', { name: 'Plain style' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await user.click(
      within(
        screen.getByRole('dialog', { name: 'Close without sending?' }),
      ).getByRole('button', { name: 'Close' }),
    );

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Write' })).toHaveFocus(),
    );
  });

  it('keeps an answer when switched from plain back to the postcard', async () => {
    const user = userEvent.setup();
    render(answering(vi.fn().mockResolvedValue(true)));

    await user.type(message('Your answer'), 'It landed well.');
    await user.click(screen.getByRole('switch', { name: 'Plain style' }));

    expect(
      screen.getByRole('region', { name: 'Back of the postcard' }),
    ).toBeInTheDocument();
    expect(message('Your answer')).toHaveValue('It landed well.');
  });

  it('keeps Only them across a switch from the postcard to plain, and sends it so', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(
      writing({ defaultRecipientAccountIds: ['mali'], onSend }, 'postcard'),
    );
    await user.keyboard('{Escape}');
    await user.click(visibilityTool());
    await user.click(screen.getByRole('radio', { name: /Only them/ }));
    await user.keyboard('{Escape}');

    await user.click(plainSwitch());
    expect(visibilityTool()).toHaveTextContent('Only them');
    await user.type(message(), 'Thank you.');
    await user.click(screen.getByRole('button', { name: /^Send feedback/ }));

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({ visibility: 'ONLY_ME' }),
    );
  });

  it('keeps Selected people and who was picked across a switch from plain to the postcard', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(
      writing({ kind: 'ask', defaultRecipientAccountIds: ['mali'], onSend }),
    );
    await user.click(visibilityTool());
    await user.click(screen.getByRole('radio', { name: /Selected people/ }));
    await user.click(screen.getByRole('checkbox', { name: /Krit Chan/ }));
    await user.click(screen.getByRole('button', { name: /^Done/ }));
    await user.keyboard('{Escape}');

    await user.click(plainSwitch());
    await user.type(message('Your request'), 'How was it?');
    await leaveTextTools(user);
    await user.click(screen.getByRole('button', { name: /^Send request/ }));

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        visibility: 'SELECTED_PEOPLE',
        selectedAccountIds: new Set(['krit']),
      }),
    );
  });

  it('still says what will be lost after a switch, for the people the writer chose', async () => {
    const user = userEvent.setup();
    render(writing({}, 'postcard'));
    await chooseMali(user);

    await user.click(plainSwitch());
    await user.click(screen.getByRole('button', { name: 'Close' }));

    const confirm = screen.getByRole('dialog', {
      name: 'Close without sending?',
    });
    expect(
      within(confirm).getByText(
        'What you wrote, and who it was for, will be lost.',
      ),
    ).toBeInTheDocument();
  });

  it('never hands focus out of the dialog, nor tells the caller it closed, while switching', async () => {
    const user = userEvent.setup();
    const onCloseAutoFocus = vi.fn();
    const outside: Element[] = [];
    render(
      <FeedbackStyleProvider initialStyle="postcard">
        <button type="button">Write</button>
        <PostcardDialog
          title="Give feedback"
          teammates={TEAMMATES}
          workspaceGoals={[]}
          writer={{ name: 'Ann', photoUrl: null }}
          open
          onOpenChange={vi.fn()}
          onCloseAutoFocus={onCloseAutoFocus}
          onSend={vi.fn().mockResolvedValue(true)}
        />
      </FeedbackStyleProvider>,
    );
    const noteOutside = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof Element && !target.closest('[role="dialog"]')) {
        outside.push(target);
      }
    };
    document.addEventListener('focusin', noteOutside);

    await user.click(plainSwitch());
    await waitFor(() => expect(plainSwitch()).toHaveFocus());
    await user.click(plainSwitch());
    await waitFor(() => expect(plainSwitch()).toHaveFocus());
    // Past the timer Radix gives back focus on, so a stray close would have run.
    await new Promise((resolve) => setTimeout(resolve, 50));
    document.removeEventListener('focusin', noteOutside);

    expect(onCloseAutoFocus).not.toHaveBeenCalled();
    expect(outside).toEqual([]);
  });

  it('drops the stamp and stickers a postcard had when switched to plain, and sends none', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    render(
      writing({ defaultRecipientAccountIds: ['mali'], onSend }, 'postcard'),
    );
    await user.type(message(), 'Thank you.');
    await leaveTextTools(user);
    await user.click(screen.getByRole('button', { name: 'Stamp' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Stamp' })).getByRole(
        'button',
        { name: 'Use the Sailboat stamp' },
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Stamp' })).toBeNull(),
    );
    await user.click(screen.getByRole('button', { name: /^Stickers \(/ }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Stickers' })).getByRole(
        'button',
        { name: 'Add the Love sticker' },
      ),
    );
    // Adding a sticker puts the drawer away by itself.
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Stickers' })).toBeNull(),
    );
    // Both are on the card before the switch, so what follows proves they are dropped.
    expect(
      screen.getByRole('button', { name: 'Sailboat stamp', hidden: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Love sticker', hidden: true }),
    ).toBeInTheDocument();

    await user.click(plainSwitch());
    await user.click(screen.getByRole('button', { name: /^Send feedback/ }));

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Thank you.',
        stampKey: null,
        stickers: [],
      }),
    );
  });

  it('keeps the people asked across a switch', async () => {
    const user = userEvent.setup();
    render(writing({ kind: 'ask', title: 'Ask for feedback' }, 'postcard'));
    await chooseMali(user, 'Choose who to ask');

    await user.click(plainSwitch());

    expect(
      screen.getByRole('button', { name: /Chosen: Mali Sombat/ }),
    ).toBeInTheDocument();
  });

  it('keeps an answer when switched from the postcard to plain', async () => {
    const user = userEvent.setup();
    render(answering(vi.fn().mockResolvedValue(true), 'postcard'));

    await user.type(message('Your answer'), 'It landed well.');
    await leaveTextTools(user);
    await user.click(plainSwitch());

    expect(message('Your answer')).toHaveValue('It landed well.');
  });
});
