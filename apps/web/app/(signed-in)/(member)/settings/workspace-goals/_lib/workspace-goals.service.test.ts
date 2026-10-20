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

const { readWorkspaceGoals } = await import('./workspace-goals.service');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';

describe('reading the Workspace Goals for Settings', () => {
  it("reads the person's own Workspace, as them, as the API orders them", async () => {
    const seen: Request[] = [];
    server.use(
      http.get(
        `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/workspace-goals`,
        ({ request }) => {
          seen.push(request);
          return HttpResponse.json({
            items: [
              {
                id: '0199a0f0-0000-7000-8000-000000000007',
                name: 'ownership',
                description: 'We finish what we start.',
                status: 'ACTIVE',
              },
              {
                id: '0199a0f0-0000-7000-8000-000000000008',
                name: 'ownershic',
                description: null,
                status: 'HIDDEN',
              },
            ],
            total: 2,
            page: 1,
            pageSize: 100,
          });
        },
      ),
    );

    const workspaceGoals = await readWorkspaceGoals({
      workspace: { id: WORKSPACE_ID, name: 'Acme' },
      role: 'ADMIN',
    });

    expect(workspaceGoals).toEqual([
      {
        id: '0199a0f0-0000-7000-8000-000000000007',
        name: 'ownership',
        description: 'We finish what we start.',
        status: 'ACTIVE',
      },
      {
        id: '0199a0f0-0000-7000-8000-000000000008',
        name: 'ownershic',
        description: null,
        status: 'HIDDEN',
      },
    ]);
    expect(seen[0]?.headers.get('cookie')).toContain(
      'thrive.session_token=abc',
    );
  });
});
