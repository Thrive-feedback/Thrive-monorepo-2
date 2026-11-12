import type { KudosCardDrawing } from '@/components/organisms/kudos-dialog/kudos-card-read-only';
import type { ReadKudosPerson } from '@/components/organisms/kudos-dialog/read-kudos.type';
import type {
  PostcardAskSticker,
  PostcardWriter,
} from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type {
  AnsweredPostcard,
  GivenPostcard,
} from '@/components/organisms/postcard-dialog/postcard-read.type';
import { DEFAULT_TEXT_STYLE } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { LANDING_COPY } from './landing-copy.constant';

/*
 * The made-up team the landing page's cards are written by and to. Nobody here is a customer: the
 * page says so under the desk. Its names recur across the desk, the Moments and the board, so the
 * page reads as one team's post.
 */

function teammate(slug: string, name: string): Teammate {
  return {
    accountId: `landing-${slug}`,
    name,
    email: `${slug}@example.com`,
    photoUrl: null,
    slug,
    displayName: name.split(' ')[0] ?? name,
  };
}

const KRIT = teammate('krit', 'Krit Wong');
const PLOY = teammate('ploy', 'Ploy Srisuk');
const NOK = teammate('nok', 'Nok Chaiyo');
const BEN = teammate('ben', 'Ben Carter');
const FERN = teammate('fern', 'Fern Somsak');
const DAO = teammate('dao', 'Dao Prasert');
const ANN = teammate('ann', 'Ann Lee');

/** Who the desk's cards can be written to, and who `@` offers there. */
export const LANDING_TEAMMATES: readonly Teammate[] = [
  KRIT,
  PLOY,
  NOK,
  BEN,
  FERN,
  DAO,
  ANN,
];

/** Who writes on the desk: the visitor. */
export const LANDING_WRITER: PostcardWriter = { name: 'You', photoUrl: null };

/** What `#` offers on the desk's cards. */
export const LANDING_WORKSPACE_GOALS: readonly string[] = [
  'Ownership',
  'CustomerFirst',
];

function writer(person: Teammate): PostcardWriter {
  return { name: person.name, photoUrl: person.photoUrl };
}

function kudosPerson(person: Teammate): ReadKudosPerson {
  return {
    accountId: person.accountId,
    name: person.name,
    photoUrl: person.photoUrl,
    inactive: false,
  };
}

function groupPerson(person: Teammate) {
  return { name: person.name, photoUrl: person.photoUrl, inactive: false };
}

const sticker = (
  stickerKey: string,
  x: number,
  y: number,
  rotation: number,
): PostcardAskSticker => ({
  stickerKey: `system/${stickerKey}`,
  side: 'back',
  x,
  y,
  scale: 1,
  rotation,
});

/** The day the made-up team's post went out: fixed, so the page renders the same every time. */
const SENT_ON = '2026-11-03T09:30:00.000Z';

/**
 * The three cards on the desk, before the visitor writes one of their own: an Ask with its answer
 * and Feedback given unasked, both shown by their written backs, and a Kudos. None carries a
 * sticker, so the fan shows the writing alone.
 */
export const DESK_CARDS = {
  ask: {
    kind: 'ask',
    ask: {
      requester: writer(FERN),
      templateKey: 'system/postcard_template_2',
      stampKey: 'system/stamp-02-ocean',
      stickers: [],
      message:
        'How did the onboarding call go from your side? One thing to try next time?',
      tone: 'sage',
      textStyle: { ...DEFAULT_TEXT_STYLE, font: 'classic' },
    },
    messageTags: NO_TEXT_TAGS,
    answers: [
      {
        giver: writer(KRIT),
        message:
          'You let them talk first, and they told us what they need. Next time, send the agenda the day before.',
        messageTags: NO_TEXT_TAGS,
        stickers: [],
        textStyle: { ...DEFAULT_TEXT_STYLE, font: 'signature', ink: 'navy' },
        sentOn: SENT_ON,
      },
    ],
  } satisfies AnsweredPostcard,
  give: {
    kind: 'give',
    giver: writer(NOK),
    receivers: [groupPerson(PLOY)],
    templateKey: 'system/postcard_template_3',
    stampKey: 'system/stamp-04-botanical',
    stickers: [],
    message:
      'Your recap after the client call saved us an hour: everyone knew who owned what before we left the room.\nNext time, send it before lunch so sales can use it too. Thank you!',
    messageTags: NO_TEXT_TAGS,
    tone: 'cream',
    // Written large, as a hurried note is, so it fills the card's lines.
    textStyle: {
      ...DEFAULT_TEXT_STYLE,
      font: 'signature',
      ink: 'navy',
      sizeStep: 4,
    },
    sentOn: SENT_ON,
  } satisfies GivenPostcard,
  kudos: {
    message:
      'Thank you for staying late to fix the release. Friday felt calm because of you.',
    drawing: {
      templateKey: 'peach-pop',
      textStyle: { font: 'classic', sizeStep: 4, align: 'center', ink: 'ink' },
      stickers: [],
    } satisfies KudosCardDrawing,
    givenAt: SENT_ON,
  },
} as const;

