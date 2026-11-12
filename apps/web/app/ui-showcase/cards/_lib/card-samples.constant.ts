import type {
  PersonalFeedback,
  PersonalKudos,
  PersonalRequest,
} from '@/app/(signed-in)/(sidebar)/_lib/personal-item.type';
import {
  SAMPLE_ANSWERED_CARD,
  SAMPLE_ASKED_CARD,
  SAMPLE_OFFERED,
  SAMPLE_REQUESTED,
} from '@/app/ui-showcase/_components/entries/feed-card-samples.constant';
import {
  KUDOS_CASES,
  SAMPLE_KUDOS,
  SAMPLE_KUDOS_TO_THE_READER,
} from '@/app/ui-showcase/_components/entries/kudos-samples.constant';
import type { HomeFeedPerson } from '@/lib/feedback/home-feed-item.type';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';

const SENT_ON = '2026-10-31T03:00:00.000Z';

function person(accountId: string, name: string): HomeFeedPerson {
  return { accountId, name, photoUrl: null, inactive: false };
}

const ANN = person('ann', 'Ann Lee');
const BEN = person('ben', 'Ben Carter');
const CARA = person('cara', 'Cara Diaz');
const DAO = person('dao', 'Dao Prasert');
const NOK = person('nok', 'Nok Wattana');
const CHAI = person('chai', 'Chai Srisuk');
const MALI = person('mali', 'Mali Chaiyo');

export const SAMPLE_WAITING_ASK: MyAsk = {
  askId: 'ask-1',
  message: 'How clear was the migration plan I shared on Monday?',
  messageTags: NO_TEXT_TAGS,
  requesterName: 'Ann Lee',
  requesterPhotoUrl: null,
  requesterInactive: false,
  askedAt: SENT_ON,
  status: 'PENDING',
};

/** The reader's own request, answered by one of the three people asked. */
export const SAMPLE_MY_REQUEST: PersonalRequest = {
  kind: 'REQUEST',
  id: 'request-1',
  message: 'How clear was the migration plan I shared on Monday?',
  messageTags: NO_TEXT_TAGS,
  visibility: 'SELECTED_PEOPLE',
  requester: ANN,
  sentAt: SENT_ON,
  card: SAMPLE_ASKED_CARD,
  asked: [
    {
      person: BEN,
      status: 'ANSWERED',
      answer: {
        id: 'answer-1',
        message: 'The order of the steps was clear.',
        messageTags: NO_TEXT_TAGS,
        answeredAt: SENT_ON,
        card: SAMPLE_ANSWERED_CARD,
      },
    },
    { person: CARA, status: 'PENDING', answer: null },
    { person: DAO, status: 'PENDING', answer: null },
  ],
};

/** The same request before anybody answered it, so its tile has nothing to open. */
export const SAMPLE_MY_UNANSWERED_REQUEST: PersonalRequest = {
  ...SAMPLE_MY_REQUEST,
  id: 'request-2',
  visibility: 'ONLY_ME',
  asked: SAMPLE_MY_REQUEST.asked.map((ask) => ({
    ...ask,
    status: 'PENDING',
    answer: null,
  })),
};

/** One answer to the reader's request, sent back on the card it was asked on. */
function answerFrom(
  who: HomeFeedPerson,
  message: string,
  answeredAt: string,
): PersonalRequest['asked'][number] {
  const [written] = SAMPLE_ANSWERED_CARD.answers;
  return {
    person: who,
    status: 'ANSWERED',
    answer: {
      id: `answer-${who.accountId}`,
      message,
      messageTags: NO_TEXT_TAGS,
      answeredAt,
      card: {
        ...SAMPLE_ANSWERED_CARD,
        answers: [
          {
            ...written,
            giver: { name: who.name ?? '', photoUrl: null, inactive: false },
            message,
            sentOn: answeredAt,
          },
        ],
      },
    },
  };
}

/** The reader's request to six people, four of whom answered: more faces than a stack shows. */
export const SAMPLE_MY_REQUEST_MANY_ANSWERS: PersonalRequest = {
  ...SAMPLE_MY_REQUEST,
  id: 'request-3',
  visibility: 'EVERYONE',
  asked: [
    answerFrom(
      BEN,
      'The order of the steps was clear.',
      '2026-11-01T03:00:00.000Z',
    ),
    answerFrom(
      CARA,
      'I would add who to call if step three fails, and how long the rollback takes.',
      '2026-11-03T08:00:00.000Z',
    ),
    answerFrom(
      DAO,
      'Clear enough to follow without asking anyone. The diagram helped most.',
      '2026-11-02T10:00:00.000Z',
    ),
    answerFrom(
      NOK,
      'Section two read twice before it made sense: the terms changed halfway through. Everything after that was easy.',
      '2026-11-04T01:00:00.000Z',
    ),
    { person: CHAI, status: 'PENDING', answer: null },
    { person: MALI, status: 'PENDING', answer: null },
  ],
};

/** The reader's request to two people, both of whom answered: the last row is an answer. */
export const SAMPLE_MY_REQUEST_ALL_ANSWERED: PersonalRequest = {
  ...SAMPLE_MY_REQUEST,
  id: 'request-4',
  visibility: 'ONLY_ME',
  asked: [
    answerFrom(CARA, 'Clear from start to finish.', '2026-11-05T08:00:00.000Z'),
    answerFrom(
      DAO,
      'The rollback section made me confident to run it alone.',
      '2026-11-04T10:00:00.000Z',
    ),
  ],
};

export const SAMPLE_PERSONAL_OFFERED: PersonalFeedback = {
  ...SAMPLE_OFFERED,
  kind: 'FEEDBACK',
};

export const SAMPLE_PERSONAL_REQUESTED: PersonalFeedback = {
  ...SAMPLE_REQUESTED,
  kind: 'FEEDBACK',
};

export const SAMPLE_PERSONAL_KUDOS: PersonalKudos = {
  ...SAMPLE_KUDOS,
  kind: 'KUDOS',
};

/** Three Kudos on three templates, as the board hangs them side by side. */
export const SAMPLE_BOARD_KUDOS = [
  SAMPLE_KUDOS,
  SAMPLE_KUDOS_TO_THE_READER,
  ...KUDOS_CASES.slice(2, 3).map(({ kudos }) => kudos),
];
