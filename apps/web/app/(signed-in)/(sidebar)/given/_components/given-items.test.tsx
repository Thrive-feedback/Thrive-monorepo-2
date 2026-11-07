import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));
vi.mock(
  '@/app/(signed-in)/(brand-new)/given/_lib/given-items-actions.service',
  () => ({ readNextGivenPage: vi.fn() }),
);
// A server component that reads, which a client render cannot await: it has its own suite.
vi.mock('./given-empty', () => ({ GivenEmpty: () => <p>Nothing given</p> }));
const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
  useSearchParams: () => new URLSearchParams(),
  unstable_rethrow: vi.fn(),
}));

const { GivenItems } = await import('./given-items');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const READER = '0199a0f0-0000-7000-8000-00000000000a';
const SESSION = {
  membership: {
    workspace: { id: WORKSPACE_ID, name: 'Acme' },
    role: 'MEMBER',
  },
} as Parameters<typeof GivenItems>[0]['session'];

function theApiAnswers(body: object, init?: ResponseInit) {
  server.use(
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/given-items`,
      () => HttpResponse.json(body, init),
    ),
  );
}

describe('GivenItems', () => {
  it('offers a way to start when nothing has been written yet', async () => {
    theApiAnswers({ readerAccountId: READER, items: [], nextCursor: null });

    render(await GivenItems({ session: SESSION }));

    expect(screen.getByText('Nothing given')).toBeInTheDocument();
  });

  it('draws what was written, by who it was for', async () => {
    theApiAnswers({
      readerAccountId: READER,
      items: [
        {
          kind: 'KUDOS',
          id: '0199a0f0-0000-7000-8000-0000000000d1',
          giver: {
            accountId: READER,
            name: 'Ann Lee',
            photoUrl: null,
            status: 'ACTIVE',
          },
          recipients: [
            {
              accountId: '0199a0f0-0000-7000-8000-00000000000b',
              name: 'Ben Carter',
              photoUrl: null,
              status: 'ACTIVE',
            },
          ],
          message: 'Well done.',
          tags: { workspaceGoals: [], mentions: [] },
          card: null,
          createdAt: '2026-10-31T03:00:00.000Z',
        },
      ],
      nextCursor: null,
    });

    render(await GivenItems({ session: SESSION }));

    expect(
      screen.getByRole('button', { name: /^Kudos to Ben Carter/ }),
    ).toBeInTheDocument();
  });

  it('shows a card the person just sent, without a reload', async () => {
    const kudosSaying = (id: string, message: string) => ({
      kind: 'KUDOS',
      id,
      giver: {
        accountId: READER,
        name: 'Ann Lee',
        photoUrl: null,
        status: 'ACTIVE',
      },
      recipients: [],
      message,
      tags: { workspaceGoals: [], mentions: [] },
      card: null,
      createdAt: '2026-10-31T03:00:00.000Z',
    });
    const first = kudosSaying('0199a0f0-0000-7000-8000-0000000000d1', 'First.');
    theApiAnswers({
      readerAccountId: READER,
      items: [first],
      nextCursor: null,
    });
    const { rerender } = render(await GivenItems({ session: SESSION }));

    theApiAnswers({
      readerAccountId: READER,
      items: [
        kudosSaying('0199a0f0-0000-7000-8000-0000000000d2', 'Second.'),
        first,
      ],
      nextCursor: null,
    });
    rerender(await GivenItems({ session: SESSION }));

    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('says so when the page could not be read, and reads it again when asked', async () => {
    const user = userEvent.setup();
    theApiAnswers({ code: 'INTERNAL' }, { status: 500 });

    render(await GivenItems({ session: SESSION }));

    expect(screen.getByText("We couldn't load this page.")).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(refresh).toHaveBeenCalledOnce();
  });
});
