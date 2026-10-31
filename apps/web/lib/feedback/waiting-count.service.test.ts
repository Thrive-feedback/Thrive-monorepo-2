/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs — see `teammates.service.test.ts`.
 */
import { HttpResponse, http } from 'msw';
import { expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));

const { readWaitingCount } = await import('./waiting-count.service');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';

it('counts every Ask waiting, not only the one it reads', async () => {
  let asked: URL | undefined;
  server.use(
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/feedback-asks`,
      ({ request }) => {
        asked = new URL(request.url);
        return HttpResponse.json({
          items: [],
          page: 1,
          pageSize: 1,
          total: 12,
        });
      },
    ),
  );

  const count = await readWaitingCount({
    workspace: { id: WORKSPACE_ID, name: 'Acme' },
    role: 'MEMBER',
  });

  expect(count).toBe(12);
  expect(asked?.searchParams.get('status')).toBe('PENDING');
  expect(asked?.searchParams.get('pageSize')).toBe('1');
});
