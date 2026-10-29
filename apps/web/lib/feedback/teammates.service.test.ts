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

const { readTeammates } = await import('./teammates.service');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const MEMBERSHIP = {
  workspace: { id: WORKSPACE_ID, name: 'Acme' },
  role: 'MEMBER',
} as const;
const PAGING = { total: 3, page: 1, pageSize: 100 };

function apiHolds(
  items: { accountId: string; email: string; fullName: string | null }[],
) {
  server.use(
    http.get(`${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/members`, () =>
      HttpResponse.json({
        ...PAGING,
        items: items.map((item) => ({ ...item, role: 'MEMBER' })),
      }),
    ),
  );
}

describe('reading who can be asked for Feedback', () => {
  it('offers the other Members of the Workspace, by the name on their Profile', async () => {
    apiHolds([
      { accountId: 'account-ann', email: 'ann@acme.test', fullName: 'Ann Lee' },
      {
        accountId: 'account-ben',
        email: 'ben@acme.test',
        fullName: 'Ben Carter',
      },
    ]);

    const teammates = await readTeammates(MEMBERSHIP, 'ann@acme.test');

    expect(teammates).toEqual([
      { accountId: 'account-ben', name: 'Ben Carter', email: 'ben@acme.test' },
    ]);
  });

  it('calls a Member by their email while they have not introduced themselves', async () => {
    apiHolds([
      { accountId: 'account-ben', email: 'ben@acme.test', fullName: null },
    ]);

    const teammates = await readTeammates(MEMBERSHIP, 'ann@acme.test');

    expect(teammates).toEqual([
      {
        accountId: 'account-ben',
        name: 'ben@acme.test',
        email: 'ben@acme.test',
      },
    ]);
  });

  it('leaves the person out of their own list, so nobody asks themselves', async () => {
    apiHolds([
      { accountId: 'account-ann', email: 'ann@acme.test', fullName: 'Ann Lee' },
    ]);

    expect(await readTeammates(MEMBERSHIP, 'ann@acme.test')).toEqual([]);
  });
});
