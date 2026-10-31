import { render as draw, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PLAIN_POSTCARD } from '@/app/(signed-in)/(brand-new)/_lib/plain-postcard.constant';
import { Toaster } from '@/components/atoms/toaster';
import type { PostcardAsk } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { ROUTES } from '@/lib/routes.constant';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));

const replace = vi.fn();
const refresh = vi.fn();
// One router for the whole page, as Next hands out.
const ROUTER = { replace, refresh };
vi.mock('next/navigation', () => ({
  unstable_rethrow: () => {},
  useRouter: () => ROUTER,
}));
const sendPostcardAnswer = vi.fn();
vi.mock(
  '@/app/(signed-in)/(brand-new)/_lib/send-postcard-actions.service',
  () => ({
    sendPostcardAnswer: (...args: unknown[]) => sendPostcardAnswer(...args),
  }),
);
vi.mock(
  '@/app/(signed-in)/(brand-new)/brand-new-waiting/_lib/waiting-asks-actions.service',
  () => ({ readNextWaitingAsks: vi.fn() }),
);

const { AnsweredAsksProvider } = await import('./answered-asks');
const { WaitingAskList } = await import('./waiting-ask-list');
const { WAITING_HEADING_ID } = await import('./waiting-heading.constant');
const { WaitingPostcard } = await import('./waiting-postcard');
const { WaitingPostcardDialog } = await import('./waiting-postcard-dialog');
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

const NOBODY_TO_NAME = { items: [], page: 1, pageSize: 100, total: 0 };

function theApiAnswers(body: object, init?: ResponseInit) {
  server.use(
    http.get(`${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/members`, () =>
      HttpResponse.json(NOBODY_TO_NAME),
    ),
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/workspace-goals`,
      () => HttpResponse.json(NOBODY_TO_NAME),
    ),
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/feedback-asks/:askId`,
      () => HttpResponse.json(body, init),
    ),
  );
}

