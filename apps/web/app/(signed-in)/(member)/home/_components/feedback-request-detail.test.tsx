import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SentFeedbackRequest } from '@/app/(signed-in)/(member)/home/_lib/feedback-request.service';
import { FeedbackRequestDetail } from './feedback-request-detail';

const REQUEST_ID = '0199a0f0-0000-7000-8000-0000000000f1';

const readFeedbackRequest = vi.fn<() => Promise<SentFeedbackRequest | null>>();
vi.mock(
  '@/app/(signed-in)/(member)/home/_lib/feedback-request.service',
  () => ({
    readFeedbackRequest: () => readFeedbackRequest(),
  }),
);
const MEMBERSHIP = {
  workspace: { id: '0199a0f0-0000-7000-8000-0000000000aa', name: 'Acme' },
  role: 'OWNER',
} as const;

async function renderDetail() {
  render(
    await FeedbackRequestDetail({
      membership: MEMBERSHIP,
      requestId: REQUEST_ID,
    }),
  );
}

function waitingRequest(
  value: 'ONLY_ME' | 'SELECTED_PEOPLE' | 'EVERYONE',
  selectedNames: (string | null)[],
): SentFeedbackRequest {
  return {
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
    visibility: { value, selectedNames },
  };
}

describe('a sent Feedback Request, open over Home', () => {
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
      visibility: { value: 'ONLY_ME', selectedNames: [] },
    });

    await renderDetail();

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
      visibility: { value: 'ONLY_ME', selectedNames: [] },
    });

    await renderDetail();

    expect(
      screen.getByRole('heading', {
        name: 'You asked a teammate about my sprint review talk',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Now answered.')).toBeInTheDocument();
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
      visibility: { value: 'ONLY_ME', selectedNames: [] },
    });

    await renderDetail();

    expect(
      screen.getByText('You open strongly and lose the room at the detail.'),
    ).toBeInTheDocument();
  });

  it('says the Requester alone reads what comes back', async () => {
    readFeedbackRequest.mockResolvedValue(waitingRequest('ONLY_ME', []));

    await renderDetail();

    expect(
      screen.getByText('Only you can read what they send back.'),
    ).toBeInTheDocument();
  });

  it('names the people the Requester shared the answers with', async () => {
    readFeedbackRequest.mockResolvedValue(
      waitingRequest('SELECTED_PEOPLE', ['Cara Diaz', null]),
    );

    await renderDetail();

    expect(
      screen.getByText(
        'You and Cara Diaz and a teammate can read what they send back.',
      ),
    ).toBeInTheDocument();
  });

  it('says everyone in the Workspace reads what comes back', async () => {
    readFeedbackRequest.mockResolvedValue(waitingRequest('EVERYONE', []));

    await renderDetail();

    expect(
      screen.getByText(
        'Everyone in your Workspace can read what they send back.',
      ),
    ).toBeInTheDocument();
  });

  it('says so in the dialog when the Workspace has no such request', async () => {
    readFeedbackRequest.mockResolvedValue(null);

    await renderDetail();

    expect(
      screen.getByText("This request isn't here any more."),
    ).toBeInTheDocument();
  });
});
