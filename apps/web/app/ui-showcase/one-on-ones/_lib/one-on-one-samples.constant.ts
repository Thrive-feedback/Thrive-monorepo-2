import type {
  OneOnOne,
  OneOnOneSchedule,
  OneOnOneTemplate,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import type {
  Meeting,
  MeetingTopic,
  NextMeeting,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting.type';
import type { Teammate } from '@/lib/feedback/teammate.type';

/** Who reads every sample: the person signed in, on one side of each 1:1. */
const ME = 'sample-me';

function teammate(accountId: string, name: string): Teammate {
  const first = name.split(' ')[0] ?? name;
  return {
    accountId,
    name,
    email: `${first.toLowerCase()}@thrive.example`,
    photoUrl: null,
    slug: first.toLowerCase(),
    displayName: first,
  };
}

/** Made-up teammates, one for each state a 1:1 can be in, so no two cards in the list share a face. */
export const SAMPLE_ONE_ON_ONE_TEAMMATES: readonly Teammate[] = [
  teammate('mint', 'Mint Boonmee'),
  teammate('leo', 'Leo Santos'),
  teammate('grace', 'Grace Kim'),
  teammate('dev', 'Dev Patel'),
  teammate('elena', 'Elena Rossi'),
  teammate('jun', 'Jun Tanaka'),
  teammate('hugo', 'Hugo Martin'),
  teammate('cara', 'Cara Diaz'),
  teammate('femi', 'Femi Okafor'),
  teammate('omar', 'Omar Haddad'),
  teammate('priya', 'Priya Nair'),
  teammate('sam', 'Sam Wilson'),
  teammate('tom', 'Tom Becker'),
  teammate('ana', 'Ana Lopes'),
];

/** Thrive's own templates, as the API answers them, for the dialogs and the agenda preview. */
export const SAMPLE_ONE_ON_ONE_TEMPLATES: readonly OneOnOneTemplate[] = [
  {
    key: 'weekly-check-in',
    scope: 'THRIVE',
    changeable: false,
    name: 'Weekly check-in',
    suggestedWhen: 'The default for every 1:1',
    questions: [
      'What went well this week?',
      "What's in your way?",
      'What do you need from me?',
    ],
  },
  {
    key: 'career-conversation',
    scope: 'THRIVE',
    changeable: false,
    name: 'Career conversation',
    suggestedWhen: 'Suggested every 6 months',
    questions: [
      'Where do you want to be in two years?',
      'Which skills do you want to grow next?',
      'What work would stretch you?',
      'How can I help?',
    ],
  },
  {
    key: 'new-joiner',
    scope: 'THRIVE',
    changeable: false,
    name: 'New joiner 30/60/90',
    suggestedWhen: 'Suggested in a new joiner’s first weeks',
    questions: [
      'What has surprised you so far?',
      'Who have you not met yet?',
      'What would make next week easier?',
    ],
  },
  {
    key: 'feedback-both-ways',
    scope: 'THRIVE',
    changeable: false,
    name: 'Feedback both ways',
    suggestedWhen: 'Suggested once a month',
    questions: [
      "What's one thing I could do better as your lead?",
      "One thing I've seen you do well…",
    ],
  },
];

const WEEKLY: OneOnOneSchedule = {
  cadence: 'WEEKLY',
  weekday: 4,
  templateKey: 'weekly-check-in',
  templateName: 'Weekly check-in',
  startsOn: '2026-11-26',
};

/** A 1:1 between the reader and `other`, sent by whichever of them `from` names. */
function sample(
  id: string,
  other: string,
  from: 'me' | 'them',
  overrides: Partial<OneOnOne>,
): OneOnOne {
  return {
    id,
    status: 'ACTIVE',
    startedByAccountId: from === 'me' ? ME : other,
    invitedAccountId: from === 'me' ? other : ME,
    withAccountId: other,
    schedule: WEEKLY,
    inviteNote: null,
    suggestedAt: null,
    answerNote: null,
    nextMeetingAt: '2026-12-03T03:00:00.000Z',
    answeredAt: '2026-11-20T04:00:00.000Z',
    endedAt: null,
    createdAt: '2026-11-20T03:00:00.000Z',
    meetingInProgress: false,
    ...overrides,
  };
}

const WAITING = {
  status: 'INVITED',
  nextMeetingAt: null,
  answeredAt: null,
} as const satisfies Partial<OneOnOne>;

/** One sample for each case the page draws, named for the gallery's captions. */
/** The day the samples are read on: Mint's weekly 1:1 meets on it, so the list shows Today. */
export const SAMPLE_TODAY = '2026-11-27';

export const SAMPLE_ONE_ON_ONES = {
  invitedWithNote: sample(
    '0196b4c8-0000-7000-8000-000000000001',
    'elena',
    'them',
    {
      ...WAITING,
      inviteNote:
        'Could we talk about the tech lead path? I would love your view.',
      createdAt: '2026-11-25T03:00:00.000Z',
    },
  ),
  invitedWithoutNote: sample(
    '0196b4c8-0000-7000-8000-000000000002',
    'femi',
    'them',
    {
      ...WAITING,
      schedule: {
        ...WEEKLY,
        weekday: 3,
        startsOn: '2026-12-02',
      },
      createdAt: '2026-11-24T03:00:00.000Z',
    },
  ),
  runningWeekly: sample('0196b4c8-0000-7000-8000-000000000003', 'mint', 'me', {
    nextMeetingAt: '2026-11-27T03:00:00.000Z',
  }),
  runningMonthly: sample(
    '0196b4c8-0000-7000-8000-000000000004',
    'grace',
    'them',
    {
      schedule: {
        cadence: 'MONTHLY',
        weekday: 5,
        templateKey: 'feedback-both-ways',
        templateName: 'Feedback both ways',
        startsOn: '2026-12-11',
      },
      nextMeetingAt: '2026-12-11T09:00:00.000Z',
    },
  ),
  runningEveryTwoWeeks: sample(
    '0196b4c8-0000-7000-8000-000000000005',
    'cara',
    'me',
    {
      schedule: {
        cadence: 'EVERY_TWO_WEEKS',
        weekday: 2,
        templateKey: 'career-conversation',
        templateName: 'Career conversation',
        startsOn: '2026-12-01',
      },
      nextMeetingAt: '2026-12-01T07:00:00.000Z',
    },
  ),
  yourInvitationWaiting: sample(
    '0196b4c8-0000-7000-8000-000000000006',
    'dev',
    'me',
    {
      ...WAITING,
      schedule: {
        ...WEEKLY,
        weekday: 1,
        startsOn: '2026-11-30',
      },
      inviteNote: 'A regular half hour to talk about the platform migration.',
      createdAt: '2026-11-23T03:00:00.000Z',
    },
  ),
  declinedWithNote: sample(
    '0196b4c8-0000-7000-8000-000000000007',
    'hugo',
    'me',
    {
      status: 'DECLINED',
      nextMeetingAt: null,
      answeredAt: '2026-11-24T05:00:00.000Z',
      answerNote: 'Not this month, I am on leave. Can we try in January?',
    },
  ),
  declinedWithoutNote: sample(
    '0196b4c8-0000-7000-8000-000000000008',
    'jun',
    'me',
    {
      status: 'DECLINED',
      nextMeetingAt: null,
      answeredAt: '2026-11-25T05:00:00.000Z',
    },
  ),
  ended: sample('0196b4c8-0000-7000-8000-000000000009', 'leo', 'them', {
    status: 'ENDED',
    nextMeetingAt: null,
    endedAt: '2026-11-26T05:00:00.000Z',
  }),
} satisfies Record<string, OneOnOne>;

/** A meeting held just once, on `day` at 11:00 for 30 minutes, the new joiner's template. */
function onceOn(day: string, weekday: number): OneOnOneSchedule {
  return {
    cadence: 'ONCE',
    weekday,
    templateKey: 'new-joiner',
    templateName: 'New joiner 30 / 60 / 90',
    startsOn: day,
  };
}

/** The cases added with meetings held once and invitations sent back with another time. */
export const SAMPLE_ONE_ON_ONES_MORE = {
  suggestedToYou: sample(
    '0196b4c8-0000-7000-8000-00000000000a',
    'omar',
    'them',
    {
      ...WAITING,
      schedule: {
        ...WEEKLY,
        weekday: 2,
        startsOn: '2026-12-01',
      },
      inviteNote: 'Thursdays are full for me. Could Tuesday afternoons work?',
      suggestedAt: '2026-11-25T08:00:00.000Z',
      createdAt: '2026-11-24T03:00:00.000Z',
    },
  ),
  yourSuggestionWaiting: sample(
    '0196b4c8-0000-7000-8000-00000000000b',
    'priya',
    'me',
    {
      ...WAITING,
      schedule: {
        ...WEEKLY,
        weekday: 5,
        startsOn: '2026-11-27',
      },
      inviteNote: 'Mornings are easier for me.',
      suggestedAt: '2026-11-25T09:00:00.000Z',
      createdAt: '2026-11-22T03:00:00.000Z',
    },
  ),
  onceInvitation: sample(
    '0196b4c8-0000-7000-8000-00000000000c',
    'sam',
    'them',
    {
      ...WAITING,
      schedule: onceOn('2026-12-02', 3),
      inviteNote:
        'I just joined the team. Could we meet once to talk about how things work here?',
      createdAt: '2026-11-26T02:00:00.000Z',
    },
  ),
  onceUpcoming: sample('0196b4c8-0000-7000-8000-00000000000d', 'tom', 'me', {
    schedule: onceOn('2026-12-04', 5),
    nextMeetingAt: '2026-12-04T04:00:00.000Z',
  }),
  onceMet: sample('0196b4c8-0000-7000-8000-00000000000e', 'ana', 'them', {
    schedule: onceOn('2026-11-24', 2),
    nextMeetingAt: null,
  }),
} satisfies Record<string, OneOnOne>;

/** Every sample once, as the list would hold them, one person per case. */
export const SAMPLE_ONE_ON_ONE_LIST: readonly OneOnOne[] = [
  ...Object.values(SAMPLE_ONE_ON_ONES),
  ...Object.values(SAMPLE_ONE_ON_ONES_MORE),
];

/** Only what meets, as most people's list is most of the time: the list then has no tabs. */
export const SAMPLE_UPCOMING_ONLY: readonly OneOnOne[] = [
  SAMPLE_ONE_ON_ONES.runningWeekly,
  SAMPLE_ONE_ON_ONES.runningMonthly,
  SAMPLE_ONE_ON_ONES_MORE.onceUpcoming,
];

/** Teammates the reader already has a 1:1 with, as the Create dialog greys them out. */
export const SAMPLE_UNAVAILABLE: readonly (readonly [string, string])[] = [
  ['mint', 'You already have a 1:1'],
  ['dev', 'A 1:1 is waiting on an answer'],
];

function sampleTopic(
  id: string,
  text: string,
  overrides: Partial<MeetingTopic> = {},
): MeetingTopic {
  return {
    id: `0196b4c8-0000-7000-8000-0000000001${id}`,
    text,
    source: 'TEMPLATE',
    authorAccountId: null,
    position: 0,
    notes: '',
    notesUpdatedAt: null,
    notesUpdatedByAccountId: null,
    discussedAt: null,
    ...overrides,
  };
}

const AGENDA: MeetingTopic[] = [
  sampleTopic('a1', 'Career path: senior engineer', { source: 'CARRIED' }),
  sampleTopic('a2', 'What went well this week?', { position: 1 }),
  sampleTopic('a3', 'The hiring loop', {
    source: 'PERSON',
    authorAccountId: 'mint',
    position: 2,
  }),
  sampleTopic('a4', 'My worry about on-call', {
    source: 'PERSON',
    authorAccountId: ME,
    position: 3,
  }),
];

const LIVE: Meeting = {
  id: '0196b4c8-0000-7000-8000-0000000003b1',
  state: 'PREPARING',
  templateKey: 'weekly-check-in',
  occursAt: null,
  startedAt: null,
  startedByAccountId: null,
  finishedAt: null,
  finishedByAccountId: null,
  topics: AGENDA,
};

/** Mint's next meeting, in each of the states its panel draws. */
export const SAMPLE_NEXT_MEETINGS = {
  untouched: {
    meeting: null,
    carried: ['Career path: senior engineer'],
    templateQuestions: [],
    templateName: null,
  },
  preparing: {
    meeting: LIVE,
    carried: [],
    templateQuestions: [],
    templateName: 'Weekly check-in',
  },
  inProgress: {
    meeting: {
      ...LIVE,
      state: 'IN_PROGRESS',
      occursAt: '2026-11-27T03:00:00.000Z',
      startedAt: '2026-11-27T03:02:00.000Z',
      startedByAccountId: 'mint',
      topics: AGENDA.map((topic, index) =>
        index === 1
          ? {
              ...topic,
              notes: 'The launch went out a day early.',
              notesUpdatedAt: '2026-11-27T03:10:00.000Z',
              notesUpdatedByAccountId: 'mint',
              discussedAt: '2026-11-27T03:10:00.000Z',
            }
          : topic,
      ),
    },
    carried: [],
    templateQuestions: [],
    templateName: 'Weekly check-in',
  },
} satisfies Record<string, NextMeeting>;

/** Mint's finished meetings, newest first. */
export const SAMPLE_PAST_MEETINGS: readonly Meeting[] = [
  {
    ...LIVE,
    id: '0196b4c8-0000-7000-8000-0000000003a1',
    state: 'FINISHED',
    occursAt: '2026-11-20T03:00:00.000Z',
    startedAt: '2026-11-20T03:00:00.000Z',
    startedByAccountId: ME,
    finishedAt: '2026-11-20T03:30:00.000Z',
    finishedByAccountId: 'mint',
    topics: [
      sampleTopic('b1', 'What went well this week?', {
        notes: 'Shipped the onboarding flow a day early.',
        discussedAt: '2026-11-20T03:10:00.000Z',
      }),
      sampleTopic('b2', "What's in your way?", {
        position: 1,
        notes: 'Waiting two days for a design review.',
        discussedAt: '2026-11-20T03:20:00.000Z',
      }),
      sampleTopic('b3', 'Career path: senior engineer', {
        source: 'PERSON',
        authorAccountId: 'mint',
        position: 2,
      }),
    ],
  },
];
