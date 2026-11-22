import { PLAIN_POSTCARD } from '@/app/(signed-in)/(sidebar)/_lib/plain-postcard.constant';
import type {
  HomeFeedEntry,
  HomeFeedPage,
} from '@/lib/feedback/home-feed-item.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import type { HomeWeek, HomeWeekCounts } from './home-week.type';

/** Who reads Home in these tests. */
export const READER = 'ann';

const person = (accountId: string, name: string) => ({
  accountId,
  name,
  photoUrl: null,
  inactive: false,
});

/** Feedback Cara gave Ben unasked, on `day`, saying `message`. */
export function offeredOn(
  day: string,
  id: string,
  message = `Feedback ${id}.`,
): Extract<HomeFeedEntry, { kind: 'FEEDBACK' }> {
  const givenAt = `${day}T03:00:00.000Z`;
  return {
    kind: 'FEEDBACK',
    day,
    id,
    origin: 'OFFERED',
    giver: person('cara', 'Cara Diaz'),
    receivers: [person('ben', 'Ben Carter')],
    message,
    messageTags: NO_TEXT_TAGS,
    givenAt,
    visibility: 'EVERYONE',
    request: null,
    card: {
      ...PLAIN_POSTCARD,
      kind: 'give',
      giver: person('cara', 'Cara Diaz'),
      receivers: [person('ben', 'Ben Carter')],
      message,
      messageTags: NO_TEXT_TAGS,
      sentOn: givenAt,
    },
  };
}

export function homePage(
  entries: readonly HomeFeedEntry[],
  nextCursor: string | null,
): HomeFeedPage {
  return { readerAccountId: READER, items: entries, nextCursor };
}

const NONE: HomeWeekCounts = { offered: 0, answers: 0, kudos: 0 };

/**
 * The seven days up to Sunday 22 November 2026, each holding what `held` says and nothing
 * otherwise.
 */
export function weekEndingSunday(
  held: Readonly<Record<string, Partial<HomeWeekCounts>>> = {},
  countsKudos = true,
): HomeWeek {
  const days = [
    '2026-11-16',
    '2026-11-17',
    '2026-11-18',
    '2026-11-19',
    '2026-11-20',
    '2026-11-21',
    '2026-11-22',
  ].map((day) => ({ day, ...NONE, ...held[day] }));
  return {
    today: '2026-11-22',
    days,
    totals: days.reduce(
      (totals, day) => ({
        offered: totals.offered + day.offered,
        answers: totals.answers + day.answers,
        kudos: totals.kudos + day.kudos,
      }),
      NONE,
    ),
    countsKudos,
  };
}
