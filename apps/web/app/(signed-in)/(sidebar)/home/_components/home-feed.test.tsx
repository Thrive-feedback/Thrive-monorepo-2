import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PLAIN_POSTCARD } from '@/app/(signed-in)/(sidebar)/_lib/plain-postcard.constant';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { PAST_THE_DRAWING } from '@/lib/test/past-the-drawing';
import { weekEndingSunday } from '../_lib/home-feed.fixture';
import { HomeDayJumpProvider } from './home-day-jump';
import { HomeFeed, type HomeFeedProps } from './home-feed';

const readHomeFeed = vi.fn();
vi.mock('@/app/(signed-in)/(sidebar)/home/_lib/home-feed.service', () => ({
  readHomeFeed: (...args: unknown[]) => readHomeFeed(...args),
}));
const readHomeWeek = vi.fn();
vi.mock('../_lib/home-week.service', () => ({
  readHomeWeek: (...args: unknown[]) => readHomeWeek(...args),
}));
vi.mock(
  '@/app/(signed-in)/(sidebar)/home/_lib/home-feed-actions.service',
  () => ({ readNextHomeFeedPage: vi.fn(), readHomeFeedThroughDay: vi.fn() }),
);

/** The feed as the page places it, inside what carries a press of a day to it. */
async function homeFeed(props: HomeFeedProps) {
  return <HomeDayJumpProvider>{await HomeFeed(props)}</HomeDayJumpProvider>;
}

const piece = (id: string, giver: string, message: string) => ({
  kind: 'FEEDBACK',
  day: '2026-11-22',
  id,
  origin: 'OFFERED',
  giver: { accountId: giver, name: giver, photoUrl: null, inactive: false },
  receivers: [],
  message,
  messageTags: NO_TEXT_TAGS,
  givenAt: '2026-10-31T03:00:00.000Z',
  visibility: 'EVERYONE',
  request: null,
  card: {
    ...PLAIN_POSTCARD,
    kind: 'give',
    giver: { name: giver, photoUrl: null },
    receivers: [{ name: 'Ben', photoUrl: null }],
    message,
    messageTags: NO_TEXT_TAGS,
    sentOn: '2026-10-31T03:00:00.000Z',
  },
});

const pageWith = (...items: ReturnType<typeof piece>[]) => ({
  readerAccountId: 'ann',
  items,
  nextCursor: null,
});

const MEMBERSHIP = {
  workspace: { id: 'w-1', name: 'Acme' },
  role: 'MEMBER',
} as const;

beforeEach(() => {
  readHomeWeek.mockResolvedValue(
    weekEndingSunday({ '2026-11-22': { offered: 2 } }),
  );
  readHomeFeed.mockResolvedValue({
    readerAccountId: 'ann',
    items: [],
    nextCursor: null,
  });
});

describe('HomeFeed', () => {
  it('reads the choice it was given', async () => {
    render(await homeFeed({ membership: MEMBERSHIP, show: 'shared' }));

    expect(readHomeFeed).toHaveBeenCalledWith(MEMBERSHIP, 'shared');
    expect(readHomeWeek).toHaveBeenCalledWith(MEMBERSHIP, 'shared');
  });

  it.each([
    ['all', 'No Feedback to show yet'],
    ['everyone', 'Nothing has been shared with the whole Workspace yet.'],
    ['shared', 'Nothing has been shared with you yet.'],
  ] as const)(
    'says what %s holds when it holds nothing',
    async (show, title) => {
      render(await homeFeed({ membership: MEMBERSHIP, show }));

      expect(screen.getByText(title, PAST_THE_DRAWING)).toBeInTheDocument();
    },
  );

  it('shows the card the reader just sent, at the top', async () => {
    readHomeFeed.mockResolvedValue(
      pageWith(piece('p-1', 'ann', 'Their first card')),
    );
    const { rerender } = render(
      await homeFeed({ membership: MEMBERSHIP, show: 'all' }),
    );

    readHomeFeed.mockResolvedValue(
      pageWith(
        piece('p-2', 'ann', 'Their next card'),
        piece('p-1', 'ann', 'Their first card'),
      ),
    );
    rerender(await homeFeed({ membership: MEMBERSHIP, show: 'all' }));

    expect(
      screen.getAllByRole('article').map((card) => card.textContent),
    ).toEqual([
      expect.stringContaining('Their next card'),
      expect.stringContaining('Their first card'),
    ]);
  });

  it('moves no card when somebody else posts meanwhile', async () => {
    readHomeFeed.mockResolvedValue(
      pageWith(piece('p-1', 'ann', 'Their first card')),
    );
    const { rerender } = render(
      await homeFeed({ membership: MEMBERSHIP, show: 'all' }),
    );

    readHomeFeed.mockResolvedValue(
      pageWith(
        piece('p-2', 'ben', 'Somebody else posted'),
        piece('p-1', 'ann', 'Their first card'),
      ),
    );
    rerender(await homeFeed({ membership: MEMBERSHIP, show: 'all' }));

    expect(
      screen.getByText('Their first card', PAST_THE_DRAWING),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Somebody else posted', PAST_THE_DRAWING),
    ).not.toBeInTheDocument();
  });
});
