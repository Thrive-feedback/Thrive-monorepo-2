import { describe, expect, it } from 'vitest';
import {
  broughtFromOf,
  contextWindowOf,
  toContextCard,
  topicFromContext,
  waitingDaysOf,
  whoOf,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/meeting-context.util';
import type {
  Meeting,
  MeetingContextCard,
  ProfileItem,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';

const ME = 'account-me';
const MINT = 'account-mint';
const PEOPLE = {
  readerAccountId: ME,
  readerName: 'Krit',
  otherAccountId: MINT,
  otherName: 'Mint',
};
const PLOY = { accountId: 'account-ploy', name: 'Ploy Chaiyo', photoUrl: null };
const YOU = { accountId: ME, name: 'Krit P', photoUrl: null };
const MINT_PERSON = { accountId: MINT, name: 'Mint Suwan', photoUrl: null };

function feedback(
  overrides: Partial<Extract<MeetingContextCard, { kind: 'FEEDBACK' }>> = {},
): MeetingContextCard {
  return {
    kind: 'FEEDBACK',
    messageTags: NO_TEXT_TAGS,
    id: '0196b4c8-0000-7000-8000-000000000101',
    giver: PLOY,
    receiverAccountIds: [MINT],
    message: 'The demo was clear.',
    question: null,
    writtenAt: '2026-11-30T03:00:00.000Z',
    ...overrides,
  };
}

function meetingStarted(startedAt: string | null): Meeting {
  return {
    id: `meeting-${startedAt}`,
    state: 'FINISHED',
    templateKey: null,
    occursAt: null,
    startedAt,
    startedByAccountId: ME,
    finishedAt: startedAt,
    finishedByAccountId: ME,
    topics: [],
  };
}

describe('from when Before you meet reads', () => {
  it('reads from when the last meeting held began', () => {
    expect(
      contextWindowOf(
        [
          meetingStarted('2026-11-19T03:02:00.000Z'),
          meetingStarted('2026-11-26T03:05:00.000Z'),
        ],
        '2026-12-02',
      ),
    ).toEqual({ since: '2026-11-26T03:05:00.000Z', lookback: 'LAST_MEETING' });
  });

  it('looks back 30 days from the start of today in Bangkok before any meeting was held', () => {
    expect(contextWindowOf([], '2026-11-26')).toEqual({
      // Midnight on 27 Oct in Bangkok.
      since: '2026-10-26T17:00:00.000Z',
      lookback: 'FIRST_30_DAYS',
    });
  });
});

describe('an item of the other person’s Profile, as a card', () => {
  const person = { ...PLOY, status: 'ACTIVE' as const };

  it('keeps an Ask’s question and who was asked', () => {
    const ask = {
      kind: 'ASK',
      id: 'ask-1',
      feedbackRequestId: 'request-1',
      message: 'How did the doc land?',
      tags: { workspaceGoals: [], mentions: [] },
      requester: { ...MINT_PERSON, status: 'ACTIVE' },
      asked: { ...YOU, status: 'ACTIVE' },
      postcard: null,
      createdAt: '2026-11-07T03:00:00.000Z',
    } as const satisfies Extract<ProfileItem, { kind: 'ASK' }>;

    expect(toContextCard(ask)).toEqual({
      kind: 'ASK',
      id: 'ask-1',
      requester: ask.requester,
      askedAccountId: ME,
      question: 'How did the doc land?',
      messageTags: ask.tags,
      askedAt: '2026-11-07T03:00:00.000Z',
    });
  });

  it('keeps a Kudos’s giver and everyone it names', () => {
    const card = toContextCard({
      kind: 'KUDOS',
      id: 'kudos-1',
      giver: person,
      recipients: [{ ...MINT_PERSON, status: 'ACTIVE' }],
      message: 'Thanks',
      tags: { workspaceGoals: [], mentions: [] },
      card: null,
      createdAt: '2026-11-07T03:00:00.000Z',
    } satisfies Extract<ProfileItem, { kind: 'KUDOS' }>);

    expect(card).toMatchObject({
      kind: 'KUDOS',
      recipientAccountIds: [MINT],
      writtenAt: '2026-11-07T03:00:00.000Z',
    });
  });
});

describe('who a card is from and to', () => {
  it.each([
    [feedback(), 'Ploy sent to Mint'],
    [feedback({ giver: YOU }), 'You sent to Mint'],
    [
      feedback({ giver: MINT_PERSON, receiverAccountIds: [ME] }),
      'Mint sent to you',
    ],
    [
      feedback({ receiverAccountIds: [ME, MINT, 'account-a', 'account-b'] }),
      'Ploy sent to you, Mint and 2 others',
    ],
    [
      feedback({ receiverAccountIds: [ME, MINT, 'account-a'] }),
      'Ploy sent to you, Mint and 1 other',
    ],
    [
      {
        kind: 'ASK',
        messageTags: NO_TEXT_TAGS,
        id: 'ask-1',
        requester: MINT_PERSON,
        askedAccountId: ME,
        question: 'How did the doc land?',
        askedAt: '2026-11-07T03:00:00.000Z',
      } satisfies MeetingContextCard,
      'Mint asked you for feedback',
    ],
  ] as const)('names everyone it was for, as the reader would', (card, who) => {
    expect(whoOf(card, PEOPLE)).toBe(who);
  });
});

describe('the topic a card becomes', () => {
  it('says who it is from and to, and its words', () => {
    expect(topicFromContext(feedback(), PEOPLE)).toBe(
      'Ploy sent to Mint: The demo was clear.',
    );
  });

  it('names both people by first name, never "you", as both read it', () => {
    expect(topicFromContext(feedback({ giver: YOU }), PEOPLE)).toBe(
      'Krit sent to Mint: The demo was clear.',
    );
    expect(
      topicFromContext(
        feedback({ giver: MINT_PERSON, receiverAccountIds: [ME] }),
        PEOPLE,
      ),
    ).toBe('Mint sent to Krit: The demo was clear.');
    expect(
      topicFromContext(
        {
          kind: 'ASK',
          messageTags: NO_TEXT_TAGS,
          id: 'ask-1',
          requester: YOU,
          askedAccountId: MINT,
          question: 'How did it go?',
          askedAt: '2026-11-07T03:00:00.000Z',
        },
        PEOPLE,
      ),
    ).toBe('Krit asked Mint for feedback: How did it go?');
  });

  it('names a Member it mentions by first name, and keeps its hashtags as written', () => {
    const card = feedback({
      message: 'Pairing with @ben-carter fixed it. #Ownership',
      messageTags: {
        workspaceGoals: [{ name: 'Ownership' }],
        mentions: [{ slug: 'ben-carter', displayName: 'Ben Carter' }],
      },
    });

    expect(topicFromContext(card, PEOPLE)).toBe(
      'Ploy sent to Mint: Pairing with @Ben fixed it. #Ownership',
    );
  });

  it('keeps a long message to one line, cut at a word, within a topic’s 200 characters', () => {
    const message = `${'Every word here matters a little. '.repeat(10)}\n\nAnd more.`;
    const oneLine = message.replace(/\s+/g, ' ').trim();

    const topic = topicFromContext(feedback({ message }), PEOPLE);
    const excerpt = topic.replace('Ploy sent to Mint: ', '').slice(0, -1);

    expect(topic.endsWith('…')).toBe(true);
    expect(topic.length).toBeLessThanOrEqual(200);
    expect(oneLine.startsWith(excerpt)).toBe(true);
    // Cut where a word ends, never inside one.
    expect(oneLine[excerpt.length]).toBe(' ');
  });

  it('names the item it came from, of every kind', () => {
    expect(broughtFromOf(feedback())).toEqual({
      kind: 'FEEDBACK',
      id: '0196b4c8-0000-7000-8000-000000000101',
    });
    expect(
      broughtFromOf({
        kind: 'ASK',
        messageTags: NO_TEXT_TAGS,
        id: 'ask-1',
        requester: YOU,
        askedAccountId: MINT,
        question: 'How did it go?',
        askedAt: '2026-11-07T03:00:00.000Z',
      }),
    ).toEqual({ kind: 'ASK', id: 'ask-1' });
  });
});

describe('how long an Ask has waited', () => {
  it('counts whole calendar days to today', () => {
    expect(waitingDaysOf('2026-11-07T03:00:00.000Z', '2026-11-28')).toBe(21);
    expect(waitingDaysOf('2026-11-28T03:00:00.000Z', '2026-11-28')).toBe(0);
  });

  it("counts by Bangkok's calendar, so an Ask made early in the morning there waits since today", () => {
    // 05:30 on 28 Nov in Bangkok is still 27 Nov in UTC.
    expect(waitingDaysOf('2026-11-27T22:30:00.000Z', '2026-11-28')).toBe(0);
    expect(waitingDaysOf('2026-11-27T16:59:00.000Z', '2026-11-28')).toBe(1);
  });
});
