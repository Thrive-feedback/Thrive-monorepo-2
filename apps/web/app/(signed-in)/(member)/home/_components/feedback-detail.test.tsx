import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { FeedItem } from '@/lib/feedback/feed-item.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { FeedbackDetail } from './feedback-detail';

const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000b1';

const readFeedback = vi.fn<() => Promise<FeedItem | null>>();
vi.mock('@/app/(signed-in)/(member)/home/_lib/feedback.service', () => ({
  readFeedback: () => readFeedback(),
}));

const MEMBERSHIP = {
  workspace: { id: '0199a0f0-0000-7000-8000-0000000000aa', name: 'Acme' },
  role: 'MEMBER',
} as const;

const FEEDBACK: FeedItem = {
  id: FEEDBACK_ID,
  giverName: 'Ann Lee',
  giverInactive: false,
  receiverName: 'Ben Ooi',
  receiverInactive: false,
  origin: 'OFFERED',
  message: 'You ran the planning meeting well',
  messageTags: NO_TEXT_TAGS,
  givenAt: '2026-10-13T03:00:00.000Z',
  reactions: {},
};

async function renderDetail() {
  render(
    await FeedbackDetail({ membership: MEMBERSHIP, feedbackId: FEEDBACK_ID }),
  );
}

describe('one piece of Feedback, open over Home', () => {
  it('shows who wrote it to whom and what it says', async () => {
    readFeedback.mockResolvedValue(FEEDBACK);

    await renderDetail();

    expect(screen.getByText(/Ann Lee/)).toBeInTheDocument();
    expect(screen.getByText(/Ben Ooi/)).toBeInTheDocument();
    expect(
      screen.getByText(/You ran the planning meeting well/),
    ).toBeInTheDocument();
  });

  it('says so in place when the person may not read it, rather than failing', async () => {
    readFeedback.mockResolvedValue(null);

    await renderDetail();

    expect(
      screen.getByText("This Feedback isn't here any more."),
    ).toBeInTheDocument();
  });
});
