import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { FeedItem } from '@/lib/feedback/feed-item.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { ReceivedFeedbackList } from './received-feedback-list';

const readReceivedFeedback = vi.fn();
vi.mock(
  '@/app/(signed-in)/(member)/home/_lib/received-feedback.service',
  () => ({
    readReceivedFeedback: (...args: unknown[]) => readReceivedFeedback(...args),
  }),
);

const MEMBERSHIP = {
  workspace: { id: 'w-1', name: 'Acme Corp' },
  role: 'MEMBER',
} as const;

const YOU = { name: 'Ann Lee', photoUrl: null, inactive: false, isYou: true };
const person = (name: string) => ({
  name,
  photoUrl: null,
  inactive: false,
  isYou: false,
});

const AN_ANSWER: FeedItem = {
  id: 'fb-1',
  giverName: 'Ben Carter',
  giverPhotoUrl: null,
  giverInactive: false,
  giverIsYou: false,
  receivers: [YOU],
  origin: 'REQUESTED',
  message: 'You open strongly and lose the room at the detail.',
  messageTags: NO_TEXT_TAGS,
  givenAt: '2026-10-11T03:00:00.000Z',
  reactions: {},
  request: {
    message: 'How did the planning meeting go?',
    messageTags: NO_TEXT_TAGS,
    requester: YOU,
    asked: [person('Ben Carter'), person('Cara Diaz')],
  },
};

async function renderList() {
  render(await ReceivedFeedbackList({ membership: MEMBERSHIP }));
}

describe('ReceivedFeedbackList', () => {
  it('reads the Feedback of the person’s own Workspace', async () => {
    readReceivedFeedback.mockResolvedValue([]);

    await renderList();

    expect(readReceivedFeedback).toHaveBeenCalledWith(MEMBERSHIP);
  });

  it('draws each piece as the feed does: who wrote it to you, the kind and the day', async () => {
    readReceivedFeedback.mockResolvedValue([AN_ANSWER]);

    await renderList();

    const card = screen.getByRole('article');
    expect(within(card).getByText('Ben Carter')).toBeInTheDocument();
    expect(within(card).getByText('you')).toBeInTheDocument();
    expect(within(card).getByText('Requested')).toBeInTheDocument();
    expect(within(card).getByText('11 Oct 2026')).toBeInTheDocument();
    expect(
      within(card).getByText(
        'You open strongly and lose the room at the detail.',
      ),
    ).toBeInTheDocument();
  });

  it('says an answer responds to the reader’s own request, naming everyone they asked', async () => {
    readReceivedFeedback.mockResolvedValue([AN_ANSWER]);

    await renderList();

    expect(screen.getByRole('article')).toHaveTextContent(
      'In answer to your request to Ben Carter and Cara Diaz: How did the planning meeting go?',
    );
  });

  it('names you first among several, and the others behind their faces', async () => {
    readReceivedFeedback.mockResolvedValue([
      {
        ...AN_ANSWER,
        origin: 'OFFERED',
        receivers: [YOU, person('Cara Diaz'), person('Dan Ooi')],
        request: null,
      },
    ]);

    await renderList();

    const card = screen.getByRole('article');
    expect(within(card).getByText('Offered')).toBeInTheDocument();
    expect(
      within(card).getByRole('button', {
        name: 'Cara Diaz and Dan Ooi. Show who it is for',
      }),
    ).toBeInTheDocument();
    expect(card).not.toHaveTextContent('In answer to');
  });

  it('lets the reader react, as on the feed', async () => {
    readReceivedFeedback.mockResolvedValue([AN_ANSWER]);

    await renderList();

    expect(
      within(screen.getByRole('article')).getAllByRole('button', {
        name: /, 0$/,
      }),
    ).toHaveLength(4);
  });

  it('says nobody has written yet, and how to ask', async () => {
    readReceivedFeedback.mockResolvedValue([]);

    await renderList();

    expect(
      screen.getByText(
        'No one has written you feedback yet. Ask a teammate with the form above.',
      ),
    ).toBeInTheDocument();
  });
});
