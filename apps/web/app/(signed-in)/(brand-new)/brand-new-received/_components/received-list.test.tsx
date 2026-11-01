import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from 'vitest';
import type {
  ReceivedFeedback,
  ReceivedItem,
  ReceivedKudos,
  ReceivedPage,
} from '@/app/(signed-in)/(brand-new)/brand-new-received/_lib/received-item.type';
import { DEFAULT_TEXT_STYLE } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { ReceivedList } from './received-list';
import { ReceivedViewToggle } from './received-view-toggle';

const readNextReceivedPage = vi.fn();
vi.mock(
  '@/app/(signed-in)/(brand-new)/brand-new-received/_lib/received-items-actions.service',
  () => ({
    readNextReceivedPage: (input: unknown) => readNextReceivedPage(input),
  }),
);

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => '/brand-new-received',
  unstable_rethrow: vi.fn(),
}));

const GIVEN_AT = '2026-10-31T03:00:00.000Z';
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const READER = 'ann';
const BEN = {
  accountId: 'ben',
  name: 'Ben Carter',
  photoUrl: null,
  inactive: false,
};
const ANN = {
  accountId: READER,
  name: 'Ann Lee',
  photoUrl: null,
  inactive: false,
};

function postcard(
  id: string,
  message: string,
  visibility: ReceivedFeedback['visibility'] = 'ONLY_ME',
  receivers: readonly [typeof ANN, ...(typeof ANN)[]] = [ANN],
): ReceivedFeedback {
  return {
    kind: 'FEEDBACK',
    id,
    origin: 'OFFERED',
    giver: BEN,
    receivers,
    message,
    messageTags: NO_TEXT_TAGS,
    givenAt: GIVEN_AT,
    visibility,
    request: null,
    card: {
      kind: 'give',
      giver: BEN,
      receivers,
      templateKey: 'system/postcard_template_1',
      tone: 'sage',
      textStyle: DEFAULT_TEXT_STYLE,
      stickers: [],
      stampKey: null,
      message,
      messageTags: NO_TEXT_TAGS,
      sentOn: GIVEN_AT,
    },
  };
}

/** Ben's answer to what Ann asked him, on the card she asked it on. */
function answer(id: string, message: string): ReceivedFeedback {
  return {
    ...postcard(id, message),
    origin: 'REQUESTED',
    request: {
      message: 'How clear was the plan?',
      messageTags: NO_TEXT_TAGS,
      requester: ANN,
      asked: [
        {
          person: BEN,
          status: 'ANSWERED',
          answer: { message, messageTags: NO_TEXT_TAGS },
        },
      ],
    },
    card: {
      kind: 'ask',
      ask: {
        requester: ANN,
        templateKey: 'system/postcard_template_1',
        tone: 'cream',
        textStyle: DEFAULT_TEXT_STYLE,
        stickers: [],
        stampKey: null,
        message: 'How clear was the plan?',
      },
      messageTags: NO_TEXT_TAGS,
      answers: [
        {
          giver: BEN,
          message,
          messageTags: NO_TEXT_TAGS,
          stickers: [],
          textStyle: DEFAULT_TEXT_STYLE,
          sentOn: GIVEN_AT,
        },
      ],
    },
  };
}

function kudos(id: string, message: string): ReceivedKudos {
  return {
    kind: 'KUDOS',
    id,
    giver: BEN,
    recipients: [ANN],
    message,
    messageTags: NO_TEXT_TAGS,
    givenAt: GIVEN_AT,
    drawing: {
      templateKey: 'mint-breeze',
      textStyle: { ...DEFAULT_TEXT_STYLE, ink: 'ink' },
      stickers: [],
    },
  };
}

function page(
  items: readonly ReceivedItem[],
  nextCursor: string | null = null,
): ReceivedPage {
  return { readerAccountId: READER, items, nextCursor };
}

