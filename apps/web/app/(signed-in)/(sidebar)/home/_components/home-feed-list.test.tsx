import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HomeFeedEntry } from '@/lib/feedback/home-feed-item.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { PAST_THE_DRAWING } from '@/lib/test/past-the-drawing';
import {
  homePage,
  offeredOn,
  weekEndingSunday,
} from '../_lib/home-feed.fixture';
import type { HomeWeek } from '../_lib/home-week.type';
import { HomeDayJumpProvider } from './home-day-jump';
import { HomeFeedList } from './home-feed-list';
import { HomeWeekRibbon } from './home-week-ribbon';

const readNextHomeFeedPage = vi.fn();
const readHomeFeedThroughDay = vi.fn();
vi.mock(
  '@/app/(signed-in)/(sidebar)/home/_lib/home-feed-actions.service',
  () => ({
    readNextHomeFeedPage: (input: unknown) => readNextHomeFeedPage(input),
    readHomeFeedThroughDay: (input: unknown) => readHomeFeedThroughDay(input),
  }),
);

const SUNDAY = '2026-11-22';
const FRIDAY = '2026-11-20';
const THURSDAY = '2026-11-19';
const piece = (id: string, message: string, day = SUNDAY) =>
  offeredOn(day, id, message);

/** A week whose counts agree with whatever a test puts on Sunday, Friday and Thursday. */
const BUSY_WEEK = weekEndingSunday({
  [SUNDAY]: { offered: 3 },
  [FRIDAY]: { offered: 1 },
  [THURSDAY]: { offered: 1 },
});

function List({
  entries,
  nextCursor = null,
  week = BUSY_WEEK,
  show = 'all',
  withRibbon = false,
}: {
  entries: readonly HomeFeedEntry[];
  nextCursor?: string | null;
  week?: HomeWeek;
  show?: 'all' | 'everyone' | 'shared';
  withRibbon?: boolean;
}) {
  return (
    <HomeDayJumpProvider>
      {withRibbon && <HomeWeekRibbon week={week} />}
      <HomeFeedList
        initialPage={homePage(entries, nextCursor)}
        week={week}
        show={show}
      />
    </HomeDayJumpProvider>
  );
}

/** What the list is watching, and a way to bring the end of it into view. */
let bringTheEndIntoView: () => void;
let observing: number;
const scrollIntoView = vi.fn();

beforeEach(() => {
  observing = 0;
  readNextHomeFeedPage.mockReset();
  readHomeFeedThroughDay.mockReset();
  scrollIntoView.mockReset();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(
        private readonly callback: (
          entries: { isIntersecting: boolean }[],
        ) => void,
      ) {
        bringTheEndIntoView = () => this.callback([{ isIntersecting: true }]);
      }
      observe() {
        observing += 1;
      }
      disconnect() {
        observing -= 1;
      }
    },
  );
  // A browser's, which jsdom has not got.
  Element.prototype.scrollIntoView = scrollIntoView;
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function scrollToTheEnd() {
  await act(async () => {
    bringTheEndIntoView();
  });
}

