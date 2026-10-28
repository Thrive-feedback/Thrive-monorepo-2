import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import type { WaitingAsk } from '@/lib/feedback/waiting-ask.type';
import { AnswerAskDetail } from './answer-ask-detail';

const ASK_ID = '0199a0f0-0000-7000-8000-0000000000a1';

const readFeedbackAsk = vi.fn<() => Promise<WaitingAsk | null>>();
vi.mock('@/app/(signed-in)/(member)/home/_lib/feedback-ask.service', () => ({
  readFeedbackAsk: () => readFeedbackAsk(),
}));
vi.mock('@/app/(signed-in)/(member)/home/_lib/teammates.service', () => ({
  readTeammates: async () => [],
}));
vi.mock(
  '@/app/(signed-in)/(member)/home/_lib/workspace-goal-names.service',
  () => ({ readWorkspaceGoalNames: async () => ['ownership'] }),
);
vi.mock(
  '@/app/(signed-in)/(member)/home/_lib/answer-ask-actions.service',
  () => ({
    answerAsk: vi.fn(),
  }),
);
const MEMBERSHIP = {
  workspace: { id: '0199a0f0-0000-7000-8000-0000000000aa', name: 'Acme' },
  role: 'MEMBER',
} as const;

async function renderDetail() {
  render(
    await AnswerAskDetail({
      membership: MEMBERSHIP,
      ownEmail: 'ben@acme.test',
      askId: ASK_ID,
    }),
  );
}

const WAITING: WaitingAsk = {
  askId: ASK_ID,
  feedbackRequestId: '0199a0f0-0000-7000-8000-0000000000f1',
  message: 'Running the planning meeting',
  messageTags: NO_TEXT_TAGS,
  requesterName: 'Ann Lee',
  requesterPhotoUrl: null,
  requesterInactive: false,
  status: 'PENDING',
  onWorkspaceFeed: false,
};

describe('an Ask, open over Home to be answered', () => {
  it('says who asked and what they asked, and offers the box', async () => {
    readFeedbackAsk.mockResolvedValue(WAITING);

    await renderDetail();

    expect(
      screen.getByRole('heading', {
        name: 'Ann Lee asked: Running the planning meeting',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /What would you tell Ann Lee\?/ }),
    ).toBeInTheDocument();
  });

  it('tells the Giver, before they write, that an answer shared with everyone goes on the Workspace feed', async () => {
    readFeedbackAsk.mockResolvedValue({ ...WAITING, onWorkspaceFeed: true });

    await renderDetail();

    expect(
      screen.getByText('Your answer goes on the Workspace feed.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Your name goes with what you write.'),
    ).toBeNull();
  });

  it('says nothing about who reads it when the answer is not going on the feed, only that it is signed', async () => {
    readFeedbackAsk.mockResolvedValue(WAITING);

    await renderDetail();

    expect(
      screen.getByText('Your name goes with what you write.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/can read/)).toBeNull();
    expect(
      screen.queryByText('Your answer goes on the Workspace feed.'),
    ).toBeNull();
  });

  it('offers no box once the Ask has been answered, because the first answer is final', async () => {
    readFeedbackAsk.mockResolvedValue({ ...WAITING, status: 'ANSWERED' });

    await renderDetail();

    expect(screen.queryByRole('textbox')).toBeNull();
    expect(
      screen.getByText(
        'You have already answered this. The first answer is the one that stands.',
      ),
    ).toBeInTheDocument();
  });

  it('calls a Requester without a name a teammate', async () => {
    readFeedbackAsk.mockResolvedValue({ ...WAITING, requesterName: null });

    await renderDetail();

    expect(
      screen.getByRole('heading', {
        name: 'A teammate asked: Running the planning meeting',
      }),
    ).toBeInTheDocument();
  });

  it('says so in the dialog when no such Ask is waiting for this person', async () => {
    readFeedbackAsk.mockResolvedValue(null);

    await renderDetail();

    expect(
      screen.getByText("This Ask isn't waiting for you."),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});