/** The words under a card, leaving out the same words drawn small on the card itself. */
function wordsUnderTheCard(text: string) {
  return screen.getByText(text, { ignore: '[aria-hidden="true"] *' });
}

function goTo(address: string) {
  window.history.replaceState(null, '', address);
}

let bringTheEndIntoView: () => void;
const animate = vi.fn(() => ({ onfinish: null }));

beforeEach(() => {
  goTo('/brand-new-received');
  animate.mockClear();
  Element.prototype.animate = animate as never;
  readNextReceivedPage.mockReset();
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
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.useRealTimers();
});

async function scrollToTheEnd() {
  await act(async () => {
    bringTheEndIntoView();
  });
}

describe('ReceivedList, as a grid', () => {
  it('draws one box for each thing written, each with who wrote it and the words under its card', () => {
    render(
      <ReceivedList
        initialPage={page([
          postcard('fb-1', 'The plan was clear.'),
          kudos('ku-1', 'You carried the launch.'),
        ])}
      />,
    );

    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(wordsUnderTheCard('The plan was clear.')).toBeInTheDocument();
    expect(wordsUnderTheCard('You carried the launch.')).toBeInTheDocument();
  });

  it('says how long ago each thing was written', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.parse(GIVEN_AT) + 3 * HOUR);
    render(
      <ReceivedList
        initialPage={page([
          postcard('fb-1', 'First.'),
          kudos('ku-1', 'Second.'),
        ])}
      />,
    );

    expect(
      screen.getAllByText('3 hours ago', { ignore: '[aria-hidden="true"] *' }),
    ).toHaveLength(2);
  });

  it.each([
    ['ONLY_ME', 'Only me'],
    ['SELECTED_PEOPLE', 'Selected people'],
    ['EVERYONE', 'Everyone in the Workspace'],
  ] as const)(
    'names a postcard kept to %s by who can read it, and opens it by address',
    (visibility, label) => {
      render(
        <ReceivedList
          initialPage={page([postcard('fb-1', 'First.', visibility)])}
        />,
      );

      expect(
        screen.getByRole('link', {
          name: new RegExp(
            `^Postcard from Ben Carter, .*, ${label}\\. Opens the postcard\\.$`,
          ),
        }),
      ).toHaveAttribute('href', '/brand-new-received?feedback=fb-1');
    },
  );

  it('does not tell a Receiver of several that a private postcard is theirs alone', () => {
    render(
      <ReceivedList
        initialPage={page([postcard('fb-1', 'First.', 'ONLY_ME', [ANN, BEN])])}
      />,
    );

    expect(
      screen.getByRole('link', { name: /Only the people it's for\./ }),
    ).toBeInTheDocument();
  });

  it('keeps the people named on a small card out of reach, inside the one press', () => {
    render(
      <ReceivedList
        initialPage={page([postcard('fb-1', 'First.', 'ONLY_ME', [ANN, BEN])])}
      />,
    );

    const card = screen.getByRole('link').querySelector('[inert]');

    expect(card?.querySelector('button')).toBeInTheDocument();
  });

  it('draws an answer on the card it was asked on', () => {
    render(
      <ReceivedList initialPage={page([answer('fb-1', 'Very clear.')])} />,
    );

    expect(screen.getByText('How clear was the plan?')).toBeInTheDocument();
    expect(wordsUnderTheCard('Very clear.')).toBeInTheDocument();
  });

  it('marks a Kudos as one, and offers no address for it', () => {
    render(<ReceivedList initialPage={page([kudos('ku-1', 'Well done.')])} />);

    expect(screen.getByText('Kudos')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /^Kudos from Ben Carter, .*\. Opens the kudos card\.$/,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows the Members and Workspace Goals in the words as they were bound', () => {
    const tagged: ReceivedFeedback = {
      ...postcard('fb-1', 'Thanks @ben for #launch and #nothing.'),
      messageTags: {
        workspaceGoals: [{ name: 'launch' }],
        mentions: [{ slug: 'ben', displayName: 'Ben' }],
      },
    };
    render(<ReceivedList initialPage={page([tagged])} />);

    expect(wordsUnderTheCard('@Ben')).toBeInTheDocument();
    expect(wordsUnderTheCard('#launch')).toBeInTheDocument();
  });

  it('says a Giver who was Deactivated is inactive, and what they wrote stays', () => {
    const fromSomeoneGone: ReceivedFeedback = {
      ...postcard('fb-1', 'Still here.'),
      giver: { ...BEN, inactive: true },
    };
    render(<ReceivedList initialPage={page([fromSomeoneGone])} />);

    expect(wordsUnderTheCard('Ben Carter (inactive)')).toBeInTheDocument();
    expect(wordsUnderTheCard('Still here.')).toBeInTheDocument();
  });

  it('starts the line with a capital for a Giver with no name yet', () => {
    const fromSomeoneNew: ReceivedFeedback = {
      ...postcard('fb-1', 'Welcome.'),
      giver: { ...BEN, name: null },
    };
    render(<ReceivedList initialPage={page([fromSomeoneNew])} />);

    expect(wordsUnderTheCard('A teammate')).toBeInTheDocument();
  });

  it.each([
    ['postcard', postcard('fb-1', 'First.')],
    ['Kudos', kudos('ku-1', 'Well done.')],
  ])('keeps a %s still as the cursor comes onto it', async (_kind, item) => {
    const user = userEvent.setup();
    render(<ReceivedList initialPage={page([item])} />);

    await user.hover(
      screen.getByRole(item.kind === 'KUDOS' ? 'button' : 'link'),
    );

    expect(animate).not.toHaveBeenCalled();
  });

  it('opens a Kudos on the card it was written on, and gives focus back on closing', async () => {
    const user = userEvent.setup();
    render(<ReceivedList initialPage={page([kudos('ku-1', 'Well done.')])} />);
    const box = screen.getByRole('button', { name: /^Kudos from Ben Carter/ });

    await user.click(box);

    expect(
      screen.getByRole('dialog', { name: 'Kudos from Ben Carter' }),
    ).toHaveTextContent('Well done.');

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(box).toHaveFocus();
  });

  it('survives a minute passing between the server drawing it and the browser taking over', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.parse(GIVEN_AT) + 30_000);
    const tree = (
      <ReceivedList initialPage={page([postcard('fb-1', 'First.')])} />
    );
    const container = document.createElement('div');
    container.innerHTML = renderToString(tree);
    document.body.append(container);
    vi.setSystemTime(Date.parse(GIVEN_AT) + 2 * MINUTE);
    const onRecoverableError = vi.fn();

    await act(async () => {
      const root = hydrateRoot(container, tree, { onRecoverableError });
      onTestFinished(() => {
        act(() => root.unmount());
        container.remove();
      });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
  });

  it('reads the next page as the end comes near, after what it has', async () => {
    readNextReceivedPage.mockResolvedValue(page([kudos('ku-2', 'Second.')]));
    render(
      <ReceivedList
        initialPage={page([postcard('fb-1', 'First.')], 'cursor-1')}
      />,
    );

    await scrollToTheEnd();

    expect(readNextReceivedPage).toHaveBeenCalledExactlyOnceWith({
      cursor: 'cursor-1',
    });
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(wordsUnderTheCard('Second.')).toBeInTheDocument();
  });

  it('says so when a page could not be read, and tries again when asked', async () => {
    const user = userEvent.setup();
    readNextReceivedPage.mockResolvedValueOnce(null);
    readNextReceivedPage.mockResolvedValueOnce(
      page([kudos('ku-2', 'Second.')]),
    );
    render(
      <ReceivedList
        initialPage={page([postcard('fb-1', 'First.')], 'cursor-1')}
      />,
    );

    await scrollToTheEnd();
    expect(screen.getByText("We couldn't load this page.")).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(wordsUnderTheCard('Second.')).toBeInTheDocument();
    expect(
      screen.queryByText("We couldn't load this page."),
    ).not.toBeInTheDocument();
  });
});

describe('ReceivedList, as a list', () => {
  beforeEach(() => {
    goTo('/brand-new-received?view=list');
  });

  it('draws a piece of Feedback as it reads on Home, the reader as you', () => {
    render(
      <ReceivedList initialPage={page([postcard('fb-1', 'First.')], null)} />,
    );

    expect(screen.getByRole('article')).toHaveTextContent(
      'Ben Carter gave feedback to you',
    );
    expect(screen.getByText('First.')).toBeInTheDocument();
  });

  it('draws an answer with what was asked', () => {
    render(
      <ReceivedList initialPage={page([answer('fb-1', 'Very clear.')])} />,
    );

    expect(screen.getByText('How clear was the plan?')).toBeInTheDocument();
    expect(screen.getByText('Very clear.')).toBeInTheDocument();
  });

  it('says when a piece was kept to the reader, which Home never holds', () => {
    render(
      <ReceivedList
        initialPage={page([postcard('fb-1', 'First.', 'ONLY_ME')])}
      />,
    );

    expect(screen.getByText('Only me')).toBeInTheDocument();
  });

  it('does not tell a Receiver of several that a private piece is theirs alone', () => {
    render(
      <ReceivedList
        initialPage={page([postcard('fb-1', 'First.', 'ONLY_ME', [ANN, BEN])])}
      />,
    );

    expect(screen.getByText("Only the people it's for")).toBeInTheDocument();
    expect(screen.queryByText('Only me')).not.toBeInTheDocument();
  });

  it('opens a postcard by address, and keeps the list under it', () => {
    render(
      <ReceivedList initialPage={page([postcard('fb-1', 'First.')], null)} />,
    );

    expect(screen.getByRole('link', { name: /Open postcard/ })).toHaveAttribute(
      'href',
      '/brand-new-received?view=list&feedback=fb-1',
    );
  });

  it('draws a Kudos as it reads on Home, opening on the same dialog', async () => {
    const user = userEvent.setup();
    render(<ReceivedList initialPage={page([kudos('ku-1', 'Well done.')])} />);

    await user.click(screen.getByRole('button', { name: 'View kudos' }));

    expect(
      screen.getByRole('dialog', { name: 'Kudos from Ben Carter' }),
    ).toBeInTheDocument();
  });

  it('keeps reading to the end', async () => {
    readNextReceivedPage.mockResolvedValue(page([postcard('fb-2', 'Second.')]));
    render(
      <ReceivedList
        initialPage={page([postcard('fb-1', 'First.')], 'cursor-1')}
      />,
    );

    await scrollToTheEnd();

    expect(screen.getAllByRole('article')).toHaveLength(2);
  });
});

describe('changing the view of ReceivedList', () => {
  it('keeps everything read so far, and reads nothing to do it', async () => {
    const user = userEvent.setup();
    readNextReceivedPage.mockResolvedValue(page([kudos('ku-2', 'Second.')]));
    const initialPage = page([postcard('fb-1', 'First.')], 'cursor-1');
    const received = () => (
      <>
        <ReceivedViewToggle />
        <ReceivedList initialPage={initialPage} />
      </>
    );
    const { rerender } = render(received());
    await scrollToTheEnd();

    await user.click(screen.getByRole('button', { name: 'List view' }));
    rerender(received());

    expect(window.location.search).toBe('?view=list');
    expect(screen.getByRole('button', { name: 'View kudos' })).toBeVisible();
    expect(screen.getAllByRole('article')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Grid view' }));
    rerender(received());

    expect(window.location.search).toBe('');
    expect(
      screen.queryByRole('button', { name: 'View kudos' }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(readNextReceivedPage).toHaveBeenCalledOnce();
  });
});
