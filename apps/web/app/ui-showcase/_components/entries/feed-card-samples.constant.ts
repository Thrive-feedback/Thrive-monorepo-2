import { standInPhoto } from '@/app/ui-showcase/_lib/stand-in-photo.util';
import type {
  HomeFeedAsk,
  HomeFeedItem,
  HomeFeedPerson,
  HomeFeedRequest,
} from '@/lib/feedback/home-feed-item.type';
import { NO_TEXT_TAGS, type TextTags } from '@/lib/feedback/text-tags.type';
import type { NavTarget } from '@/lib/navigation/nav-target.type';

function person(
  accountId: string,
  name: string | null,
  inactive = false,
): HomeFeedPerson {
  return { accountId, name, photoUrl: null, inactive };
}

const ANN = person('ann', 'Ann Lee');
const BEN = person('ben', 'Ben Carter');
const CARA = person('cara', 'Cara Diaz');
const DAO = person('dao', 'Dao Prasert');
const NOK = person('nok', 'Nok Wattana');
const CHAI = person('chai', 'Chai Srisuk');
const DEACTIVATED = person('mali', 'Mali Sombat', true);
const NOT_INTRODUCED = person('new', null);
const WITH_PHOTO = {
  ...CARA,
  photoUrl: standInPhoto('#a78bfa', '#6d28d9'),
};
const LONG_NAME = person(
  'long',
  'Chayanin Rattanakosinthanaphat Wongsakul Na Ayutthaya',
);

/** The showcase has no postcard to open, so pressing a card stays on the page. */
export const SAMPLE_TARGET: NavTarget = { href: '#' };

/** Who reads every sample: the Ann above. */
export const SAMPLE_READER = ANN.accountId;

export const SAMPLE_OFFERED: HomeFeedItem = {
  id: 'offered',
  origin: 'OFFERED',
  giver: CARA,
  receivers: [BEN],
  message:
    'The second paragraph does the work now, and the rest got out of its way. Worth saying what it costs a bit earlier.',
  messageTags: NO_TEXT_TAGS,
  givenAt: '2026-10-31T03:00:00.000Z',
  visibility: 'EVERYONE',
  request: null,
};

function answered(
  who: HomeFeedPerson,
  message: string,
  messageTags: TextTags = NO_TEXT_TAGS,
): HomeFeedAsk {
  return {
    person: who,
    status: 'ANSWERED',
    answer: { message, messageTags },
  };
}

function waiting(who: HomeFeedPerson): HomeFeedAsk {
  return { person: who, status: 'PENDING', answer: null };
}

/** Cara wrote the sample's answer; Dao has answered too, and Nok has not. */
const REQUEST: HomeFeedRequest = {
  message: 'How clear was the migration plan I shared on Monday?',
  messageTags: NO_TEXT_TAGS,
  requester: BEN,
  asked: [
    answered(CARA, 'The order of the steps was clear.'),
    answered(DAO, 'I would add who to call if a step fails.'),
    waiting(NOK),
  ],
};

/** An answer is written to the Requester, and to nobody else. */
export const SAMPLE_REQUESTED: HomeFeedItem = {
  ...SAMPLE_OFFERED,
  id: 'requested',
  origin: 'REQUESTED',
  receivers: [BEN],
  message:
    'The order of the steps was clear. What I missed was who to call if step three fails, so I would add one line on that.',
  request: REQUEST,
};

/** Longer than three lines and two, to show where a card cuts it. */
const LONG_MESSAGE =
  'Thank you for staying with the migration until it was done. You answered every question from the support team without making anyone feel rushed, and you wrote each answer down so the next person could find it. Next time, tell us the plan before you start, so we can plan around you and nobody has to ask twice.';

const WITH_LINE_BREAKS =
  'Three things stood out.\nThe recap at the end landed.\nThe room stayed with you when the demo broke.';