describe('HomeFeedList', () => {
  it('draws the first page the server read', () => {
    render(<List entries={[piece('fb-1', 'First.')]} />);

    expect(screen.getByText('First.', PAST_THE_DRAWING)).toBeInTheDocument();
  });

  it('draws one card for each piece, in the order given, each by how it came about', () => {
    const offered = piece('fb-1', 'First.');
    const requested: HomeFeedEntry = {
      ...piece('fb-2', 'Second.'),
      kind: 'FEEDBACK',
      origin: 'REQUESTED',
      request: {
        message: 'How clear was the plan?',
        messageTags: NO_TEXT_TAGS,
        requester: {
          accountId: 'ben',
          name: 'Ben Carter',
          photoUrl: null,
          inactive: false,
        },
        asked: [],
      },
    };
    render(<List entries={[offered, requested]} />);

    const [first, second] = screen.getAllByRole('listitem');
    expect(first).toHaveTextContent('First.');
    expect(first).not.toHaveTextContent(/asked/i);
    expect(second).toHaveTextContent('Second.');
    expect(second).toHaveTextContent('Asked');
  });

  it('leads each card to its postcard, keeping the filter', () => {
    render(<List entries={[piece('fb-1', 'First.')]} show="shared" />);

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/home?show=shared&feedback=fb-1',
    );
  });

  it('reads the next page as the end comes into view, and adds it below', async () => {
    readNextHomeFeedPage.mockResolvedValue(
      homePage([piece('fb-2', 'Second.')], null),
    );
    render(
      <List
        entries={[piece('fb-1', 'First.')]}
        nextCursor="cursor-1"
        show="everyone"
      />,
    );

    await scrollToTheEnd();

    expect(readNextHomeFeedPage).toHaveBeenCalledWith({
      show: 'everyone',
      cursor: 'cursor-1',
    });
    const [first, second] = screen.getAllByRole('article');
    expect(first).toHaveTextContent('First.');
    expect(second).toHaveTextContent('Second.');
  });

  it('follows the cursor of the page it just read', async () => {
    readNextHomeFeedPage
      .mockResolvedValueOnce(homePage([piece('fb-2', 'Second.')], 'cursor-2'))
      .mockResolvedValueOnce(homePage([piece('fb-3', 'Third.')], null));
    render(<List entries={[piece('fb-1', 'First.')]} nextCursor="cursor-1" />);

    await scrollToTheEnd();
    await scrollToTheEnd();

    expect(readNextHomeFeedPage).toHaveBeenLastCalledWith({
      show: 'all',
      cursor: 'cursor-2',
    });
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('stops watching for the end once there is no next page', async () => {
    readNextHomeFeedPage.mockResolvedValue(
      homePage([piece('fb-2', 'Second.')], null),
    );
    render(<List entries={[piece('fb-1', 'First.')]} nextCursor="cursor-1" />);

    await scrollToTheEnd();

    expect(observing).toBe(0);
  });

  it('never looks for a next page when the first is the last', () => {
    render(<List entries={[piece('fb-1', 'First.')]} />);

    expect(observing).toBe(0);
  });

  it('says when a page could not be read, and reads it again on asking', async () => {
    readNextHomeFeedPage
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(homePage([piece('fb-2', 'Second.')], null));
    render(<List entries={[piece('fb-1', 'First.')]} nextCursor="cursor-1" />);

    await scrollToTheEnd();

    expect(screen.getByText("We couldn't load the Feed.")).toBeInTheDocument();
    expect(observing).toBe(0);

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Second.', PAST_THE_DRAWING)).toBeInTheDocument();
    expect(
      screen.queryByText("We couldn't load the Feed."),
    ).not.toBeInTheDocument();
  });

  it('keeps what it has read when the page reads the first page again', async () => {
    readNextHomeFeedPage.mockResolvedValue(
      homePage([piece('fb-2', 'Second.')], null),
    );
    const { rerender } = render(
      <List entries={[piece('fb-1', 'First.')]} nextCursor="cursor-1" />,
    );
    await scrollToTheEnd();

    rerender(
      <List entries={[piece('fb-0', 'Just written.')]} nextCursor="cursor-0" />,
    );

    expect(screen.getByText('Second.', PAST_THE_DRAWING)).toBeInTheDocument();
    expect(
      screen.queryByText('Just written.', PAST_THE_DRAWING),
    ).not.toBeInTheDocument();
  });

  it('shows a Kudos among the Feedback, each on its own card', () => {
    const kudos: HomeFeedEntry = {
      kind: 'KUDOS',
      day: SUNDAY,
      id: 'k1',
      giver: {
        accountId: 'mali',
        name: 'Mali Chaiyo',
        photoUrl: null,
        inactive: false,
      },
      recipients: [],
      message: 'Great launch, everyone.',
      messageTags: NO_TEXT_TAGS,
      givenAt: '2026-11-22T03:00:00.000Z',
      drawing: {
        templateKey: 'peach-pop',
        textStyle: { font: 'modern', sizeStep: 4, align: 'center', ink: 'ink' },
        stickers: [],
      },
    };
    render(<List entries={[kudos, piece('f-1', 'Well done.')]} />);

    expect(
      screen.getByText('Great launch, everyone.', PAST_THE_DRAWING),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: /^Open kudos from/ }),
    ).toBeVisible();
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });
});

