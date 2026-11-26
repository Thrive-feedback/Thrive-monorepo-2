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
const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: (path: string) => revalidatePath(path),
}));
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Error(`redirected to ${to}`);
  },
}));

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const ONE_ON_ONE_ID = '0199a0f0-0000-7000-8000-0000000000b1';
const BEN = '0199a0f0-0000-7000-8000-00000000000b';

vi.mock('@/lib/session/session.service', () => ({
  requireMemberOf: async () => ({
    email: 'ann@acme.test',
    membership: {
      workspace: { id: WORKSPACE_ID, name: 'Acme' },
      role: 'MEMBER',
    },
  }),
}));

const {
  acceptOneOnOne,
  declineOneOnOne,
  inviteToOneOnOne,
  suggestAnotherTime,
} = await import(
  '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-actions.service'
);

const ONE_ON_ONES = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/one-on-ones`;
const ONE_ON_ONE = `${ONE_ON_ONES}/${ONE_ON_ONE_ID}`;

const WEEKLY = {
  cadence: 'WEEKLY',
  weekday: 4,
  startMinute: 600,
  lengthMinutes: 30,
  templateKey: 'weekly-check-in',
} as const;

/** Answers the route, keeping the body the API was given. */
function apiAccepts(
  method: 'post' | 'put',
  url: string,
  answer: () => Response,
): { body?: unknown } {
  const received: { body?: unknown } = {};
  server.use(
    http[method](url, async ({ request }) => {
      const text = await request.text();
      received.body = text === '' ? undefined : JSON.parse(text);
      return answer();
    }),
  );
  return received;
}

beforeEach(() => {
  revalidatePath.mockClear();
});

describe('answering and starting 1:1s', () => {
  it('invites without a note when none was written, and reads the page again', async () => {
    const received = apiAccepts('post', ONE_ON_ONES, () =>
      HttpResponse.json({ id: ONE_ON_ONE_ID }, { status: 201 }),
    );

    const result = await inviteToOneOnOne(WORKSPACE_ID, BEN, WEEKLY, '   ');

    expect(result).toEqual({ ok: true, id: ONE_ON_ONE_ID });
    expect(received.body).toEqual({ invitedAccountId: BEN, schedule: WEEKLY });
    expect(revalidatePath).toHaveBeenCalledWith('/one-on-ones');
  });

  it('sends nothing for a teammate id that is not one', async () => {
    const received = apiAccepts('post', ONE_ON_ONES, () =>
      HttpResponse.json({ id: ONE_ON_ONE_ID }, { status: 201 }),
    );

    const result = await inviteToOneOnOne(WORKSPACE_ID, 'ben', WEEKLY);

    expect(result.ok).toBe(false);
    expect(received.body).toBeUndefined();
  });

  it('sends another time back with its note', async () => {
    const received = apiAccepts(
      'post',
      `${ONE_ON_ONE}/suggest`,
      () => new HttpResponse(null, { status: 204 }),
    );

    const result = await suggestAnotherTime(
      WORKSPACE_ID,
      ONE_ON_ONE_ID,
      { ...WEEKLY, weekday: 2 },
      'Tuesdays suit me',
    );

    expect(result.ok).toBe(true);
    expect(received.body).toEqual({
      schedule: { ...WEEKLY, weekday: 2 },
      note: 'Tuesdays suit me',
    });
  });

  it('says plainly when the time an invitation was sent for has passed', async () => {
    server.use(
      http.post(`${ONE_ON_ONE}/accept`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'ONE_ON_ONE_TIME_PASSED',
              message: 'nope',
              correlationId: 'correlation-1',
            },
          },
          { status: 409 },
        ),
      ),
    );

    const result = await acceptOneOnOne(WORKSPACE_ID, ONE_ON_ONE_ID);

    expect(result).toEqual({
      ok: false,
      message:
        'The time it was sent for has passed. Decline or withdraw it, then create a new 1:1.',
      code: 'ONE_ON_ONE_TIME_PASSED',
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('declines with the note written for the sender', async () => {
    const received = apiAccepts(
      'post',
      `${ONE_ON_ONE}/decline`,
      () => new HttpResponse(null, { status: 204 }),
    );

    const result = await declineOneOnOne(
      WORKSPACE_ID,
      ONE_ON_ONE_ID,
      ' Not this month. ',
    );

    expect(result.ok).toBe(true);
    expect(received.body).toEqual({ note: 'Not this month.' });
  });
});
