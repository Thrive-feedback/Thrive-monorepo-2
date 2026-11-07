import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PLAIN_POSTCARD } from '@/app/(signed-in)/(sidebar)/_lib/plain-postcard.constant';
import type {
  HomeFeedItem,
  HomeFeedPage,
} from '@/lib/feedback/home-feed-item.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { PAST_THE_DRAWING } from '@/lib/test/past-the-drawing';
import { HomeFeedList } from './home-feed-list';

const readNextHomeFeedPage = vi.fn();
vi.mock(
  '@/app/(signed-in)/(sidebar)/home/_lib/home-feed-actions.service',
  () => ({
    readNextHomeFeedPage: (input: unknown) => readNextHomeFeedPage(input),
  }),
);

const READER = 'ann';

function piece(id: string, message: string): HomeFeedItem {
  const person = (accountId: string, name: string) => ({
    accountId,
    name,
    photoUrl: null,
    inactive: false,
  });
  return {
    id,
    origin: 'OFFERED',
    giver: person('cara', 'Cara Diaz'),
    receivers: [person('ben', 'Ben Carter')],
    message,
    messageTags: NO_TEXT_TAGS,
    givenAt: '2026-10-31T03:00:00.000Z',
    visibility: 'SELECTED_PEOPLE',
    request: null,
    card: {
      ...PLAIN_POSTCARD,
      kind: 'give',
      giver: person('cara', 'Cara Diaz'),
      receivers: [person('ben', 'Ben Carter')],
      message,
      messageTags: NO_TEXT_TAGS,
      sentOn: '2026-10-31T03:00:00.000Z',
    },
  };
}

function page(
  items: readonly HomeFeedItem[],
  nextCursor: string | null,
): HomeFeedPage {
  return {
    readerAccountId: READER,
    items: items.map((item) => ({ kind: 'FEEDBACK' as const, ...item })),
    nextCursor,
  };
}

/** What the list is watching, and a way to bring the end of it into view. */
let bringTheEndIntoView: () => void;
let observing: number;

beforeEach(() => {
  observing = 0;
  readNextHomeFeedPage.mockReset();
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
});

async function scrollToTheEnd() {
  await act(async () => {
    bringTheEndIntoView();
  });
}

describe('HomeFeedList', () => {
  it('draws the first page the server read', () => {
    render(
      <HomeFeedList
        initialPage={page([piece('fb-1', 'First.')], null)}
        show="all"
      />,
    );

    expect(screen.getByText('First.', PAST_THE_DRAWING)).toBeInTheDocument();
  });

  it('draws one card for each piece, in the order given, each by how it came about', () => {
    const offered = piece('fb-1', 'First.');
    const requested: HomeFeedItem = {
      ...piece('fb-2', 'Second.'),
      origin: 'REQUESTED',
      request: {
        message: 'How clear was the plan?',
        messageTags: NO_TEXT_TAGS,
        requester: offered.receivers[0] ?? offered.giver,
        asked: [],
      },
    };
    render(
      <HomeFeedList
        initialPage={page([offered, requested], null)}
        show="all"
      />,
    );

    const [first, second] = screen.getAllByRole('listitem');
    expect(first).toHaveTextContent('First.');
    expect(first).not.toHaveTextContent(/asked/i);
    expect(second).toHaveTextContent('Second.');
    expect(second).toHaveTextContent('Asked');
  });

  it('leads each card to its postcard, keeping the filter', () => {
    render(
      <HomeFeedList
        initialPage={page([piece('fb-1', 'First.')], null)}
        show="shared"
      />,
    );

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/home?show=shared&feedback=fb-1',
    );
  });

  it('reads the next page as the end comes into view, and adds it below', async () => {
    readNextHomeFeedPage.mockResolvedValue(
      page([piece('fb-2', 'Second.')], null),
    );
    render(
      <HomeFeedList
        initialPage={page([piece('fb-1', 'First.')], 'cursor-1')}
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
      .mockResolvedValueOnce(page([piece('fb-2', 'Second.')], 'cursor-2'))
      .mockResolvedValueOnce(page([piece('fb-3', 'Third.')], null));
    render(
      <HomeFeedList
        initialPage={page([piece('fb-1', 'First.')], 'cursor-1')}
        show="all"
      />,
    );

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
      page([piece('fb-2', 'Second.')], null),
    );
    render(
      <HomeFeedList
        initialPage={page([piece('fb-1', 'First.')], 'cursor-1')}
        show="all"
      />,
    );

    await scrollToTheEnd();

    expect(observing).toBe(0);
  });

  it('never looks for a next page when the first is the last', () => {
    render(
      <HomeFeedList
        initialPage={page([piece('fb-1', 'First.')], null)}
        show="all"
      />,
    );

    expect(observing).toBe(0);
  });

  it('says when a page could not be read, and reads it again on asking', async () => {
    readNextHomeFeedPage
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(page([piece('fb-2', 'Second.')], null));
    render(
      <HomeFeedList
        initialPage={page([piece('fb-1', 'First.')], 'cursor-1')}
        show="all"
      />,
    );

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
      page([piece('fb-2', 'Second.')], null),
    );
    const { rerender } = render(
      <HomeFeedList
        initialPage={page([piece('fb-1', 'First.')], 'cursor-1')}
        show="all"
      />,
    );
    await scrollToTheEnd();

    rerender(
      <HomeFeedList
        initialPage={page([piece('fb-0', 'Just written.')], 'cursor-0')}
        show="all"
      />,
    );

    expect(screen.getByText('Second.', PAST_THE_DRAWING)).toBeInTheDocument();
    expect(
      screen.queryByText('Just written.', PAST_THE_DRAWING),
    ).not.toBeInTheDocument();
  });

  it('shows a Kudos among the Feedback, each on its own card', () => {
    render(
      <HomeFeedList
        initialPage={{
          readerAccountId: READER,
          items: [
            {
              kind: 'KUDOS',
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
              givenAt: '2026-10-31T03:00:00.000Z',
              drawing: {
                templateKey: 'peach-pop',
                textStyle: {
                  font: 'modern',
                  sizeStep: 4,
                  align: 'center',
                  ink: 'ink',
                },
                stickers: [],
              },
            },
            ...page([piece('f-1', 'Well done.')], null).items,
          ],
          nextCursor: null,
        }}
        show="all"
      />,
    );

    expect(
      screen.getByText('Great launch, everyone.', PAST_THE_DRAWING),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: /^Open kudos from/ }),
    ).toBeVisible();
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });
});
