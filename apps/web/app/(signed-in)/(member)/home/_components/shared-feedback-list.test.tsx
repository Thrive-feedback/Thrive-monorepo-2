import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { SharedFeedbackList } from './shared-feedback-list';

const readSharedFeedback = vi.fn();
vi.mock('@/app/(signed-in)/(member)/home/_lib/shared-feedback.service', () => ({
  readSharedFeedback: (...args: unknown[]) => readSharedFeedback(...args),
}));

const MEMBERSHIP = {
  workspace: { id: 'w-1', name: 'Acme Corp' },
  role: 'MEMBER',
} as const;

const ONE_PIECE = {
  id: 'fb-1',
  giverName: 'Ben Carter',
  receiverName: 'Cara Diaz',
  origin: 'OFFERED' as const,
  topic: 'the customer demo',
  topicTags: NO_TEXT_TAGS,
  body: 'You kept the room with you.',
  bodyTags: NO_TEXT_TAGS,
  givenAt: '2026-10-12T03:00:00.000Z',
  reactions: {},
};

async function renderList() {
  render(await SharedFeedbackList({ membership: MEMBERSHIP }));
}

describe('SharedFeedbackList', () => {
  it('reads what was shared inside the person’s own Workspace', async () => {
    readSharedFeedback.mockResolvedValue([]);

    await renderList();

    expect(readSharedFeedback).toHaveBeenCalledWith(MEMBERSHIP);
  });

  it('names both people, so the reader knows who it is about', async () => {
    readSharedFeedback.mockResolvedValue([ONE_PIECE]);

    await renderList();

    expect(
      screen.getByRole('heading', { name: 'the customer demo' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ben Carter/)).toBeInTheDocument();
    expect(screen.getByText(/Cara Diaz/)).toBeInTheDocument();
    expect(screen.getByText('You kept the room with you.')).toBeInTheDocument();
    expect(
      screen.getByText('12 Oct 2026', { exact: false }),
    ).toBeInTheDocument();
  });

  it('calls somebody with no Profile a teammate rather than leaving a gap', async () => {
    readSharedFeedback.mockResolvedValue([
      { ...ONE_PIECE, giverName: null, receiverName: null },
    ]);

    await renderList();

    expect(screen.getByText(/A teammate/)).toBeInTheDocument();
  });

  it('says what the tab is for when nothing has been shared', async () => {
    readSharedFeedback.mockResolvedValue([]);

    await renderList();

    expect(
      screen.getByText('Nobody has shared Feedback with you yet.'),
    ).toBeInTheDocument();
  });

  it('does not call it preview data, because it is real', async () => {
    readSharedFeedback.mockResolvedValue([ONE_PIECE]);

    await renderList();

    expect(screen.queryByText(/Preview data/)).not.toBeInTheDocument();
  });
});
