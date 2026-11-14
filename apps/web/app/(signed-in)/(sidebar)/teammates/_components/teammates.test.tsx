import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
// A card is sent by a server action, which is the network for a page: nothing here sends one.
vi.mock(
  '@/app/(signed-in)/(sidebar)/_lib/send-postcard-actions.service',
  () => ({
    sendPostcardFeedback: vi.fn(),
    sendPostcardRequest: vi.fn(),
    sendKudosCard: vi.fn(),
  }),
);

const { Teammates } = await import('./teammates');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';

function sessionAs(role: 'ADMIN' | 'MEMBER') {
  return {
    membership: { workspace: { id: WORKSPACE_ID, name: 'Acme' }, role },
    email: 'ann@acme.test',
    name: 'Ann Lee',
    photoUrl: null,
    profile: { fullName: 'Ann Lee', displayName: 'Ann', slug: 'ann' },
  } as Parameters<typeof Teammates>[0]['session'];
}

/** The Workspace holds these people, the person signed in among them, and no Workspace Goals. */
function theWorkspaceHolds(
  people: { accountId: string; email: string; fullName: string | null }[],
) {
  server.use(
    http.get(`${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/members`, () =>
      HttpResponse.json({
        total: people.length,
        page: 1,
        pageSize: 100,
        items: people.map((person) => ({
          ...person,
          role: 'MEMBER',
          photoUrl: null,
          slug: person.fullName?.split(' ')[0]?.toLowerCase() ?? null,
          displayName: person.fullName?.split(' ')[0] ?? null,
        })),
      }),
    ),
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/workspace-goals`,
      () => HttpResponse.json({ total: 0, page: 1, pageSize: 100, items: [] }),
    ),
  );
}

describe('Teammates', () => {
  it('lists everyone in the Workspace, the person signed in marked You with nothing to write', async () => {
    theWorkspaceHolds([
      { accountId: 'ann', email: 'ann@acme.test', fullName: 'Ann Lee' },
      { accountId: 'mali', email: 'mali@acme.test', fullName: 'Mali Sombat' },
    ]);

    render(await Teammates({ session: sessionAs('MEMBER') }));

    expect(
      screen.getByRole('button', { name: 'Give Mali Sombat feedback' }),
    ).toBeVisible();
    expect(screen.getByText('Ann Lee')).toBeVisible();
    expect(screen.getByText('You')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Give Ann Lee feedback' }),
    ).not.toBeInTheDocument();
  });

  it('points an Admin alone in the Workspace to inviting people', async () => {
    theWorkspaceHolds([
      { accountId: 'ann', email: 'ann@acme.test', fullName: 'Ann Lee' },
    ]);

    render(await Teammates({ session: sessionAs('ADMIN') }));

    expect(screen.getByRole('link', { name: 'Invite people' })).toBeVisible();
  });
});