describe('Home in days', () => {
  it('heads each day once, even when a page ended halfway through it', async () => {
    readNextHomeFeedPage.mockResolvedValue(
      homePage([piece('fb-3', 'Friday again.', FRIDAY)], null),
    );
    render(
      <List
        entries={[piece('fb-1', 'Today.'), piece('fb-2', 'Friday.', FRIDAY)]}
        nextCursor="cursor-1"
        week={weekEndingSunday({
          [SUNDAY]: { offered: 1 },
          [FRIDAY]: { offered: 2 },
        })}
      />,
    );

    await scrollToTheEnd();

    const friday = screen.getByRole('region', { name: /^Friday/ });
    expect(within(friday).getAllByRole('article')).toHaveLength(2);
    expect(screen.getAllByRole('region', { name: /^Friday/ })).toHaveLength(1);
  });

  it('names Today and Yesterday from the week, whatever the clock says', () => {
    vi.useFakeTimers({ now: new Date('2026-11-25T12:00:00.000Z') });
    render(
      <List
        entries={[
          piece('fb-1', 'Today.'),
          piece('fb-2', 'Yesterday.', '2026-11-21'),
        ]}
        week={weekEndingSunday({
          [SUNDAY]: { offered: 1 },
          '2026-11-21': { offered: 1 },
        })}
      />,
    );

    expect(screen.getByRole('heading', { name: /^Today 22/ })).toBeVisible();
    expect(
      screen.getByRole('heading', { name: /^Yesterday 21/ }),
    ).toBeVisible();
  });

  it('says how much a day of the week held, in its kinds’ own words', () => {
    render(
      <List
        entries={[piece('fb-1', 'Today.')]}
        week={weekEndingSunday({ [SUNDAY]: { offered: 1, answers: 2 } })}
      />,
    );

    const today = screen.getByRole('region', { name: /^Today/ });
    expect(today).toHaveTextContent('1 offered');
    expect(today).toHaveTextContent('2 answers');
    expect(today).not.toHaveTextContent('Kudos');
  });

  it('says a day of the week held nothing once the list has read past it', () => {
    render(
      <List
        entries={[piece('fb-1', 'Today.'), piece('fb-2', 'Friday.', FRIDAY)]}
        week={weekEndingSunday({
          [SUNDAY]: { offered: 1 },
          [FRIDAY]: { offered: 1 },
        })}
      />,
    );

    expect(screen.getByText('Nothing written on Saturday.')).toBeVisible();
  });
});

describe('jumping to a day from the ribbon', () => {
  it('brings a day already read into view without reading anything', async () => {
    render(
      <List
        withRibbon
        entries={[piece('fb-1', 'Today.'), piece('fb-2', 'Friday.', FRIDAY)]}
        nextCursor="cursor-1"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^Friday 20/ }));

    expect(readHomeFeedThroughDay).not.toHaveBeenCalled();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: /^Friday 20/ })).toHaveFocus();
  });

  it('reads on to a day not yet read, once, then brings it into view', async () => {
    readHomeFeedThroughDay.mockResolvedValue(
      homePage([piece('fb-3', 'Thursday.', THURSDAY)], 'cursor-2'),
    );
    render(
      <List
        withRibbon
        entries={[piece('fb-1', 'Today.')]}
        nextCursor="cursor-1"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^Thursday 19/ }));

    expect(readHomeFeedThroughDay).toHaveBeenCalledTimes(1);
    expect(readHomeFeedThroughDay).toHaveBeenCalledWith({
      show: 'all',
      cursor: 'cursor-1',
      day: THURSDAY,
    });
    expect(
      await screen.findByRole('heading', { name: /^Thursday 19/ }),
    ).toHaveFocus();
  });

  it('cannot be asked for a day that held nothing', () => {
    render(<List withRibbon entries={[piece('fb-1', 'Today.')]} />);

    expect(
      screen.getByRole('button', { name: /^Wednesday 18, nothing written/ }),
    ).toBeDisabled();
  });

  it('gives up when the read fails, leaving the list to offer another try', async () => {
    readHomeFeedThroughDay.mockResolvedValue(null);
    render(
      <List
        withRibbon
        entries={[piece('fb-1', 'Today.')]}
        nextCursor="cursor-1"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^Thursday 19/ }));

    expect(
      await screen.findByText("We couldn't load the Feed."),
    ).toBeInTheDocument();
    expect(readHomeFeedThroughDay).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('button', { name: /^Thursday 19/ }),
    ).not.toHaveAttribute('aria-busy', 'true');
  });

  it('stops after its bound when the day never comes', async () => {
    let read = 0;
    readHomeFeedThroughDay.mockImplementation(async () => {
      read += 1;
      return homePage(
        [piece(`today-${read}`, `More today ${read}.`)],
        `cursor-${read + 1}`,
      );
    });
    render(
      <List
        withRibbon
        entries={[piece('fb-1', 'Today.')]}
        nextCursor="cursor-1"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^Thursday 19/ }));
    await screen.findByText('More today 3.', PAST_THE_DRAWING);

    expect(readHomeFeedThroughDay).toHaveBeenCalledTimes(3);
  });
});