/** What sent text looks like bound to a Mention and a Workspace Goal. */
const TAGGED_MESSAGE =
  'Thanks to @ann.lee this shipped on time, which is #Ownership at its best.';
const TAGS: TextTags = {
  workspaceGoals: [{ name: 'Ownership' }],
  mentions: [{ slug: 'ann.lee', displayName: 'Ann' }],
};

/** A feed as Home draws it: both kinds, in the order they might arrive. */
export const SAMPLE_FEED: readonly HomeFeedItem[] = [
  { ...SAMPLE_OFFERED, id: 'feed-1', receivers: [ANN, BEN, DAO] },
  {
    ...SAMPLE_REQUESTED,
    id: 'feed-2',
    giver: WITH_PHOTO,
    receivers: [ANN],
    message: 'You open strongly and keep everyone with you.',
    request: { ...REQUEST, requester: ANN },
  },
  { ...SAMPLE_OFFERED, id: 'feed-3', giver: ANN },
  { ...SAMPLE_REQUESTED, id: 'feed-4', visibility: 'SELECTED_PEOPLE' },
  {
    ...SAMPLE_OFFERED,
    id: 'feed-5',
    visibility: 'SELECTED_PEOPLE',
    message: TAGGED_MESSAGE,
    messageTags: TAGS,
  },
  {
    ...SAMPLE_REQUESTED,
    id: 'feed-6',
    message: LONG_MESSAGE,
    request: { ...REQUEST, message: LONG_MESSAGE },
  },
];

export type FeedCardCase = {
  label: string;
  hint?: string;
  item: HomeFeedItem;
  /** Drawn at a phone's width. */
  isNarrow?: boolean;
};

/**
 * The Offered cards worth telling apart. Selected people only ever appears with a reader who is
 * neither the Giver nor a Receiver: their own kept to a few people belongs to their history.
 */
export const OFFERED_CASES: readonly FeedCardCase[] = [
  { label: 'Somebody else’s', item: SAMPLE_OFFERED },
  {
    label: 'Written to the reader',
    item: { ...SAMPLE_OFFERED, receivers: [ANN] },
  },
  {
    label: 'Given by the reader',
    item: { ...SAMPLE_OFFERED, giver: ANN },
  },
  {
    label: 'To several people',
    hint: 'A small stack, the reader first. Past four faces, the rest become one "+N".',
    item: {
      ...SAMPLE_OFFERED,
      receivers: [BEN, ANN, DAO, NOK, CHAI],
    },
  },
  {
    label: 'Selected people',
    item: { ...SAMPLE_OFFERED, visibility: 'SELECTED_PEOPLE' },
  },
  {
    label: 'Written with @ and #',
    hint: '@ names a teammate and # a Workspace Goal, each as a pill.',
    item: {
      ...SAMPLE_OFFERED,
      message: TAGGED_MESSAGE,
      messageTags: TAGS,
    },
  },
  {
    label: 'A long message',
    hint: 'Cut at three lines.',
    item: { ...SAMPLE_OFFERED, message: LONG_MESSAGE },
  },
  {
    label: 'Somebody Deactivated, somebody with no name yet',
    item: {
      ...SAMPLE_OFFERED,
      giver: DEACTIVATED,
      receivers: [NOT_INTRODUCED],
    },
  },
  {
    label: 'At a phone’s width, with a very long name',
    hint: 'Who can read it runs under the small postcard.',
    item: {
      ...SAMPLE_OFFERED,
      giver: LONG_NAME,
      receivers: [BEN, ANN, DAO],
    },
    isNarrow: true,
  },
];

