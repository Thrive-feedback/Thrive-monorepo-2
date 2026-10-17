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
  role: 'ADMIN',
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
  selectedPeople: { name: string | null; inactive: boolean }[],
): SentFeedbackRequest {
  return {
    id: REQUEST_ID,
    topic: 'my sprint review talk',
    asks: [
      {
        askId: 'ask-1',
        giverName: 'Ben Carter',
        giverInactive: false,
        status: 'PENDING',
        answer: null,
      },
    ],
    visibility: { value, selectedPeople },
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
          giverInactive: false,
          status: 'PENDING',
          answer: null,
        },
      ],
      visibility: { value: 'ONLY_ME', selectedPeople: [] },
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
        {
          askId: 'ask-1',
          giverName: null,
          giverInactive: false,
          status: 'ANSWERED',
          answer: null,
        },
      ],
      visibility: { value: 'ONLY_ME', selectedPeople: [] },
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
          giverInactive: false,
          status: 'ANSWERED',
          answer: 'You open strongly and lose the room at the detail.',
        },
      ],
      visibility: { value: 'ONLY_ME', selectedPeople: [] },
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
      waitingRequest('SELECTED_PEOPLE', [
        { name: 'Cara Diaz', inactive: false },
        { name: null, inactive: false },
      ]),
    );

    await renderDetail();

    expect(
      screen.getByText(
        'You and Cara Diaz and a teammate can read what they send back.',
      ),
    ).toBeInTheDocument();
  });

  it('shows a Giver and a selected person who were Deactivated as inactive', async () => {
    const request = waitingRequest('SELECTED_PEOPLE', [
      { name: 'Cara Diaz', inactive: true },
    ]);
    readFeedbackRequest.mockResolvedValue({
      ...request,
      asks: request.asks.map((ask) => ({ ...ask, giverInactive: true })),
    });

    await renderDetail();

    expect(screen.getByText('Ben Carter (inactive)')).toBeInTheDocument();
    expect(screen.getByText('Cara Diaz (inactive)')).toBeInTheDocument();
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
