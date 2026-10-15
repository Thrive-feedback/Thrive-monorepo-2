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

const { readMembers } = await import('./members.service');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';

const ANN_PHOTO = 'https://lh3.googleusercontent.com/a/ann=s96-c';

describe('reading the Members for Members', () => {
  it('lists everyone in the Workspace, the person included, as them', async () => {
    const seen: Request[] = [];
    server.use(
      http.get(
        `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/members`,
        ({ request }) => {
          seen.push(request);
          return HttpResponse.json({
            total: 2,
            page: 1,
            pageSize: 100,
            items: [
              {
                accountId: '0199a0f0-0000-7000-8000-000000000001',
                email: 'ann@acme.test',
                fullName: 'Ann Lee',
                displayName: 'Ann',
                photoUrl: ANN_PHOTO,
                role: 'OWNER',
              },
              {
                accountId: '0199a0f0-0000-7000-8000-000000000002',
                email: 'ben@acme.test',
                fullName: null,
                displayName: null,
                photoUrl: null,
                role: 'MEMBER',
              },
            ],
          });
        },
      ),
    );

    expect(
      await readMembers({
        workspace: { id: WORKSPACE_ID, name: 'Acme' },
        role: 'MEMBER',
      }),
    ).toEqual([
      {
        accountId: '0199a0f0-0000-7000-8000-000000000001',
        email: 'ann@acme.test',
        name: 'Ann',
        photoUrl: ANN_PHOTO,
        role: 'OWNER',
      },
      {
        accountId: '0199a0f0-0000-7000-8000-000000000002',
        email: 'ben@acme.test',
        name: null,
        photoUrl: null,
        role: 'MEMBER',
      },
    ]);
    expect(seen[0]?.headers.get('cookie')).toContain(
      'thrive.session_token=abc',
    );
  });
});