const [planning, rehearsal] = LANDING_COPY.moments.items;

/** Each Moment on the card it would be written on, in the order the copy tells them. */
export const MOMENT_CARDS = [
  {
    kind: 'ask',
    ask: {
      requester: writer(NOK),
      templateKey: 'system/postcard_template_4',
      stampKey: 'system/stamp-04-botanical',
      stickers: [],
      message: planning.said,
      tone: 'sage',
      textStyle: { ...DEFAULT_TEXT_STYLE, font: 'modern' },
    },
    messageTags: NO_TEXT_TAGS,
    answers: [
      {
        giver: writer(BEN),
        message: planning.reply,
        messageTags: NO_TEXT_TAGS,
        stickers: [],
        textStyle: { ...DEFAULT_TEXT_STYLE, ink: 'forest' },
        sentOn: SENT_ON,
      },
    ],
  } satisfies AnsweredPostcard,
  {
    kind: 'give',
    giver: writer(FERN),
    receivers: [groupPerson(DAO)],
    templateKey: 'system/postcard_template_3',
    stampKey: 'system/stamp-02-ocean',
    stickers: [],
    message: rehearsal.said,
    messageTags: NO_TEXT_TAGS,
    tone: 'blush',
    textStyle: { ...DEFAULT_TEXT_STYLE, font: 'classic' },
    sentOn: SENT_ON,
  } satisfies GivenPostcard,
] as const;

/** A Kudos on the board: who gave it, who it names, and the card it is on. */
export type LandingKudos = {
  readonly id: string;
  readonly giver: ReadKudosPerson;
  /** None: it is for the whole team. */
  readonly recipients: readonly ReadKudosPerson[];
  readonly message: string;
  readonly drawing: KudosCardDrawing;
  readonly givenAt: string;
};

const style = (
  font: KudosCardDrawing['textStyle']['font'],
  ink: KudosCardDrawing['textStyle']['ink'],
): KudosCardDrawing['textStyle'] => ({
  font,
  sizeStep: 4,
  align: 'center',
  ink,
});

/** The made-up team's board, newest first. */
export const BOARD_KUDOS: readonly LandingKudos[] = [
  {
    id: 'landing-kudos-1',
    giver: kudosPerson(ANN),
    recipients: [kudosPerson(PLOY)],
    message:
      'Your onboarding notes answered every question our new designer had. She shipped her first screen on day three. Thank you!',
    drawing: {
      templateKey: 'mint-breeze',
      textStyle: {
        font: 'signature',
        sizeStep: 4,
        align: 'center',
        ink: 'ink',
      },
      stickers: [sticker('sticker-02-sunshine', 78, 82, -6)],
    },
    givenAt: SENT_ON,
  },
  {
    id: 'landing-kudos-2',
    giver: kudosPerson(BEN),
    recipients: [kudosPerson(NOK)],
    message: 'The launch checklist you wrote saved us twice this week.',
    drawing: {
      templateKey: 'cobalt-dash',
      textStyle: style('signature', 'paper'),
      stickers: [sticker('sticker-01-thumbs-up', 72, 82, 8)],
    },
    givenAt: SENT_ON,
  },
  {
    id: 'landing-kudos-3',
    giver: kudosPerson(DAO),
    recipients: [kudosPerson(FERN)],
    message: 'You turned a messy brief into a clear plan in one afternoon.',
    drawing: {
      templateKey: 'sunny-check',
      textStyle: style('modern', 'ink'),
      stickers: [],
    },
    givenAt: SENT_ON,
  },
  {
    id: 'landing-kudos-4',
    giver: kudosPerson(KRIT),
    recipients: [],
    message: 'Great launch, everyone. Thank you for a calm Friday.',
    drawing: {
      templateKey: 'red-squiggle',
      textStyle: style('classic', 'ink'),
      stickers: [sticker('sticker-04-party', 76, 80, 10)],
    },
    givenAt: SENT_ON,
  },
  {
    id: 'landing-kudos-5',
    giver: kudosPerson(PLOY),
    recipients: [kudosPerson(BEN), kudosPerson(DAO)],
    message:
      'Thank you for taking the customer call at 7am. They signed the next day.',
    drawing: {
      templateKey: 'sky-note',
      textStyle: style('signature', 'navy'),
      stickers: [],
    },
    givenAt: SENT_ON,
  },
  {
    id: 'landing-kudos-6',
    giver: kudosPerson(NOK),
    recipients: [kudosPerson(KRIT)],
    message: 'Your pitch story made the room lean in. Keep telling it.',
    drawing: {
      templateKey: 'peach-pop',
      textStyle: style('classic', 'ink'),
      stickers: [sticker('sticker-09-star', 80, 80, -8)],
    },
    givenAt: SENT_ON,
  },
];

/** The visitor, as the board names whoever pinned a Kudos from the desk. */
export const LANDING_VISITOR: ReadKudosPerson = {
  accountId: 'landing-you',
  name: LANDING_WRITER.name,
  photoUrl: null,
  inactive: false,
};
