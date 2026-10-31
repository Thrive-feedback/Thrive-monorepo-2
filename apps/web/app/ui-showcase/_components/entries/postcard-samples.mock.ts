import type { PostcardAsk } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type {
  AnsweredPostcard,
  GivenPostcard,
  PostcardReadAnswer,
} from '@/components/organisms/postcard-dialog/postcard-read.type';
import { DEFAULT_TEXT_STYLE } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';

const ANN = { name: 'Ann Lee', photoUrl: null };
const MALI = { name: 'Mali Sombat', photoUrl: null, inactive: false };
const KRIT = { name: 'Krit Chan', photoUrl: null, inactive: false };
const BEN = { name: 'Ben Park', photoUrl: null, inactive: false };

/** A made-up Ask from Mali: the showcase reaches no Workspace. */
export const SAMPLE_ASK: PostcardAsk = {
  requester: { name: MALI.name, photoUrl: MALI.photoUrl },
  templateKey: 'system/postcard_template_2',
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
  message:
    'How did the demo land for you?\nI rushed the pricing slide — was it still clear what each plan includes?',
  tone: 'sage',
  textStyle: { ...DEFAULT_TEXT_STYLE, font: 'classic' },
};

export const SAMPLE_GIVEN: GivenPostcard = {
  kind: 'give',
  giver: ANN,
  receivers: [MALI],
  templateKey: 'system/postcard_template_3',
  stampKey: 'system/stamp-04-botanical',
  stickers: [
    {
      stickerKey: 'system/sticker-01-thumbs-up',
      side: 'back',
      x: 84,
      y: 80,
      scale: 1,
      rotation: 8,
    },
    {
      stickerKey: 'system/sticker-02-sunshine',
      side: 'front',
      x: 78,
      y: 28,
      scale: 1.3,
      rotation: -6,
    },
  ],
  message:
    'You kept the room with you when the demo broke. #Ownership\n@krit said the same afterwards: nobody noticed how close it came.',
  messageTags: {
    workspaceGoals: [{ name: 'Ownership' }],
    mentions: [{ slug: 'krit', displayName: 'Krit' }],
  },
  tone: 'cream',
  textStyle: { ...DEFAULT_TEXT_STYLE, font: 'signature', ink: 'navy' },
  sentOn: '2026-10-04T09:30:00.000Z',
};

export const SAMPLE_GIVEN_TO_SEVERAL: GivenPostcard = {
  ...SAMPLE_GIVEN,
  receivers: [MALI, KRIT, BEN],
  tone: 'blush',
};

export const SAMPLE_GIVEN_UNSTAMPED: GivenPostcard = {
  ...SAMPLE_GIVEN,
  stampKey: null,
  stickers: [],
  tone: 'sage',
};

export const SAMPLE_GIVEN_LONG: GivenPostcard = {
  ...SAMPLE_GIVEN,
  message: Array.from(
    { length: 12 },
    () =>
      'Thank you for staying with the customer call until everyone understood the next step.',
  ).join('\n'),
  messageTags: NO_TEXT_TAGS,
};

const KRITS_ANSWER: PostcardReadAnswer = {
  giver: { name: KRIT.name, photoUrl: KRIT.photoUrl },
  message:
    'It landed well. The pricing slide went quickly, but the plans were still clear.',
  messageTags: NO_TEXT_TAGS,
  stickers: [
    {
      stickerKey: 'system/sticker-07-rocket',
      side: 'back',
      x: 88,
      y: 82,
      scale: 1,
      rotation: 14,
    },
  ],
  textStyle: { ...DEFAULT_TEXT_STYLE, font: 'signature' },
  sentOn: '2026-10-05T09:30:00.000Z',
};

const ANNS_ANSWER: PostcardReadAnswer = {
  giver: { name: ANN.name, photoUrl: ANN.photoUrl },
  message:
    'I lost the second plan for a moment. One more pause on that slide would fix it.',
  messageTags: NO_TEXT_TAGS,
  stickers: [],
  textStyle: { ...DEFAULT_TEXT_STYLE, ink: 'forest' },
  sentOn: '2026-10-06T09:30:00.000Z',
};

const BENS_ANSWER: PostcardReadAnswer = {
  giver: { name: BEN.name, photoUrl: BEN.photoUrl },
  message: 'Clear to me, and the customer asked the right questions after it.',
  messageTags: NO_TEXT_TAGS,
  stickers: [
    {
      stickerKey: 'system/sticker-04-party',
      side: 'back',
      x: 70,
      y: 78,
      scale: 0.9,
      rotation: -12,
    },
    {
      stickerKey: 'system/sticker-02-sunshine',
      side: 'back',
      x: 90,
      y: 70,
      scale: 0.8,
      rotation: 10,
    },
  ],
  textStyle: { ...DEFAULT_TEXT_STYLE, font: 'classic', ink: 'plum' },
  sentOn: '2026-10-07T09:30:00.000Z',
};

/** As a Giver reads it: their own answer, and nobody else's. */
export const SAMPLE_ANSWERED: AnsweredPostcard = {
  kind: 'ask',
  ask: SAMPLE_ASK,
  messageTags: NO_TEXT_TAGS,
  answers: [KRITS_ANSWER],
};

/** A Request message at about the longest one can be. */
export const SAMPLE_ANSWERED_LONG_ASK: AnsweredPostcard = {
  ...SAMPLE_ANSWERED,
  ask: {
    ...SAMPLE_ASK,
    message: Array.from(
      { length: 11 },
      () =>
        'How did the demo land for you, and was it clear what each plan includes?',
    ).join('\n'),
  },
};

/** As the Requester reads it: every answer that came back. */
export const SAMPLE_ANSWERED_BY_THREE: AnsweredPostcard = {
  ...SAMPLE_ANSWERED,
  answers: [KRITS_ANSWER, ANNS_ANSWER, BENS_ANSWER],
};
