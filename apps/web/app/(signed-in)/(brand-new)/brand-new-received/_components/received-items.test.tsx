import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));
vi.mock(
  '@/app/(signed-in)/(brand-new)/brand-new-received/_lib/received-items-actions.service',
  () => ({ readNextReceivedPage: vi.fn() }),
);
const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
  useSearchParams: () => new URLSearchParams(),
  unstable_rethrow: vi.fn(),
}));

const { ReceivedItems } = await import('./received-items');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const READER = '0199a0f0-0000-7000-8000-00000000000a';
const MEMBERSHIP = {
  workspace: { id: WORKSPACE_ID, name: 'Acme' },
  role: 'MEMBER',
} as CurrentMembership;

function theApiAnswers(body: object, init?: ResponseInit) {
  server.use(
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/received-items`,
      () => HttpResponse.json(body, init),
    ),
  );
}

describe('ReceivedItems', () => {
  it('says what will be here when nothing has been written yet', async () => {
    theApiAnswers({ readerAccountId: READER, items: [], nextCursor: null });

    render(await ReceivedItems({ membership: MEMBERSHIP }));

    expect(screen.getByText('No Feedback for you yet')).toBeInTheDocument();
    expect(
      screen.getByText(
        'When someone gives you feedback, you can read it here.',
      ),
    ).toBeInTheDocument();
  });

  it('draws what was written', async () => {
    theApiAnswers({
      readerAccountId: READER,
      items: [
        {
          kind: 'KUDOS',
          id: '0199a0f0-0000-7000-8000-0000000000d1',
          giver: {
            accountId: '0199a0f0-0000-7000-8000-00000000000b',
            name: 'Ben Carter',
            photoUrl: null,
            status: 'ACTIVE',
          },
          recipients: [],
          message: 'Well done.',
          tags: { workspaceGoals: [], mentions: [] },
          card: null,
          createdAt: '2026-10-31T03:00:00.000Z',
        },
      ],
      nextCursor: null,
    });

    render(await ReceivedItems({ membership: MEMBERSHIP }));

    expect(
      screen.getByRole('button', { name: /^Kudos from Ben Carter/ }),
    ).toBeInTheDocument();
  });

  it('says so when the page could not be read, and reads it again when asked', async () => {
    const user = userEvent.setup();
    theApiAnswers({ code: 'INTERNAL' }, { status: 500 });

    render(await ReceivedItems({ membership: MEMBERSHIP }));

    expect(screen.getByText("We couldn't load this page.")).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(refresh).toHaveBeenCalledOnce();
  });
});
