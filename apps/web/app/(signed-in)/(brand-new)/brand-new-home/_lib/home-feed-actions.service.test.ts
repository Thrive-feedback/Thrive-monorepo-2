/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs — see `teammates.service.test.ts`.
 */
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const ANN = '0199a0f0-0000-7000-8000-00000000000a';
const BEN = '0199a0f0-0000-7000-8000-00000000000b';
const CARA = '0199a0f0-0000-7000-8000-00000000000c';

const readCurrentMembership = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  readCurrentMembership: () => readCurrentMembership(),
}));

/** `redirect` works by throwing, so the fake does too, carrying where it went. */
class Redirected extends Error {
  constructor(readonly to: string) {
    super(`redirected to ${to}`);
  }
}
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Redirected(to);
  },
}));

const { readNextHomeFeedPage } = await import('./home-feed-actions.service');

const FEED_ITEMS = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/feed-items`;

const person = (accountId: string, name: string) => ({
  accountId,
  name,
  photoUrl: null,
  status: 'ACTIVE',
});

const AN_ANSWER = {
  id: '0199a0f0-0000-7000-8000-0000000000d1',
  origin: 'REQUESTED',
  feedbackRequestId: '0199a0f0-0000-7000-8000-0000000000f1',
  giver: person(BEN, 'Ben Carter'),
  receivers: [person(CARA, 'Cara Diaz')],
  message: 'The order of the steps was clear.',
  tags: { workspaceGoals: [], mentions: [] },
  createdAt: '2026-10-31T03:00:00.000Z',
  visibility: 'SELECTED_PEOPLE',
  request: {
    message: 'How clear was the plan?',
    tags: { workspaceGoals: [], mentions: [] },
    requester: person(CARA, 'Cara Diaz'),
    asked: [
      {
        person: person(BEN, 'Ben Carter'),
        status: 'ANSWERED',
        answer: {
          message: 'The order of the steps was clear.',
          tags: { workspaceGoals: [], mentions: [] },
          answeredAt: '2026-10-31T03:00:00.000Z',
        },
      },
      { person: person(CARA, 'Cara Diaz'), status: 'PENDING', answer: null },
    ],
  },
};

beforeEach(() => {
  readCurrentMembership.mockResolvedValue({
    workspace: { id: WORKSPACE_ID, name: 'Acme' },
    role: 'MEMBER',
  });
});

describe('readNextHomeFeedPage', () => {
  it('asks for the page after the cursor, under the choice it was given', async () => {
    let asked: URL | undefined;
    server.use(
      http.get(FEED_ITEMS, ({ request }) => {
        asked = new URL(request.url);
        return HttpResponse.json({
          readerAccountId: ANN,
          items: [],
          nextCursor: null,
        });
      }),
    );

    await readNextHomeFeedPage({ show: 'shared', cursor: 'cursor-1' });

    expect(asked?.searchParams.get('show')).toBe('SHARED_WITH_ME');
    expect(asked?.searchParams.get('cursor')).toBe('cursor-1');
    expect(asked?.searchParams.get('limit')).toBe('20');
  });

  it('hands back each piece as a card shows it', async () => {
    server.use(
      http.get(FEED_ITEMS, () =>
        HttpResponse.json({
          readerAccountId: ANN,
          items: [AN_ANSWER],
          nextCursor: 'cursor-2',
        }),
      ),
    );

    const page = await readNextHomeFeedPage({
      show: 'all',
      cursor: 'cursor-1',
    });

    expect(page?.readerAccountId).toBe(ANN);
    expect(page?.nextCursor).toBe('cursor-2');
    expect(page?.items[0]).toEqual({
      id: AN_ANSWER.id,
      origin: 'REQUESTED',
      giver: {
        accountId: BEN,
        name: 'Ben Carter',
        photoUrl: null,
        inactive: false,
      },
      receivers: [
        {
          accountId: CARA,
          name: 'Cara Diaz',
          photoUrl: null,
          inactive: false,
        },
      ],
      message: AN_ANSWER.message,
      messageTags: AN_ANSWER.tags,
      givenAt: AN_ANSWER.createdAt,
      visibility: 'SELECTED_PEOPLE',
      request: {
        message: 'How clear was the plan?',
        messageTags: AN_ANSWER.request.tags,
        requester: {
          accountId: CARA,
          name: 'Cara Diaz',
          photoUrl: null,
          inactive: false,
        },
        asked: [
          {
            person: {
              accountId: BEN,
              name: 'Ben Carter',
              photoUrl: null,
              inactive: false,
            },
            status: 'ANSWERED',
            answer: {
              message: 'The order of the steps was clear.',
              messageTags: AN_ANSWER.tags,
            },
          },
          {
            person: {
              accountId: CARA,
              name: 'Cara Diaz',
              photoUrl: null,
              inactive: false,
            },
            status: 'PENDING',
            answer: null,
          },
        ],
      },
    });
  });

  it.each([
    [{ show: 'mine', cursor: 'cursor-1' }],
    [{ show: 'all', cursor: '' }],
    [{ show: 'all' }],
    ['nonsense'],
  ])(
    'reads nothing for what the page could not have sent: %j',
    async (input) => {
      expect(await readNextHomeFeedPage(input)).toBeNull();
      expect(readCurrentMembership).not.toHaveBeenCalled();
    },
  );

  it('answers null when the API refuses, so the list can offer to try again', async () => {
    server.use(
      http.get(FEED_ITEMS, () =>
        HttpResponse.json(
          { error: { code: 'REQUEST_INVALID', message: 'Not a cursor.' } },
          { status: 400 },
        ),
      ),
    );

    expect(
      await readNextHomeFeedPage({ show: 'all', cursor: 'cursor-1' }),
    ).toBeNull();
  });

  it('sends somebody whose session has gone to sign in', async () => {
    readCurrentMembership.mockResolvedValue(null);

    await expect(
      readNextHomeFeedPage({ show: 'all', cursor: 'cursor-1' }),
    ).rejects.toMatchObject({ to: '/signin' });
  });
});
