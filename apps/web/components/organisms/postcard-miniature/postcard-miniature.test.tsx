import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type {
  AnsweredPostcard,
  GivenPostcard,
} from '@/components/organisms/postcard-dialog/postcard-read.type';
import { DEFAULT_TEXT_STYLE } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { PostcardMiniature } from './postcard-miniature';

const SENT_ON = '2026-10-31T03:00:00.000Z';
const BEN = { name: 'Ben Carter', photoUrl: null, inactive: false };
const ANN = { name: 'Ann Lee', photoUrl: null, inactive: false };

const A_STICKER = {
  stickerKey: 'system/sticker-01-thumbs-up',
  side: 'back',
  x: 50,
  y: 70,
  scale: 1,
  rotation: 0,
} as const;

const GIVEN: GivenPostcard = {
  kind: 'give',
  giver: BEN,
  receivers: [ANN],
  templateKey: 'system/postcard_template_1',
  tone: 'sage',
  textStyle: DEFAULT_TEXT_STYLE,
  stickers: [],
  stampKey: null,
  message: 'The plan was clear.',
  messageTags: NO_TEXT_TAGS,
  sentOn: SENT_ON,
};

const ANSWERED: AnsweredPostcard = {
  kind: 'ask',
  ask: {
    requester: ANN,
    templateKey: 'system/postcard_template_1',
    tone: 'cream',
    textStyle: DEFAULT_TEXT_STYLE,
    stickers: [],
    stampKey: null,
    message: 'How clear was the plan?',
  },
  messageTags: NO_TEXT_TAGS,
  answers: [
    {
      giver: BEN,
      message: 'Very clear.',
      messageTags: NO_TEXT_TAGS,
      stickers: [],
      textStyle: DEFAULT_TEXT_STYLE,
      sentOn: SENT_ON,
    },
  ],
};

function stickersDrawn() {
  return screen.queryAllByRole('img', { name: /sticker$/, hidden: true });
}

function writingLines() {
  return document.querySelectorAll('[data-slot="writing-lines"]');
}

describe('PostcardMiniature', () => {
  it('draws the real back of given Feedback, with the real words on it', () => {
    render(<PostcardMiniature card={GIVEN} />);

    expect(screen.getByText('The plan was clear.')).toBeInTheDocument();
  });

  it('draws lines alone, never the words, for a caller that shows it only on a phone', () => {
    render(<PostcardMiniature card={GIVEN} hasWords={false} />);

    expect(screen.queryByText(GIVEN.message)).toBeNull();
  });

  it('draws an answer on its halved back, the Ask beside it', () => {
    render(<PostcardMiniature card={ANSWERED} />);

    expect(screen.getByText('How clear was the plan?')).toBeInTheDocument();
    expect(screen.getByText('Very clear.')).toBeInTheDocument();
  });

  it('carries the real stamp and the postmark of the day it was sent', () => {
    render(
      <PostcardMiniature
        card={{ ...GIVEN, stampKey: 'system/stamp-02-ocean' }}
      />,
    );

    expect(
      screen.getByRole('img', { name: /stamp$/, hidden: true }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Posted /)).toBeInTheDocument();
  });

  it('prints the box for a stamp on a card sent with none', () => {
    render(<PostcardMiniature card={GIVEN} />);

    expect(screen.getByText('Stamp')).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: /stamp$/, hidden: true }),
    ).not.toBeInTheDocument();
  });

  it('draws the stickers on the back and leaves those on the front', () => {
    render(
      <PostcardMiniature
        card={{
          ...GIVEN,
          stickers: [A_STICKER, { ...A_STICKER, side: 'front' }],
        }}
      />,
    );

    expect(stickersDrawn()).toHaveLength(1);
  });

  it('draws the Ask’s stickers and the answer’s together', () => {
    const [firstAnswer] = ANSWERED.answers;
    render(
      <PostcardMiniature
        card={{
          ...ANSWERED,
          ask: { ...ANSWERED.ask, stickers: [A_STICKER] },
          answers: [{ ...firstAnswer, stickers: [A_STICKER] }],
        }}
      />,
    );

    expect(stickersDrawn()).toHaveLength(2);
  });

  it('holds lines for one side of writing on a whole back, and two on a halved one', () => {
    const { unmount } = render(<PostcardMiniature card={GIVEN} />);

    expect(writingLines()).toHaveLength(1);
    unmount();

    render(<PostcardMiniature card={ANSWERED} />);

    expect(writingLines()).toHaveLength(2);
  });

  it('says nothing to a screen reader, because what holds it names the card', () => {
    render(<PostcardMiniature card={GIVEN} />);

    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });
});
