import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));
vi.mock(
  '@/app/(signed-in)/(brand-new)/brand-new-received/_lib/received-items-actions.service',
  () => ({ readNextReceivedPage: vi.fn() }),
);
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
const MEMBERSHIP = {
  workspace: { id: WORKSPACE_ID, name: 'Acme' },
  role: 'MEMBER',
} as CurrentMembership;

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

    render(await ReceivedItems({ membership: MEMBERSHIP, show: 'all' }));

    expect(screen.getByText('No Feedback for you yet')).toBeInTheDocument();
    expect(
      screen.getByText(
        'When someone gives you feedback, you can read it here.',
      ),
    ).toBeInTheDocument();
  });

  it('draws what was written', async () => {
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

    render(await ReceivedItems({ membership: MEMBERSHIP, show: 'all' }));

    expect(
      screen.getByRole('button', { name: /^Kudos from Ben Carter/ }),
    ).toBeInTheDocument();
  });

  it('says so when the page could not be read, and reads it again when asked', async () => {
    const user = userEvent.setup();
    theApiAnswers({ code: 'INTERNAL' }, { status: 500 });

    render(await ReceivedItems({ membership: MEMBERSHIP, show: 'all' }));

    expect(screen.getByText("We couldn't load this page.")).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(refresh).toHaveBeenCalledOnce();
  });

  it.each([
    ['requests', "You haven't asked anyone yet."],
    ['offered', 'Nobody has given you feedback unasked yet.'],
    ['kudos', 'No Kudos for you yet.'],
  ] as const)(
    'says what is missing when narrowed to %s',
    async (show, title) => {
      theApiAnswers({ readerAccountId: READER, items: [], nextCursor: null });

      render(await ReceivedItems({ membership: MEMBERSHIP, show }));

      expect(screen.getByText(title)).toBeInTheDocument();
    },
  );

  it('draws a request in the list with every Ask, the answer opening its own postcard', async () => {
    address = new URLSearchParams({ view: 'list', show: 'requests' });
    theApiAnswers({
      readerAccountId: READER,
      items: [A_REQUEST],
      nextCursor: null,
    });

    render(await ReceivedItems({ membership: MEMBERSHIP, show: 'requests' }));

    expect(screen.getByText('You asked 2 people')).toBeInTheDocument();
    expect(screen.getByText('Selected people')).toBeInTheDocument();
    // The postcard sent back holds the question too, hidden from a screen reader.
    expect(
      screen.getAllByText('How did the demo land for you?')[0],
    ).toBeVisible();
    expect(screen.getByText('1 of 2 answered')).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: /^Open postcard: answer from Ben Carter/,
      }),
    ).toHaveAttribute(
      'href',
      `/brand-new-received?show=requests&view=list&feedback=${A_REQUEST.asked[0]?.answer?.id}`,
    );
    expect(screen.getByText('Cara Diaz (inactive)')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('draws a request nobody answered in the grid as a box that opens nothing', async () => {
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

    render(await ReceivedItems({ membership: MEMBERSHIP, show: 'all' }));

    expect(screen.getByText('0 of 2 answered')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
