import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import type {
  AnsweredPostcard,
  GivenPostcard,
  PostcardReadAnswer,
  ReadPostcard,
} from './postcard-read.type';
import { PostcardReadDialog } from './postcard-read-dialog';
import { DEFAULT_TEXT_STYLE } from './postcard-style.constant';

const STICKER = {
  stickerKey: 'system/sticker-01-thumbs-up',
  x: 50,
  y: 50,
  scale: 1,
  rotation: 0,
};

const GIVEN: GivenPostcard = {
  kind: 'give',
  giver: { name: 'Ann Lee', photoUrl: null },
  receivers: [{ name: 'Mali Sombat', photoUrl: null, inactive: false }],
  templateKey: 'system/postcard_template_1',
  stickers: [{ ...STICKER, side: 'back' }],
  stampKey: 'system/stamp-02-ocean',
  message: 'You kept the room with you. #Ownership',
  messageTags: { workspaceGoals: [{ name: 'Ownership' }], mentions: [] },
  tone: 'cream',
  textStyle: DEFAULT_TEXT_STYLE,
  sentOn: '2026-10-04T09:30:00.000Z',
};

function answerFrom(
  name: string,
  message: string,
  sentOn: string,
): PostcardReadAnswer {
  return {
    giver: { name, photoUrl: null },
    message,
    messageTags: NO_TEXT_TAGS,
    stickers: [],
    textStyle: DEFAULT_TEXT_STYLE,
    sentOn,
  };
}

const KRITS_ANSWER: PostcardReadAnswer = {
  ...answerFrom('Krit Chan', 'It landed well.', '2026-10-05T09:30:00.000Z'),
  stickers: [{ ...STICKER, side: 'back' }],
};
const BENS_ANSWER = answerFrom(
  'Ben Park',
  'The pricing went fast.',
  '2026-10-06T09:30:00.000Z',
);

const ANSWERED: AnsweredPostcard = {
  kind: 'ask',
  ask: {
    requester: { name: 'Mali Sombat', photoUrl: null },
    templateKey: 'system/postcard_template_2',
    stickers: [],
    stampKey: null,
    message: 'How did the demo land for you?',
    tone: 'sage',
    textStyle: DEFAULT_TEXT_STYLE,
  },
  messageTags: NO_TEXT_TAGS,
  answers: [KRITS_ANSWER, BENS_ANSWER],
};

/** A request whose Requester left a sticker and a stamp, with two answers styled their own way. */
const DRESSED_UP: AnsweredPostcard = {
  ...ANSWERED,
  ask: {
    ...ANSWERED.ask,
    stickers: [
      { ...STICKER, stickerKey: 'system/sticker-03-love', side: 'back' },
    ],
    stampKey: 'system/stamp-02-ocean',
  },
  answers: [
    {
      ...KRITS_ANSWER,
      textStyle: { ...DEFAULT_TEXT_STYLE, font: 'signature', ink: 'navy' },
    },
    {
      ...BENS_ANSWER,
      textStyle: { ...DEFAULT_TEXT_STYLE, font: 'classic', ink: 'plum' },
    },
  ],
};

function back() {
  return screen.getByRole('region', { name: 'Back of the postcard' });
}

/** The paragraph a message is set in. */
function messageNamed(text: string) {
  const message = within(back()).getByText(text).closest('p');
  if (!message) {
    throw new Error(`"${text}" is not in a message.`);
  }
  return message;
}

/** jsdom plays no animation, so the turn's two halves are ended by hand. */
function endTurn() {
  const card = screen.getByLabelText('Back of the postcard').parentElement;
  if (!card) {
    throw new Error('The postcard has no card around its sides.');
  }
  fireEvent.animationEnd(card);
  fireEvent.animationEnd(card);
}

function renderDialog(card: ReadPostcard) {
  const onOpenChange = vi.fn();
  render(
    <PostcardReadDialog
      title="Feedback from Ann"
      card={card}
      open
      onOpenChange={onOpenChange}
    />,
  );
  return { onOpenChange };
}

