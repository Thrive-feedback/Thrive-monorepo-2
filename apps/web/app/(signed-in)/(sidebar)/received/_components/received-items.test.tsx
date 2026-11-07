import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';
import { PAST_THE_DRAWING } from '@/lib/test/past-the-drawing';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));
vi.mock(
  '@/app/(signed-in)/(sidebar)/received/_lib/received-items-actions.service',
  () => ({ readNextReceivedPage: vi.fn() }),
);
// An empty Received is an async server component of its own, which the runner cannot render inside
// this one (FE_14); its own suite covers what it says and offers, so here it only says which it is.
vi.mock('./received-empty', () => ({
  ReceivedEmpty: ({ show }: { show: string }) => <p>Empty: {show}</p>,
}));
const refresh = vi.fn();
let address = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
  useSearchParams: () => address,
  unstable_rethrow: vi.fn(),
}));

beforeEach(() => {
  address = new URLSearchParams();
});

const { ReceivedItems } = await import('./received-items');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const READER = '0199a0f0-0000-7000-8000-00000000000a';
const BEN = '0199a0f0-0000-7000-8000-00000000000b';
const CARA = '0199a0f0-0000-7000-8000-00000000000c';
const NO_TAGS = { workspaceGoals: [], mentions: [] };

function person(accountId: string, name: string, status = 'ACTIVE') {
  return { accountId, name, photoUrl: null, status };
}

/** Ann asked Ben and Cara; Ben answered, Cara has been Deactivated without answering. */
const A_REQUEST = {
  kind: 'REQUEST',
  id: '0199a0f0-0000-7000-8000-0000000000r1',
  message: 'How did the demo land for you?',
  tags: NO_TAGS,
  visibility: 'SELECTED_PEOPLE',
  requester: person(READER, 'Ann Lee'),
  selectedPeople: [person(BEN, 'Ben Carter')],
  postcard: null,
  createdAt: '2026-10-30T03:00:00.000Z',
  latestActivityAt: '2026-10-31T03:00:00.000Z',
  asked: [
    {
      person: person(BEN, 'Ben Carter'),
      status: 'ANSWERED',
      answer: {
        id: '0199a0f0-0000-7000-8000-0000000000a1',
        message: 'The pacing was right.',
        tags: NO_TAGS,
        postcard: null,
        answeredAt: '2026-10-31T03:00:00.000Z',
      },
    },
    {
      person: person(CARA, 'Cara Diaz', 'DEACTIVATED'),
      status: 'PENDING',
      answer: null,
    },
  ],
};
const SESSION = {
  email: 'ann@acme.test',
  photoUrl: null,
  profile: { displayName: 'Ann' },
  membership: {
    workspace: { id: WORKSPACE_ID, name: 'Acme' },
    role: 'MEMBER',
  } as CurrentMembership,
} as Parameters<typeof ReceivedItems>[0]['session'];

