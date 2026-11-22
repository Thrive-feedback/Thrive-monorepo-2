/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs — see `teammates.service.test.ts`.
 */
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));

const { readHomeWeek } = await import('./home-week.service');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const DAYS = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/feed-items/days`;
const MEMBERSHIP = {
  workspace: { id: WORKSPACE_ID, name: 'Acme' },
  role: 'MEMBER',
} as const;

const none = { offeredFeedback: 0, requestedFeedback: 0, kudos: 0 };
const SEVEN_DAYS = [
  '2026-11-16',
  '2026-11-17',
  '2026-11-18',
  '2026-11-19',
  '2026-11-20',
  '2026-11-21',
  '2026-11-22',
].map((day) => ({ day, ...none }));

describe('readHomeWeek', () => {
  it('asks for the days under the filter shown, and says them in Home’s words', async () => {
    let asked: URL | undefined;
    server.use(
      http.get(DAYS, ({ request }) => {
        asked = new URL(request.url);
        return HttpResponse.json({
          days: SEVEN_DAYS.map((day) =>
            day.day === '2026-11-20'
              ? { ...day, offeredFeedback: 1, requestedFeedback: 2 }
              : day,
          ),
          totals: { offeredFeedback: 1, requestedFeedback: 2, kudos: 0 },
        });
      }),
    );

    const week = await readHomeWeek(MEMBERSHIP, 'shared');

    expect(asked?.searchParams.get('show')).toBe('SHARED_WITH_ME');
    expect(week.today).toBe('2026-11-22');
    expect(week.days[4]).toEqual({
      day: '2026-11-20',
      offered: 1,
      answers: 2,
      kudos: 0,
    });
    expect(week.totals).toEqual({ offered: 1, answers: 2, kudos: 0 });
    // Shared with me holds no Kudos, so nothing says how many.
    expect(week.countsKudos).toBe(false);
  });

  it('counts Kudos everywhere else', async () => {
    server.use(
      http.get(DAYS, () =>
        HttpResponse.json({ days: SEVEN_DAYS, totals: none }),
      ),
    );

    expect((await readHomeWeek(MEMBERSHIP, 'all')).countsKudos).toBe(true);
  });

  it('does not make up a today when the API counted no days', async () => {
    server.use(
      http.get(DAYS, () => HttpResponse.json({ days: [], totals: none })),
    );

    await expect(readHomeWeek(MEMBERSHIP, 'everyone')).rejects.toThrow(
      'The API counted no days of Home.',
    );
  });
});
