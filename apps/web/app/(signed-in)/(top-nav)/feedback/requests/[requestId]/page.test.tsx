import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SentFeedbackRequest } from './_lib/feedback-request.service';

const REQUEST_ID = '0199a0f0-0000-7000-8000-0000000000f1';

const readFeedbackRequest = vi.fn<() => Promise<SentFeedbackRequest | null>>();
vi.mock('./_lib/feedback-request.service', () => ({
  readFeedbackRequest: () => readFeedbackRequest(),
}));
vi.mock('@/lib/session/session.service', () => ({
  requireMember: async () => ({
    email: 'ann@acme.test',
    membership: {
      workspace: { id: '0199a0f0-0000-7000-8000-0000000000aa', name: 'Acme' },
      role: 'OWNER',
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

const { default: FeedbackRequestPage } = await import('./page');

function params(requestId = REQUEST_ID) {
  return { params: Promise.resolve({ requestId }) };
}

describe('the page showing a sent Feedback Request', () => {
  it('names who was asked, the Topic, and that it is waiting', async () => {
    readFeedbackRequest.mockResolvedValue({
      id: REQUEST_ID,
      topic: 'my sprint review talk',
      asks: [
        {
          askId: 'ask-1',
          giverName: 'Ben Carter',
          status: 'PENDING',
          answer: null,
        },
      ],
    });

    render(await FeedbackRequestPage(params()));

    expect(
      screen.getByRole('heading', {
        name: 'You asked Ben Carter about my sprint review talk',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Now waiting for their answer.'),
    ).toBeInTheDocument();
  });

  it('calls an unintroduced Giver a teammate rather than nobody', async () => {
    readFeedbackRequest.mockResolvedValue({
      id: REQUEST_ID,
      topic: 'my sprint review talk',
      asks: [
        { askId: 'ask-1', giverName: null, status: 'ANSWERED', answer: null },
      ],
    });

    render(await FeedbackRequestPage(params()));

    expect(
      screen.getByRole('heading', {
        name: 'You asked a teammate about my sprint review talk',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Now answered.')).toBeInTheDocument();
  });

  it('offers a way to ask somebody else', async () => {
    readFeedbackRequest.mockResolvedValue({
      id: REQUEST_ID,
      topic: 'my sprint review talk',
      asks: [
        {
          askId: 'ask-1',
          giverName: 'Ben Carter',
          status: 'PENDING',
          answer: null,
        },
      ],
    });

    render(await FeedbackRequestPage(params()));

    expect(
      screen.getByRole('link', { name: 'Ask someone else' }),
    ).toHaveAttribute('href', '/home');
  });

  it('shows what the Giver wrote, once they have written it', async () => {
    readFeedbackRequest.mockResolvedValue({
      id: REQUEST_ID,
      topic: 'my sprint review talk',
      asks: [
        {
          askId: 'ask-1',
          giverName: 'Ben Carter',
          status: 'ANSWERED',
          answer: 'You open strongly and lose the room at the detail.',
        },
      ],
    });

    render(await FeedbackRequestPage(params()));

    expect(
      screen.getByText('You open strongly and lose the room at the detail.'),
    ).toBeInTheDocument();
  });

  it('is not found when the Workspace has no such request', async () => {
    readFeedbackRequest.mockResolvedValue(null);

    await expect(FeedbackRequestPage(params())).rejects.toThrow(NotFound);
  });

  it('is not found when the id in the path is not an id at all', async () => {
    await expect(FeedbackRequestPage(params('nonsense'))).rejects.toThrow(
      NotFound,
    );
    expect(readFeedbackRequest).not.toHaveBeenCalled();
  });
});
