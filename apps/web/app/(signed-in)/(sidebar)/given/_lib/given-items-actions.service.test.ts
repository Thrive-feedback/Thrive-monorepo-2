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

const { readNextGivenPage } = await import('./given-items-actions.service');

const GIVEN_ITEMS = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/given-items`;

const A_KUDOS = {
  kind: 'KUDOS',
  id: '0199a0f0-0000-7000-8000-0000000000d1',
  giver: {
    accountId: BEN,
    name: 'Ben Carter',
    photoUrl: null,
    status: 'ACTIVE',
  },
  recipients: [
    { accountId: ANN, name: 'Ann Lee', photoUrl: null, status: 'ACTIVE' },
  ],
  message: 'Well done.',
  tags: { workspaceGoals: [], mentions: [] },
  card: null,
  createdAt: '2026-10-31T03:00:00.000Z',
};

beforeEach(() => {
  readCurrentMembership.mockResolvedValue({
    workspace: { id: WORKSPACE_ID, name: 'Acme' },
    role: 'MEMBER',
  });
});

describe('readNextGivenPage', () => {
  it('reads the page after the cursor, in the Workspace of the session', async () => {
    let asked: URL | undefined;
    server.use(
      http.get(GIVEN_ITEMS, ({ request }) => {
        asked = new URL(request.url);
        return HttpResponse.json({
          readerAccountId: ANN,
          items: [A_KUDOS],
          nextCursor: 'cursor-2',
        });
      }),
    );

    const page = await readNextGivenPage({ cursor: 'cursor-1' });

    expect(asked?.searchParams.get('cursor')).toBe('cursor-1');
    expect(page?.nextCursor).toBe('cursor-2');
    expect(page?.items.map((item) => item.id)).toEqual([A_KUDOS.id]);
  });

  it.each([
    ['nothing', undefined],
    ['no cursor', {}],
    ['an empty cursor', { cursor: '' }],
    ['a cursor that is no string', { cursor: 7 }],
  ])('reads nothing from %s', async (_case, input) => {
    let wasAsked = false;
    server.use(
      http.get(GIVEN_ITEMS, () => {
        wasAsked = true;
        return HttpResponse.json({});
      }),
    );

    expect(await readNextGivenPage(input)).toBeNull();
    expect(wasAsked).toBe(false);
  });

  it('sends somebody signed out to sign in', async () => {
    readCurrentMembership.mockResolvedValue(null);

    await expect(readNextGivenPage({ cursor: 'cursor-1' })).rejects.toEqual(
      new Redirected('/signin'),
    );
  });

  it('answers null when the API refuses, so the list can offer to try again', async () => {
    server.use(
      http.get(GIVEN_ITEMS, () =>
        HttpResponse.json({ code: 'INTERNAL' }, { status: 500 }),
      ),
    );

    expect(await readNextGivenPage({ cursor: 'cursor-1' })).toBeNull();
  });
});