/** Opened from a button, as a page would, so what happens to focus can be seen. */
function Opened({ card }: { card: ReadPostcard }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open postcard
      </button>
      <PostcardReadDialog
        title="Feedback from Ann"
        card={card}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

describe('PostcardReadDialog', () => {
  it('shows given Feedback on its back: who it is from and for, and the message with its tags', () => {
    renderDialog(GIVEN);

    expect(
      screen.getByRole('dialog', { name: 'Feedback from Ann' }),
    ).toBeInTheDocument();
    expect(within(back()).getByText('Ann Lee')).toBeInTheDocument();
    expect(within(back()).getByText('Mali Sombat')).toBeInTheDocument();
    expect(within(back()).getByText('#Ownership')).toBeInTheDocument();
    expect(
      within(back()).getByRole('img', { name: 'Ocean stamp' }),
    ).toBeInTheDocument();
    expect(
      within(back()).getByRole('img', { name: 'Thumbs up sticker' }),
    ).toBeInTheDocument();
  });

  it('says the day it was posted', () => {
    renderDialog(GIVEN);

    expect(within(back()).getByText('Posted 4 Oct 2026')).toBeInTheDocument();
  });

  it('dates the postmark from the answer showing', async () => {
    const user = userEvent.setup();
    renderDialog(ANSWERED);
    expect(within(back()).getByText('Posted 5 Oct 2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next answer' }));

    expect(within(back()).getByText('Posted 6 Oct 2026')).toBeInTheDocument();
  });

  it('offers a stack of faces that names them when it went to several people', async () => {
    const user = userEvent.setup();
    renderDialog({
      ...GIVEN,
      receivers: [
        { name: 'Mali Sombat', photoUrl: null, inactive: false },
        { name: 'Krit Chan', photoUrl: null, inactive: false },
      ],
    });

    await user.click(within(back()).getByRole('button'));

    expect(
      await screen.findByText('Ann Lee gave this Feedback to all of them.'),
    ).toBeInTheDocument();
  });

  it('leaves nothing on the card to change', () => {
    renderDialog(GIVEN);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /send/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /stamp|sticker/i }),
    ).not.toBeInTheDocument();
  });

  it('turns over to the front, with what is stuck there, and back again', async () => {
    const user = userEvent.setup();
    renderDialog({
      ...GIVEN,
      stickers: [
        { ...STICKER, stickerKey: 'system/sticker-03-love', side: 'front' },
      ],
    });

    await user.click(
      screen.getByRole('button', {
        name: 'Turn over to the front, the picture',
      }),
    );
    endTurn();

    const front = screen.getByRole('region', { name: 'Front of the postcard' });
    expect(
      within(front).getByRole('img', { name: 'Love sticker' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Back of the postcard' }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: 'Turn over to the back, the message',
      }),
    );
    endTurn();

    expect(within(back()).getByText('#Ownership')).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Front of the postcard' }),
    ).not.toBeInTheDocument();
  });

  it('names somebody Deactivated as inactive, however many it went to', () => {
    renderDialog({
      ...GIVEN,
      giver: { ...GIVEN.giver, inactive: true },
      receivers: [{ name: 'Mali Sombat', photoUrl: null, inactive: true }],
    });

    expect(within(back()).getByText('Ann Lee (inactive)')).toBeInTheDocument();
    expect(
      within(back()).getByText('Mali Sombat (inactive)'),
    ).toBeInTheDocument();
  });

  it('names a Deactivated Requester as inactive', () => {
    renderDialog({
      ...ANSWERED,
      ask: {
        ...ANSWERED.ask,
        requester: { ...ANSWERED.ask.requester, inactive: true },
      },
    });

    expect(
      within(back()).getByText('Mali Sombat (inactive)'),
    ).toBeInTheDocument();
  });

  it('prints the word in the box left for a stamp, which opens nothing', () => {
    renderDialog({ ...GIVEN, stampKey: null });

    expect(within(back()).getByText('Stamp')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /stamp/i }),
    ).not.toBeInTheDocument();
  });

  it('starts with the cursor on Close, and Tab reaches the message', async () => {
    const user = userEvent.setup();
    renderDialog(GIVEN);
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();

    await user.tab();
    await user.tab();

    expect(messageNamed('#Ownership')).toHaveFocus();
  });

  it('closes only the list of names on Escape, and stays open itself', async () => {
    const user = userEvent.setup();
    renderDialog({
      ...GIVEN,
      receivers: [
        { name: 'Mali Sombat', photoUrl: null, inactive: false },
        { name: 'Krit Chan', photoUrl: null, inactive: false },
      ],
    });
    await user.click(within(back()).getByRole('button'));
    await screen.findByText('Ann Lee gave this Feedback to all of them.');

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(
        screen.queryByText('Ann Lee gave this Feedback to all of them.'),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole('dialog', { name: 'Feedback from Ann' }),
    ).toBeInTheDocument();
  });

  it('closes at once from Close, asking nothing', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog(GIVEN);

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(
      screen.queryByRole('heading', { name: /close without sending/i }),
    ).not.toBeInTheDocument();
  });

  it('closes at once on Escape, and gives focus back to what opened it', async () => {
    const user = userEvent.setup();
    render(<Opened card={GIVEN} />);
    const opener = screen.getByRole('button', { name: 'Open postcard' });

    await user.click(opener);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('leaves focus alone when what opened it has gone', async () => {
    const user = userEvent.setup();
    function OpenerThatGoes() {
      const [open, setOpen] = useState(false);
      return (
        <>
          {!open && (
            <button type="button" onClick={() => setOpen(true)}>
              Open postcard
            </button>
          )}
          <PostcardReadDialog
            title="Feedback from Ann"
            card={GIVEN}
            open={open}
            onOpenChange={setOpen}
          />
        </>
      );
    }
    render(<OpenerThatGoes />);

    await user.click(screen.getByRole('button', { name: 'Open postcard' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(document.body).toHaveFocus();
  });

  it('shows the Ask on the left and the first answer on the right', () => {
    renderDialog(ANSWERED);

    expect(within(back()).getByText('Mali Sombat')).toBeInTheDocument();
    expect(
      within(back()).getByText('How did the demo land for you?'),
    ).toBeInTheDocument();
    expect(within(back()).getByText('Krit Chan')).toBeInTheDocument();
    expect(within(back()).getByText('It landed well.')).toBeInTheDocument();
  });

  it('has no pager for a single answer', () => {
    renderDialog({ ...ANSWERED, answers: [KRITS_ANSWER] });

    expect(
      screen.queryByRole('group', { name: 'Answers' }),
    ).not.toBeInTheDocument();
  });

  it('swaps the answer and its stickers, keeps the Ask, and says whose it is', async () => {
    const user = userEvent.setup();
    renderDialog(ANSWERED);
    expect(
      within(back()).getByRole('img', { name: 'Thumbs up sticker' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next answer' }));

    expect(
      within(back()).getByText('The pricing went fast.'),
    ).toBeInTheDocument();
    expect(
      within(back()).queryByText('It landed well.'),
    ).not.toBeInTheDocument();
    expect(
      within(back()).queryByRole('img', { name: 'Thumbs up sticker' }),
    ).not.toBeInTheDocument();
    expect(
      within(back()).getByText('How did the demo land for you?'),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Answer from Ben Park, 2 of 2',
    );
    expect(screen.getByRole('button', { name: 'Next answer' })).toHaveFocus();
  });

  it('sets each answer in its own style', async () => {
    const user = userEvent.setup();
    renderDialog(DRESSED_UP);
    expect(messageNamed('It landed well.')).toHaveClass(
      'font-handwrite',
      'text-status-info-active',
    );

    await user.click(screen.getByRole('button', { name: 'Next answer' }));

    const next = messageNamed('The pricing went fast.');
    expect(next).toHaveClass('font-display', 'text-fg-accent');
    expect(next).not.toHaveClass('font-handwrite');
  });

  it('keeps what the Requester put on the card as the answers change', async () => {
    const user = userEvent.setup();
    renderDialog(DRESSED_UP);

    await user.click(screen.getByRole('button', { name: 'Next answer' }));

    expect(
      within(back()).getByRole('img', { name: 'Love sticker' }),
    ).toBeInTheDocument();
    expect(
      within(back()).getByRole('img', { name: 'Ocean stamp' }),
    ).toBeInTheDocument();
  });

  it('starts the next answer at its first line', async () => {
    const user = userEvent.setup();
    renderDialog(ANSWERED);
    messageNamed('It landed well.').scrollTop = 200;

    await user.click(screen.getByRole('button', { name: 'Next answer' }));

    expect(messageNamed('The pricing went fast.').scrollTop).toBe(0);
  });

  it('agrees with the pager when the answers shrink under it', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const three: AnsweredPostcard = {
      ...ANSWERED,
      answers: [
        KRITS_ANSWER,
        BENS_ANSWER,
        answerFrom('Ann Lee', 'Clear to me.', '2026-10-07T09:30:00.000Z'),
      ],
    };
    const { rerender } = render(
      <PostcardReadDialog
        title="Answers"
        card={three}
        open
        onOpenChange={onOpenChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Previous answer' }));

    rerender(
      <PostcardReadDialog
        title="Answers"
        card={ANSWERED}
        open
        onOpenChange={onOpenChange}
      />,
    );

    expect(
      within(back()).getByText('The pricing went fast.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('2 of 2');
  });

  it('runs round from the last answer to the first, both ways', async () => {
    const user = userEvent.setup();
    renderDialog(ANSWERED);

    await user.click(screen.getByRole('button', { name: 'Previous answer' }));
    expect(
      within(back()).getByText('The pricing went fast.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next answer' }));
    expect(within(back()).getByText('It landed well.')).toBeInTheDocument();
  });

  it('takes the pager away from the front, which has no answers', async () => {
    const user = userEvent.setup();
    renderDialog(ANSWERED);

    await user.click(
      screen.getByRole('button', {
        name: 'Turn over to the front, the picture',
      }),
    );

    expect(screen.getByRole('group', { name: 'Answers' })).toHaveClass(
      'invisible',
    );
  });

  it('starts every opening on the first answer', async () => {
    const user = userEvent.setup();
    render(<Opened card={ANSWERED} />);

    await user.click(screen.getByRole('button', { name: 'Open postcard' }));
    await user.click(screen.getByRole('button', { name: 'Next answer' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await user.click(screen.getByRole('button', { name: 'Open postcard' }));

    expect(within(back()).getByText('It landed well.')).toBeInTheDocument();
  });
});
