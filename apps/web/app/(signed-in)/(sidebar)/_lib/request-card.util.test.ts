import { describe, expect, it } from 'vitest';
import { DEFAULT_TEXT_STYLE } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import type { PersonalRequestAsk } from './personal-item.type';
import { PLAIN_POSTCARD } from './plain-postcard.constant';
import {
  answeredFirst,
  askedLine,
  newestAnswerOf,
  tallyOf,
} from './request-card.util';

const NO_TAGS = { workspaceGoals: [], mentions: [] };

function asked(name: string, answeredAt: string | null): PersonalRequestAsk {
  const writer = { name, photoUrl: null };
  return {
    person: {
      accountId: `account-${name}`,
      name,
      photoUrl: null,
      inactive: false,
    },
    status: answeredAt === null ? 'PENDING' : 'ANSWERED',
    answer:
      answeredAt === null
        ? null
        : {
            id: `answer-${name}`,
            message: `From ${name}`,
            messageTags: NO_TAGS,
            answeredAt,
            card: {
              kind: 'ask',
              ask: { ...PLAIN_POSTCARD, requester: writer, message: 'How?' },
              messageTags: NO_TAGS,
              answers: [
                {
                  giver: writer,
                  message: `From ${name}`,
                  messageTags: NO_TAGS,
                  stickers: [],
                  textStyle: DEFAULT_TEXT_STYLE,
                  sentOn: answeredAt,
                },
              ],
            },
          },
  };
}

describe('the request card', () => {
  it('names the one person asked, and counts several', () => {
    expect(askedLine({ asked: [asked('Ben Wong', null)] })).toBe(
      'You asked Ben Wong',
    );
    expect(
      askedLine({ asked: [asked('Ben', null), asked('Cara', null)] }),
    ).toBe('You asked 2 people');
  });

  it('counts the answered among everyone asked, nobody answered too', () => {
    expect(
      tallyOf({ asked: [asked('Ben', null), asked('Cara', null)] }),
    ).toEqual({ answered: 0, asked: 2 });
  });

  it('puts the newest answer first, then those Pending by name, never by how long they waited', () => {
    const request = {
      asked: [
        asked('Zoe', null),
        asked('Ben', '2026-11-01T03:00:00.000Z'),
        asked('Ann', null),
        asked('Cara', '2026-11-02T03:00:00.000Z'),
      ],
    };

    const { answers, pending } = answeredFirst(request);

    expect(answers.map((ask) => ask.person.name)).toEqual(['Cara', 'Ben']);
    expect(pending.map((ask) => ask.person.name)).toEqual(['Ann', 'Zoe']);
    expect(newestAnswerOf(request)?.id).toBe('answer-Cara');
  });

  it('has no answer to open while everyone is Pending', () => {
    expect(newestAnswerOf({ asked: [asked('Ben', null)] })).toBeNull();
  });
});