function theApiAnswers(body: object, init?: ResponseInit) {
  server.use(
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/received-items`,
      () => HttpResponse.json(body, init),
    ),
  );
}

describe('ReceivedItems', () => {
  it('says what will be here when nothing has been written yet', async () => {
    theApiAnswers({ readerAccountId: READER, items: [], nextCursor: null });

    render(await ReceivedItems({ session: SESSION, show: 'all' }));

    expect(screen.getByText('Empty: all')).toBeInTheDocument();
  });

  it('draws what was written', async () => {
    address = new URLSearchParams({ view: 'grid' });
    theApiAnswers({
      readerAccountId: READER,
      items: [
        {
          kind: 'KUDOS',
          id: '0199a0f0-0000-7000-8000-0000000000d1',
          giver: {
            accountId: '0199a0f0-0000-7000-8000-00000000000b',
            name: 'Ben Carter',
            photoUrl: null,
            status: 'ACTIVE',
          },
          recipients: [],
          message: 'Well done.',
          tags: { workspaceGoals: [], mentions: [] },
          card: null,
          createdAt: '2026-10-31T03:00:00.000Z',
        },
      ],
      nextCursor: null,
    });

    render(await ReceivedItems({ session: SESSION, show: 'all' }));

    expect(
      screen.getByRole('button', { name: /^Kudos from Ben Carter/ }),
    ).toBeInTheDocument();
  });

  it('says so when the page could not be read, and reads it again when asked', async () => {
    const user = userEvent.setup();
    theApiAnswers({ code: 'INTERNAL' }, { status: 500 });

    render(await ReceivedItems({ session: SESSION, show: 'all' }));

    expect(screen.getByText("We couldn't load this page.")).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(refresh).toHaveBeenCalledOnce();
  });

  it.each(['requests', 'offered', 'kudos'] as const)(
    'says what is missing when narrowed to %s',
    async (show) => {
      theApiAnswers({ readerAccountId: READER, items: [], nextCursor: null });

      render(await ReceivedItems({ session: SESSION, show }));

      expect(screen.getByText(`Empty: ${show}`)).toBeInTheDocument();
    },
  );

  it('draws a request in the list with every Ask, the answer opening its own postcard', async () => {
    address = new URLSearchParams({ view: 'list', show: 'requests' });
    theApiAnswers({
      readerAccountId: READER,
      items: [A_REQUEST],
      nextCursor: null,
    });

    render(await ReceivedItems({ session: SESSION, show: 'requests' }));

    expect(
      screen.getByRole('button', { name: /Show who you asked/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('Selected people')).toBeInTheDocument();
    // The postcard sent back holds the question too, hidden from a screen reader.
    expect(
      screen.getAllByText('How did the demo land for you?')[0],
    ).toBeVisible();
    expect(
      screen.getByRole('link', {
        name: /^Open postcard: answer from Ben Carter/,
      }),
    ).toHaveAttribute(
      'href',
      `/received?show=requests&feedback=${A_REQUEST.asked[0]?.answer?.id}`,
    );
    expect(screen.getByText('Cara Diaz (inactive)')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('draws a request nobody answered in the grid as a box that opens nothing', async () => {
    address = new URLSearchParams({ view: 'grid' });
    theApiAnswers({
      readerAccountId: READER,
      items: [
        {
          ...A_REQUEST,
          latestActivityAt: A_REQUEST.createdAt,
          asked: A_REQUEST.asked.map((ask) => ({
            ...ask,
            status: 'PENDING',
            answer: null,
          })),
        },
      ],
      nextCursor: null,
    });

    render(await ReceivedItems({ session: SESSION, show: 'all' }));

    expect(screen.getByText('0 of 2 answered')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  describe('a request of its own in the list', () => {
    const DAN = '0199a0f0-0000-7000-8000-00000000000d';
    const EVE = '0199a0f0-0000-7000-8000-00000000000e';
    const FAY = '0199a0f0-0000-7000-8000-00000000000f';

    function answered(accountId: string, name: string, id: string, at: string) {
      return {
        person: person(accountId, name),
        status: 'ANSWERED',
        answer: {
          id,
          message: `${name} says it landed.`,
          tags: NO_TAGS,
          postcard: null,
          answeredAt: at,
        },
      };
    }

    function waitingOn(accountId: string, name: string) {
      return {
        person: person(accountId, name),
        status: 'PENDING',
        answer: null,
      };
    }

    /** Ben answered first and Dan last; Fay and Eve, asked in that order, have not answered. */
    const MANY_ASKED = {
      ...A_REQUEST,
      asked: [
        answered(
          BEN,
          'Ben Carter',
          '0199a0f0-0000-7000-8000-0000000000a1',
          '2026-10-31T03:00:00.000Z',
        ),
        waitingOn(FAY, 'Fay Ito'),
        answered(
          DAN,
          'Dan Moss',
          '0199a0f0-0000-7000-8000-0000000000a2',
          '2026-11-01T03:00:00.000Z',
        ),
        waitingOn(EVE, 'Eve Park'),
      ],
    };

    async function drawTheList(request: object) {
      address = new URLSearchParams({ view: 'list', show: 'requests' });
      theApiAnswers({
        readerAccountId: READER,
        items: [request],
        nextCursor: null,
      });
      render(await ReceivedItems({ session: SESSION, show: 'requests' }));
      return within(screen.getByRole('article'));
    }

    it("names it as the reader's own request", async () => {
      const card = await drawTheList(MANY_ASKED);

      expect(card.getByText('Your request', PAST_THE_DRAWING)).toBeVisible();
    });

    it('gives each answer its own postcard, newest first, each opening that answer', async () => {
      const card = await drawTheList(MANY_ASKED);

      const postcards = card.getAllByRole('link', {
        name: /^Open postcard: answer from/,
      });
      expect(postcards).toHaveLength(2);
      expect(postcards[0]).toHaveAccessibleName(
        /^Open postcard: answer from Dan Moss/,
      );
      expect(postcards[0]).toHaveAttribute(
        'href',
        '/received?show=requests&feedback=0199a0f0-0000-7000-8000-0000000000a2',
      );
      expect(postcards[1]).toHaveAccessibleName(
        /^Open postcard: answer from Ben Carter/,
      );
      expect(postcards[1]).toHaveAttribute(
        'href',
        '/received?show=requests&feedback=0199a0f0-0000-7000-8000-0000000000a1',
      );
    });

    it("points at every answer's postcard by hand on a phone, and only the newest one beside the words", async () => {
      const card = await drawTheList(MANY_ASKED);

      const notes = card.getAllByText('Read their postcards');
      expect(notes).toHaveLength(2);
      const newest = card
        .getByRole('link', { name: /^Open postcard: answer from Dan Moss/ })
        .closest('li');
      const [first, second] = notes.map((note) =>
        note.closest<HTMLElement>('[aria-hidden="true"]'),
      );
      expect(newest).toContainElement(first ?? null);
      expect(first).not.toHaveClass('md:hidden');
      expect(second).toHaveClass('md:hidden');
    });

    it('says nothing of how many answered, which the faces already show', async () => {
      const card = await drawTheList(MANY_ASKED);

      expect(card.queryByText(/of \d+ answered/)).not.toBeInTheDocument();
    });

    it('puts everyone still to answer together after the answers, by name', async () => {
      const card = await drawTheList(MANY_ASKED);

      const rows = within(card.getByRole('list', { name: 'Asked' }))
        .getAllByText(
          /^(Ben Carter|Dan Moss|Eve Park|Fay Ito)$/,
          PAST_THE_DRAWING,
        )
        .map((name) => name.textContent);
      expect(rows).toEqual(['Dan Moss', 'Ben Carter', 'Eve Park', 'Fay Ito']);
    });

    it('draws a request nobody answered beside its own card, with nothing to open and no note', async () => {
      const card = await drawTheList({
        ...MANY_ASKED,
        asked: [waitingOn(FAY, 'Fay Ito'), waitingOn(EVE, 'Eve Park')],
      });

      expect(card.queryByRole('link')).not.toBeInTheDocument();
      expect(card.queryByText('Read their postcards')).not.toBeInTheDocument();
    });
  });
});
