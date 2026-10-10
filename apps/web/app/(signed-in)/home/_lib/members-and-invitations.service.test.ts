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

const { readMembersAndInvitations } = await import(
  './members-and-invitations.service'
);

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const WORKSPACE = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}`;
const PAGING = { total: 0, page: 1, pageSize: 100 };

function membershipAs(role: 'OWNER' | 'ADMIN' | 'MEMBER') {
  return { workspace: { id: WORKSPACE_ID, name: 'Acme' }, role } as const;
}

function apiHolds(seen: string[] = []) {
  server.use(
    http.get(`${WORKSPACE}/members`, ({ request }) => {
      seen.push(new URL(request.url).pathname);
      return HttpResponse.json({
        ...PAGING,
        items: [
          {
            accountId: '0199a0f0-0000-7000-8000-000000000001',
            email: 'ann@acme.test',
            fullName: 'Ann Lee',
            role: 'OWNER',
          },
          {
            accountId: '0199a0f0-0000-7000-8000-000000000002',
            email: 'ben@acme.test',
            fullName: null,
            role: 'MEMBER',
          },
        ],
      });
    }),
    http.get(`${WORKSPACE}/invitations`, ({ request }) => {
      seen.push(new URL(request.url).pathname);
      return HttpResponse.json({
        ...PAGING,
        items: [
          {
            invitationId: '0199a0f0-0000-7000-8000-000000000003',
            email: 'cat@acme.test',
            role: 'MEMBER',
            status: 'PENDING',
            expiresAt: '2026-10-17T03:00:00.000Z',
          },
        ],
      });
    }),
  );
}

describe('reading the Members and Invitations for Home', () => {
  it('lists the other Members, then the open Invitations, for the Owner', async () => {
    apiHolds();

    expect(
      await readMembersAndInvitations(membershipAs('OWNER'), 'ann@acme.test'),
    ).toEqual([
      {
        email: 'ben@acme.test',
        name: null,
        role: 'MEMBER',
        status: 'JOINED',
        invitationId: null,
      },
      {
        email: 'cat@acme.test',
        name: null,
        role: 'MEMBER',
        status: 'PENDING',
        invitationId: '0199a0f0-0000-7000-8000-000000000003',
      },
    ]);
  });

  it('does not ask for the Invitations for a Member with no management rights', async () => {
    const seen: string[] = [];
    apiHolds(seen);

    const teammates = await readMembersAndInvitations(
      membershipAs('MEMBER'),
      'ben@acme.test',
    );

    expect(seen).toEqual([`/v1/workspaces/${WORKSPACE_ID}/members`]);
    expect(teammates).toEqual([
      {
        email: 'ann@acme.test',
        name: 'Ann Lee',
        role: 'OWNER',
        status: 'JOINED',
        invitationId: null,
      },
    ]);
  });
});
