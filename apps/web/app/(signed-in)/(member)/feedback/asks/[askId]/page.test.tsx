import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { WaitingAsk } from './_lib/feedback-ask.service';

const ASK_ID = '0199a0f0-0000-7000-8000-0000000000a1';

const readFeedbackAsk = vi.fn<() => Promise<WaitingAsk | null>>();
vi.mock('./_lib/feedback-ask.service', () => ({
  readFeedbackAsk: () => readFeedbackAsk(),
}));
vi.mock('./_lib/answer-ask-actions.service', () => ({ answerAsk: vi.fn() }));
vi.mock('@/lib/session/session.service', () => ({
  requireMember: async () => ({
    email: 'ben@acme.test',
    membership: {
      workspace: { id: '0199a0f0-0000-7000-8000-0000000000aa', name: 'Acme' },
      role: 'MEMBER',
    },
  }),
}));

/** `notFound` works by throwing, so the fake does too. */
class NotFound extends Error {}
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new NotFound('not found');
  },
}));

const { default: AnswerAskPage } = await import('./page');

function params(askId = ASK_ID) {
  return { params: Promise.resolve({ askId }) };
}

const WAITING: WaitingAsk = {
  askId: ASK_ID,
  feedbackRequestId: '0199a0f0-0000-7000-8000-0000000000f1',
  topic: 'Running the planning meeting',
  requesterName: 'Ann Lee',
  status: 'PENDING',
};

describe('the page where an Ask is answered', () => {
  it('says who asked and about what, and offers the box', async () => {
    readFeedbackAsk.mockResolvedValue(WAITING);

    render(await AnswerAskPage(params()));

    expect(
      screen.getByRole('heading', {
        name: 'Ann Lee asked about Running the planning meeting',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /What would you tell Ann Lee\?/ }),
    ).toBeInTheDocument();
  });

  it('offers no box once the Ask has been answered, because the first answer is final', async () => {
    readFeedbackAsk.mockResolvedValue({ ...WAITING, status: 'ANSWERED' });

    render(await AnswerAskPage(params()));

    expect(screen.queryByRole('textbox')).toBeNull();
    expect(
      screen.getByText(
        'You have already answered this. The first answer is the one that stands.',
      ),
    ).toBeInTheDocument();
  });

  it('calls a Requester without a name a teammate', async () => {
    readFeedbackAsk.mockResolvedValue({ ...WAITING, requesterName: null });

    render(await AnswerAskPage(params()));

    expect(
      screen.getByRole('heading', {
        name: 'A teammate asked about Running the planning meeting',
      }),
    ).toBeInTheDocument();
  });

  it('is not found when no such Ask is waiting for this person', async () => {
    readFeedbackAsk.mockResolvedValue(null);

    await expect(AnswerAskPage(params())).rejects.toThrow(NotFound);
  });

  it('is not found for a segment that is not an id at all', async () => {
    readFeedbackAsk.mockResolvedValue(WAITING);

    await expect(AnswerAskPage(params('not-an-id'))).rejects.toThrow(NotFound);
    expect(readFeedbackAsk).not.toHaveBeenCalled();
  });
});