const render = (opened: React.ReactNode) =>
  draw(
    <>
      {opened}
      <Toaster />
    </>,
  );

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
    expect(
      await screen.findByText('Answer sent.', undefined, AFTER_THE_FLIGHT),
    ).toBeInTheDocument();
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

    expect(
      await screen.findByText(
        "You've already answered this request.",
        undefined,
        AFTER_THE_FLIGHT,
      ),
    ).toBeInTheDocument();
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

    expect(
      await screen.findByText(
        "We couldn't send your answer. Please try again.",
        undefined,
        AFTER_THE_FLIGHT,
      ),
    ).toBeInTheDocument();
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

    render(await opening());

    await waitFor(() =>
      expect(replace).toHaveBeenCalledExactlyOnceWith(
        ROUTES.brandNewWaitingSorted('oldest'),
        { scroll: false },
      ),
    );
    expect(refresh).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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

    render(await opening());

    await waitFor(() =>
      expect(replace).toHaveBeenCalledExactlyOnceWith(
        ROUTES.brandNewWaitingSorted('oldest'),
        { scroll: false },
      ),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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
    expect(
      await screen.findByText("Couldn't open this postcard. Try again."),
    ).toBeInTheDocument();
    expect(replace).toHaveBeenCalledExactlyOnceWith(
      ROUTES.brandNewWaitingSorted('oldest'),
      {
        scroll: false,
      },
    );
  });

  describe('over the list it was opened from', () => {
    const ASK_ON_THE_CARD: PostcardAsk = {
      ...PLAIN_POSTCARD,
      requester: { name: 'Ann Lee', photoUrl: null },
      message: 'How clear was the plan?',
    };

    const card = (askId: string, requesterName: string): MyAsk => ({
      askId,
      message: `Asked by ${requesterName}`,
      messageTags: NO_TEXT_TAGS,
      requesterName,
      requesterPhotoUrl: null,
      requesterInactive: false,
      askedAt: '2026-10-31T03:00:00.000Z',
      status: 'PENDING',
    });

    function drawThePage() {
      return (
        <AnsweredAsksProvider>
          <h1 id={WAITING_HEADING_ID} tabIndex={-1}>
            Waiting for me
          </h1>
          <WaitingAskList
            initialPage={{
              items: [card(ASK_ID, 'Ann'), card('a-2', 'Ben')],
              nextCursor: null,
            }}
            sort="newest"
          />
          <WaitingPostcardDialog
            workspaceId={WORKSPACE_ID}
            askId={ASK_ID}
            closeHref={ROUTES.brandNewWaiting}
            ask={ASK_ON_THE_CARD}
            writer={{ name: 'Dao', photoUrl: null }}
            teammates={[]}
            workspaceGoals={[]}
          />
        </AnsweredAsksProvider>
      );
    }

    function theListWith(opened?: React.ReactNode) {
      return (
        <AnsweredAsksProvider>
          <h1 id={WAITING_HEADING_ID} tabIndex={-1}>
            Waiting for me
          </h1>
          <WaitingAskList
            initialPage={{
              items: [card(ASK_ID, 'Ann'), card('a-2', 'Ben')],
              nextCursor: null,
            }}
            sort="oldest"
          />
          {opened}
        </AnsweredAsksProvider>
      );
    }

    it('takes a card out when it turns out to have been answered elsewhere, with the cursor on the title', async () => {
      theApiAnswers({ ...AN_ASK, status: 'ANSWERED' });
      const opened = await opening();
      const { rerender } = draw(theListWith());
      screen
        .getByRole('link', { name: /^Answer in the postcard: Ann/ })
        .focus();

      rerender(theListWith(opened));

      await waitFor(() =>
        expect(screen.queryByText('Asked by Ann')).not.toBeInTheDocument(),
      );
      expect(screen.getByText('Asked by Ben')).toBeInTheDocument();
      expect(screen.getByRole('heading')).toHaveFocus();
    });

    it('takes no cursor to the title when the address opened it and nothing has one', async () => {
      theApiAnswers({ ...AN_ASK, status: 'ANSWERED' });

      draw(theListWith(await opening()));

      await waitFor(() =>
        expect(screen.queryByText('Asked by Ann')).not.toBeInTheDocument(),
      );
      expect(screen.getByRole('heading')).not.toHaveFocus();
    });

    it('takes the answered card out once it has flown, with the cursor on the title', async () => {
      render(drawThePage());

      await writeAnAnswer();

      expect(screen.getByText('Asked by Ann')).toBeInTheDocument();
      await waitFor(
        () =>
          expect(screen.queryByText('Asked by Ann')).not.toBeInTheDocument(),
        AFTER_THE_FLIGHT,
      );
      expect(screen.getByText('Asked by Ben')).toBeInTheDocument();
      await waitFor(
        () => expect(screen.getByRole('heading')).toHaveFocus(),
        AFTER_THE_FLIGHT,
      );
      expect(refresh).toHaveBeenCalledOnce();
    });

    it('still takes the card out when the person leaves in flight', async () => {
      const { unmount } = render(drawThePage());
      await writeAnAnswer();
      await waitFor(
        () => expect(sendPostcardAnswer).toHaveBeenCalledOnce(),
        AFTER_THE_FLIGHT,
      );
      await screen.findByText('Answer sent.', undefined, AFTER_THE_FLIGHT);

      unmount();

      expect(refresh).toHaveBeenCalledOnce();
    });

    it('still takes the card out when the person leaves while it is being sent', async () => {
      let answerGoes = (_outcome: object) => {};
      sendPostcardAnswer.mockReturnValue(
        new Promise((resolve) => {
          answerGoes = resolve;
        }),
      );
      const { unmount } = render(drawThePage());
      await writeAnAnswer();
      await waitFor(
        () => expect(sendPostcardAnswer).toHaveBeenCalledOnce(),
        AFTER_THE_FLIGHT,
      );

      unmount();
      expect(refresh).not.toHaveBeenCalled();
      answerGoes({});

      await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    });

    it('sends the cursor back to the card when closed unsent', async () => {
      render(drawThePage());
      await screen.findByRole('dialog', { name: 'Answer' });

      await userEvent.click(screen.getByRole('button', { name: 'Close' }));
      await userEvent.click(
        await screen.findByRole('button', { name: 'Close' }),
      );

      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
      expect(screen.getByText('Asked by Ann')).toBeInTheDocument();
      expect(refresh).not.toHaveBeenCalled();
    });
  });
});
