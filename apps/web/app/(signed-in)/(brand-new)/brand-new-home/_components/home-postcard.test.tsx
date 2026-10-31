import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
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
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Redirected(to);
  },
  useRouter: () => ({ replace }),
}));
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: { error: (...args: unknown[]) => toastError(...args) },
}));

const { HomePostcard } = await import('./home-postcard');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const READER = '0199a0f0-0000-7000-8000-00000000000a';
const BEN = '0199a0f0-0000-7000-8000-00000000000b';
const CARA = '0199a0f0-0000-7000-8000-00000000000c';
const ANN = '0199a0f0-0000-7000-8000-00000000000d';
const BENS_ANSWER = '0199a0f0-0000-7000-8000-0000000000d1';
const CARAS_ANSWER = '0199a0f0-0000-7000-8000-0000000000d2';
const MEMBERSHIP = {
  workspace: { id: WORKSPACE_ID, name: 'Acme' },
  role: 'MEMBER',
} as CurrentMembership;

const NO_TAGS = { workspaceGoals: [], mentions: [] };
const SENT_ON = '2026-10-31T03:00:00.000Z';

const person = (accountId: string, name: string) => ({
  accountId,
  name,
  photoUrl: null,
  status: 'ACTIVE',
});

const answer = (id: string, accountId: string, name: string) => ({
  id,
  giver: person(accountId, name),
  message: `Written by ${name}`,
  tags: NO_TAGS,
  postcard: null,
  answeredAt: SENT_ON,
});

const CARAS_CARD = {
  readerAccountId: READER,
  id: CARAS_ANSWER,
  origin: 'REQUESTED',
  feedbackRequestId: '0199a0f0-0000-7000-8000-0000000000f1',
  giver: person(CARA, 'Cara Diaz'),
  receivers: [person(ANN, 'Ann Lee')],
  message: 'Written by Cara Diaz',
  postcard: null,
  tags: NO_TAGS,
  createdAt: SENT_ON,
  request: {
    message: 'How clear was the plan?',
    tags: NO_TAGS,
    requester: person(ANN, 'Ann Lee'),
    postcard: null,
    answers: [
      answer(BENS_ANSWER, BEN, 'Ben Carter'),
      answer(CARAS_ANSWER, CARA, 'Cara Diaz'),
    ],
  },
};

function theApiAnswers(body: object, init?: ResponseInit) {
  server.use(
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/feedback/:feedbackId`,
      () => HttpResponse.json(body, init),
    ),
  );
}

beforeEach(() => {
  replace.mockClear();
  toastError.mockClear();
});

function reading(show: 'all' | 'shared' = 'all') {
  return HomePostcard({
    membership: MEMBERSHIP,
    feedbackId: CARAS_ANSWER,
    show,
  });
}

describe('HomePostcard', () => {
  it('opens at the answer of the card that was pressed, and pages to the others', async () => {
    theApiAnswers(CARAS_CARD);

    render(await reading());

    expect(
      screen.getByRole('dialog', { name: 'Feedback for Ann Lee' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Answer from Cara Diaz, 2 of 2',
    );
    expect(screen.getByRole('dialog')).toHaveTextContent(/From.*Ann Lee/);
    expect(screen.getByRole('dialog')).toHaveTextContent(/To.*Cara Diaz/);

    await userEvent.click(
      screen.getByRole('button', { name: 'Previous answer' }),
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'Answer from Ben Carter, 1 of 2',
    );
  });

  it('closes at once, back to the filter and the card it was opened from', async () => {
    theApiAnswers(CARAS_CARD);
    const link = <a href="#card">The card pressed</a>;
    const { rerender } = render(link);
    screen.getByRole('link', { name: 'The card pressed' }).focus();
    rerender(
      <>
        {link}
        {await reading('shared')}
      </>,
    );

    await userEvent.keyboard('{Escape}');

    // `replace` here never finishes, as a slow navigation would not.
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole('link', { name: 'The card pressed' }),
    ).toHaveFocus();
    expect(replace).toHaveBeenCalledExactlyOnceWith(
      ROUTES.brandNewHomeShowing('shared'),
      { scroll: false },
    );
  });

  it('opens again when the card is pressed before the close has landed', async () => {
    theApiAnswers(CARAS_CARD);
    const { rerender } = render(await reading());
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );

    rerender(await reading());

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('leaves the reader on Home when the postcard is not theirs to open', async () => {
    theApiAnswers({ code: 'FEEDBACK_NOT_FOUND' }, { status: 404 });

    await expect(reading('shared')).rejects.toEqual(
      new Redirected(ROUTES.brandNewHomeShowing('shared')),
    );
  });

  it('says so and stays on Home when the postcard could not be read', async () => {
    theApiAnswers({ code: 'INTERNAL' }, { status: 500 });

    render(await reading('shared'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(toastError).toHaveBeenCalledExactlyOnceWith(
      "Couldn't open this postcard. Try again.",
      expect.anything(),
    );
    expect(replace).toHaveBeenCalledExactlyOnceWith(
      ROUTES.brandNewHomeShowing('shared'),
      { scroll: false },
    );
  });
});
