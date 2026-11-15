import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));
vi.mock(
  '@/app/(signed-in)/(sidebar)/profile/[slug]/_lib/profile-items-actions.service',
  () => ({ readNextProfilePage: vi.fn() }),
);
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  unstable_rethrow: vi.fn(),
}));

const { ProfileItems } = await import('./profile-items');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const READER = '0199a0f0-0000-7000-8000-00000000000a';
const BEN_ID = '0199a0f0-0000-7000-8000-00000000000b';
const MEMBERSHIP = {
  workspace: { id: WORKSPACE_ID, name: 'Acme' },
  role: 'MEMBER',
} as const;
const BEN = {
  accountId: BEN_ID,
  slug: 'ben',
  name: 'Ben',
  fullName: 'Ben Carter',
  email: 'ben@acme.test',
  photoUrl: null,
  role: 'MEMBER',
  isDeactivated: false,
  joinedAt: '2026-10-11T03:04:05.000Z',
} as const;

/** Answers the Profile's list, keeping what each call asked for. */
function theApiAnswers(body: object, init?: ResponseInit) {
  const asked: URL[] = [];
  server.use(
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/members/${BEN_ID}/profile-items`,
      ({ request }) => {
        asked.push(new URL(request.url));
        return HttpResponse.json(body, init);
      },
    ),
  );
  return asked;
}

const NOTHING = { readerAccountId: READER, items: [], nextCursor: null };

describe('ProfileItems', () => {
  it('asks for the list that is open', async () => {
    const asked = theApiAnswers(NOTHING);

    render(
      await ProfileItems({
        membership: MEMBERSHIP,
        profile: BEN,
        show: 'kudos',
      }),
    );

    expect(asked.map((url) => url.searchParams.get('show'))).toEqual(['KUDOS']);
  });

  it('says, of a teammate with no Feedback everyone reads, that it will show here', async () => {
    theApiAnswers(NOTHING);

    render(
      await ProfileItems({
        membership: MEMBERSHIP,
        profile: BEN,
        show: 'feedback',
      }),
    );

    expect(
      screen.getByRole('heading', {
        name: 'No feedback for Ben that everyone can read yet.',
      }),
    ).toBeInTheDocument();
  });

  it('tells the person, on their own, that the rest of their Feedback is in Received', async () => {
    theApiAnswers(NOTHING);

    render(
      await ProfileItems({
        membership: MEMBERSHIP,
        profile: BEN,
        show: 'feedback',
        isYou: true,
      }),
    );

    expect(
      screen.getByText(/The rest is in Received, for you\.$/),
    ).toBeInTheDocument();
  });

  it('asks for what was shared with the reader, and says when nothing has been', async () => {
    const asked = theApiAnswers(NOTHING);

    render(
      await ProfileItems({
        membership: MEMBERSHIP,
        profile: BEN,
        show: 'shared',
      }),
    );

    expect(asked.map((url) => url.searchParams.get('show'))).toEqual([
      'SHARED_WITH_ME',
    ]);
    expect(
      screen.getByRole('heading', {
        name: 'Nothing written to Ben has been shared with you.',
      }),
    ).toBeInTheDocument();
  });

  it('says when nobody has given them Kudos yet', async () => {
    theApiAnswers(NOTHING);

    render(
      await ProfileItems({
        membership: MEMBERSHIP,
        profile: BEN,
        show: 'kudos',
      }),
    );

    expect(
      screen.getByRole('heading', { name: 'No kudos for Ben yet.' }),
    ).toBeInTheDocument();
  });

  it('draws the Kudos that name them', async () => {
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
              accountId: BEN_ID,
              name: 'Ben',
              photoUrl: null,
              status: 'ACTIVE',
            },
          ],
          message: '@ben fixed the build.',
          tags: {
            workspaceGoals: [],
            mentions: [{ slug: 'ben', displayName: 'Ben' }],
          },
          card: null,
          createdAt: '2026-10-31T03:00:00.000Z',
        },
      ],
      nextCursor: null,
    });

    render(
      await ProfileItems({
        membership: MEMBERSHIP,
        profile: BEN,
        show: 'kudos',
      }),
    );

    expect(screen.getByRole('article')).toHaveTextContent(
      '@Ben fixed the build.',
    );
  });

  it('says so when the list could not be read', async () => {
    theApiAnswers({ code: 'INTERNAL' }, { status: 500 });

    render(
      await ProfileItems({
        membership: MEMBERSHIP,
        profile: BEN,
        show: 'feedback',
      }),
    );

    expect(screen.getByText("We couldn't load this page.")).toBeInTheDocument();
  });
});