/** The Requested cards worth telling apart, by the same rule. It has one Receiver: who asked. */
export const REQUESTED_CASES: readonly FeedCardCase[] = [
  {
    label: 'Somebody else’s, some answered and some waiting',
    hint: 'Closed at first. Press the faces for each name and status, or Show answers to read them.',
    item: SAMPLE_REQUESTED,
  },
  {
    label: 'The reader asked',
    hint: 'It reads "You asked:", and the card is written to you.',
    item: {
      ...SAMPLE_REQUESTED,
      receivers: [ANN],
      request: { ...REQUEST, requester: ANN },
    },
  },
  {
    label: 'Answered by the reader',
    item: {
      ...SAMPLE_REQUESTED,
      giver: ANN,
      request: {
        ...REQUEST,
        asked: [
          answered(ANN, 'The order of the steps was clear.'),
          answered(DAO, 'I would add who to call if a step fails.'),
          waiting(NOK),
        ],
      },
    },
  },
  {
    label: 'The reader has not answered yet',
    hint: 'They read "You" with Pending, and can read the others first.',
    item: {
      ...SAMPLE_REQUESTED,
      request: {
        ...REQUEST,
        asked: [
          answered(CARA, 'The order of the steps was clear.'),
          waiting(ANN),
        ],
      },
    },
  },
  {
    label: 'Asked alone',
    hint: 'Nobody else to list, so nothing shows under the answer.',
    item: {
      ...SAMPLE_REQUESTED,
      request: {
        ...REQUEST,
        asked: [answered(CARA, 'The order of the steps was clear.')],
      },
    },
  },
  {
    label: 'Selected people',
    hint: 'They read what everyone in the Workspace would.',
    item: { ...SAMPLE_REQUESTED, visibility: 'SELECTED_PEOPLE' },
  },
  {
    label: 'Written with @ and #',
    hint: 'In the question, the answer, and each answer behind Show answers.',
    item: {
      ...SAMPLE_REQUESTED,
      message: TAGGED_MESSAGE,
      messageTags: TAGS,
      request: {
        ...REQUEST,
        message: TAGGED_MESSAGE,
        messageTags: TAGS,
        asked: [
          answered(CARA, TAGGED_MESSAGE, TAGS),
          answered(DAO, TAGGED_MESSAGE, TAGS),
        ],
      },
    },
  },
  {
    label: 'More people than the card shows at first',
    hint: 'Past four faces, one "+N". Show answers lists two people, and a press opens the rest.',
    item: {
      ...SAMPLE_REQUESTED,
      request: {
        ...REQUEST,
        asked: [
          answered(CARA, 'The order of the steps was clear.'),
          answered(DAO, 'I would add who to call if a step fails.'),
          waiting(NOK),
          waiting(CHAI),
          answered(ANN, 'It read well, and I knew what to do first.'),
          waiting(LONG_NAME),
        ],
      },
    },
  },
  {
    label: 'A long question and answers',
    hint: 'The answer shows all of itself. The question cuts at two lines, and so does each answer behind Show answers, which opens and closes on its own.',
    item: {
      ...SAMPLE_REQUESTED,
      message: LONG_MESSAGE,
      request: {
        ...REQUEST,
        message: LONG_MESSAGE,
        asked: [
          answered(CARA, LONG_MESSAGE),
          answered(DAO, LONG_MESSAGE),
          answered(NOK, WITH_LINE_BREAKS),
        ],
      },
    },
  },
  {
    label: 'Somebody Deactivated, somebody with no name yet',
    hint: 'A Deactivated person reads in grey with "(inactive)", and their answer stays.',
    item: {
      ...SAMPLE_REQUESTED,
      giver: DEACTIVATED,
      receivers: [NOT_INTRODUCED],
      request: {
        ...REQUEST,
        requester: NOT_INTRODUCED,
        asked: [
          answered(DEACTIVATED, 'The order of the steps was clear.'),
          answered(
            person('pim', 'Pim Suwan', true),
            'I would add who to call if a step fails.',
          ),
          waiting(person('newer', null)),
        ],
      },
    },
  },
  {
    label: 'At a phone’s width, with a very long name',
    hint: 'Who can read it runs under the small postcard.',
    item: { ...SAMPLE_REQUESTED, giver: LONG_NAME },
    isNarrow: true,
  },
];
