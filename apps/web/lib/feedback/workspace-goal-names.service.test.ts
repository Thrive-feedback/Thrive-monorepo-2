/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs: in jsdom, MSW would keep a browser cookie jar
 * and send one test's cookies with the next test's requests.
 */
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));

const { readWorkspaceGoalNames } = await import(
  './workspace-goal-names.service'
);

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const MEMBERSHIP = {
  workspace: { id: WORKSPACE_ID, name: 'Acme' },
  role: 'ADMIN',
} as const;

describe('reading the Workspace Goals # offers', () => {
  it('offers the active ones by name, never one an Admin has hidden', async () => {
    server.use(
      http.get(
        `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/workspace-goals`,
        () =>
          HttpResponse.json({
            total: 3,
            page: 1,
            pageSize: 100,
            items: [
              {
                id: '0199a0f0-0000-7000-8000-0000000000g1',
                name: 'ownership',
                description: null,
                status: 'ACTIVE',
              },
              {
                id: '0199a0f0-0000-7000-8000-0000000000g2',
                name: 'ownershic',
                description: null,
                status: 'HIDDEN',
              },
              {
                id: '0199a0f0-0000-7000-8000-0000000000g3',
                name: 'ลูกค้ามาก่อน',
                description: 'ลูกค้าต้องมาก่อนเสมอ',
                status: 'ACTIVE',
              },
            ],
          }),
      ),
    );

    expect(await readWorkspaceGoalNames(MEMBERSHIP)).toEqual([
      'ownership',
      'ลูกค้ามาก่อน',
    ]);
  });
});
