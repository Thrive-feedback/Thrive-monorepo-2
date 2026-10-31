import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '@/lib/routes.constant';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));

/** `redirect` works by throwing, so the fake does too, carrying where it went. */
class Redirected extends Error {
  constructor(readonly to: string) {
    super(`redirected to ${to}`);
  }
}
const replace = vi.fn();
const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Redirected(to);
  },
  unstable_rethrow: () => {},
  useRouter: () => ({ replace, refresh }),
}));
const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
    success: (...args: unknown[]) => toastSuccess(...args),
  },
}));
const sendPostcardAnswer = vi.fn();
vi.mock(
  '@/app/(signed-in)/(brand-new)/_lib/send-postcard-actions.service',
  () => ({
    sendPostcardAnswer: (...args: unknown[]) => sendPostcardAnswer(...args),
  }),
);
vi.mock('@/lib/feedback/teammates.service', () => ({
  readTeammates: async () => [],
}));
vi.mock('@/lib/feedback/workspace-goal-names.service', () => ({
  readWorkspaceGoalNames: async () => [],
}));

const { WaitingPostcard } = await import('./waiting-postcard');
// Its code arrives on its own, which can outlast a test in a busy run if the first opening fetches it.
await import('@/components/organisms/postcard-dialog/postcard-dialog');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const ASK_ID = '0199a0f0-0000-7000-8000-0000000000a1';
const NO_TAGS = { workspaceGoals: [], mentions: [] };
const SESSION = {
  membership: { workspace: { id: WORKSPACE_ID, name: 'Acme' }, role: 'MEMBER' },
  email: 'dao@acme.test',
  photoUrl: null,
  profile: { fullName: 'Dao Prasert', displayName: 'Dao', slug: 'dao' },
} as Parameters<typeof WaitingPostcard>[0]['session'];

const AN_ASK = {
  askId: ASK_ID,
  feedbackRequestId: '0199a0f0-0000-7000-8000-0000000000f1',
  message: 'How clear was the plan?',
  tags: NO_TAGS,
  requester: {
    accountId: 'ann',
    name: 'Ann Lee',
    photoUrl: null,
    status: 'ACTIVE',
  },
  status: 'PENDING',
  createdAt: '2026-10-31T03:00:00.000Z',
  onWorkspaceFeed: true,
  postcard: null,
};

function theApiAnswers(body: object, init?: ResponseInit) {
  server.use(
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/feedback-asks/:askId`,
      () => HttpResponse.json(body, init),
    ),
  );
}

const opening = () =>
  WaitingPostcard({ session: SESSION, askId: ASK_ID, sort: 'oldest' });

/** The card flies off before the dialog closes, which takes longer in a busy run. */
const AFTER_THE_FLIGHT = { timeout: 5000 };

async function writeAnAnswer() {
  await userEvent.type(
    await screen.findByRole('textbox', { name: 'Your answer' }),
    'The order was clear.',
  );
  await userEvent.keyboard('{Escape}');
  await userEvent.click(
    await screen.findByRole('button', { name: 'Send answer' }),
  );
}

beforeEach(() => {
  replace.mockClear();
  refresh.mockClear();
  toastError.mockClear();
  toastSuccess.mockClear();
  sendPostcardAnswer.mockReset().mockResolvedValue({});
});

describe('WaitingPostcard', () => {
  it('opens the card the Ask was written on, with the question on it', async () => {
    theApiAnswers(AN_ASK);

    render(await opening());

    expect(
      await screen.findByRole('dialog', { name: 'Answer' }),
    ).toHaveTextContent('How clear was the plan?');
    expect(screen.getByRole('dialog')).toHaveTextContent(/From.*Ann Lee/);
    expect(screen.getByRole('dialog')).toHaveTextContent(/To.*Dao/);
  });

  it('never says who else can read the answer', async () => {
    theApiAnswers(AN_ASK);

    render(await opening());

    expect(await screen.findByRole('dialog')).not.toHaveTextContent(
      /everyone|selected|workspace feed/i,
    );
  });

  it('sends the answer, says so, and takes the list with it once it has gone', async () => {
    theApiAnswers(AN_ASK);
    render(await opening());

    await writeAnAnswer();

    await waitFor(
      () =>
        expect(sendPostcardAnswer).toHaveBeenCalledExactlyOnceWith(
          WORKSPACE_ID,
          ASK_ID,
          expect.objectContaining({ message: 'The order was clear.' }),
        ),
      AFTER_THE_FLIGHT,
    );
    await waitFor(
      () => expect(toastSuccess).toHaveBeenCalledWith('Answer sent.'),
      AFTER_THE_FLIGHT,
    );
    await waitFor(
      () =>
        expect(replace).toHaveBeenCalledExactlyOnceWith(
          ROUTES.brandNewWaitingSorted('oldest'),
          { scroll: false },
        ),
      AFTER_THE_FLIGHT,
    );
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('stays open with the answer on it when it did not go', async () => {
    theApiAnswers(AN_ASK);
    sendPostcardAnswer.mockResolvedValue({
      formError: "You've already answered this request.",
    });
    render(await opening());

    await writeAnAnswer();

    await waitFor(
      () =>
        expect(toastError).toHaveBeenCalledWith(
          "You've already answered this request.",
        ),
      AFTER_THE_FLIGHT,
    );
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'The order was clear.',
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it('keeps the writer on their card when the send fails outright', async () => {
    theApiAnswers(AN_ASK);
    sendPostcardAnswer.mockRejectedValue(new Error('The network went away.'));
    render(await opening());

    await writeAnAnswer();

    await waitFor(
      () =>
        expect(toastError).toHaveBeenCalledWith(
          "We couldn't send your answer. Please try again.",
        ),
      AFTER_THE_FLIGHT,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('asks before closing, and closing unsent leaves the list as it was', async () => {
    theApiAnswers(AN_ASK);
    render(await opening());
    await screen.findByRole('dialog', { name: 'Answer' });

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }));

    await waitFor(() =>
      expect(replace).toHaveBeenCalledExactlyOnceWith(
        ROUTES.brandNewWaitingSorted('oldest'),
        {
          scroll: false,
        },
      ),
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it('leaves the person on the list when the Ask was answered already', async () => {
    theApiAnswers({ ...AN_ASK, status: 'ANSWERED' });

    await expect(opening()).rejects.toThrow(
      new Redirected(ROUTES.brandNewWaitingSorted('oldest')),
    );
  });

  it('leaves the person on the list when the Ask is not theirs', async () => {
    theApiAnswers(
      {
        error: {
          code: 'FEEDBACK_ASK_NOT_FOUND',
          message: 'nope',
          correlationId: 'correlation-1',
        },
      },
      { status: 404 },
    );

    await expect(opening()).rejects.toThrow(
      new Redirected(ROUTES.brandNewWaitingSorted('oldest')),
    );
  });

  it('says so when the Ask could not be read', async () => {
    theApiAnswers(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'nope',
          correlationId: 'correlation-1',
        },
      },
      { status: 500 },
    );

    render(await opening());

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(toastError).toHaveBeenCalledExactlyOnceWith(
      "Couldn't open this postcard. Try again.",
      expect.anything(),
    );
    expect(replace).toHaveBeenCalledExactlyOnceWith(
      ROUTES.brandNewWaitingSorted('oldest'),
      {
        scroll: false,
      },
    );
  });
});
