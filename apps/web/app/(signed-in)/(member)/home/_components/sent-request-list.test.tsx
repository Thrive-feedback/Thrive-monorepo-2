import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { SentRequestList } from './sent-request-list';

const readSentRequests = vi.fn();
vi.mock('@/app/(signed-in)/(member)/home/_lib/sent-requests.service', () => ({
  readSentRequests: (...args: unknown[]) => readSentRequests(...args),
}));

const MEMBERSHIP = {
  workspace: { id: 'w-1', name: 'Acme Corp' },
  role: 'MEMBER',
} as const;

async function renderList() {
  render(await SentRequestList({ membership: MEMBERSHIP }));
}

describe('SentRequestList', () => {
  it('reads the requests of the person’s own Workspace', async () => {
    readSentRequests.mockResolvedValue([]);

    await renderList();

    expect(readSentRequests).toHaveBeenCalledWith(MEMBERSHIP);
  });

  it('shows the Topic, the day it was sent, and each Ask’s state', async () => {
    readSentRequests.mockResolvedValue([
      {
        id: 'request-1',
        topic: 'my presentation skills',
        topicTags: NO_TEXT_TAGS,
        sentAt: '2026-10-11T03:00:00.000Z',
        asks: [
          { askId: 'ask-1', giverName: 'Ben Carter', status: 'PENDING' },
          { askId: 'ask-2', giverName: 'Cara Diaz', status: 'ANSWERED' },
        ],
      },
    ]);

    await renderList();

    // Level 2, under the page's own h1: a skipped level leaves a screen reader guessing.
    expect(
      screen.getByRole('heading', { level: 2, name: 'my presentation skills' }),
    ).toBeInTheDocument();
    expect(screen.getByText('11 Oct 2026')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Answered')).toBeInTheDocument();
    expect(screen.getByText(/Ben Carter/)).toBeInTheDocument();
  });

  it('shows a dash for a Member who has not introduced themselves', async () => {
    readSentRequests.mockResolvedValue([
      {
        id: 'request-1',
        topic: 'my presentation skills',
        topicTags: NO_TEXT_TAGS,
        sentAt: '2026-10-11T03:00:00.000Z',
        asks: [{ askId: 'ask-1', giverName: null, status: 'PENDING' }],
      },
    ]);

    await renderList();

    expect(screen.getByText(/—/)).toBeInTheDocument();
  });

  it('shows a Member asked who was Deactivated as inactive', async () => {
    readSentRequests.mockResolvedValue([
      {
        id: 'request-1',
        topic: 'my presentation skills',
        topicTags: NO_TEXT_TAGS,
        sentAt: '2026-10-11T03:00:00.000Z',
        asks: [
          {
            askId: 'ask-1',
            giverName: 'Ben Carter',
            giverInactive: true,
            status: 'PENDING',
          },
        ],
      },
    ]);

    await renderList();

    expect(screen.getByText('Ben Carter (inactive)')).toBeInTheDocument();
  });

  it('points at asking somebody when nothing has been sent', async () => {
    readSentRequests.mockResolvedValue([]);

    await renderList();

    expect(
      screen.getByText(/You haven't asked anyone for feedback yet\./),
    ).toHaveTextContent('Ask a teammate with the form above.');
  });

  it('opens each request in a dialog over My requests', async () => {
    readSentRequests.mockResolvedValue([
      {
        id: 'request-1',
        topic: 'my presentation skills',
        topicTags: NO_TEXT_TAGS,
        sentAt: '2026-10-11T03:00:00.000Z',
        asks: [],
      },
    ]);

    await renderList();

    expect(
      screen.getByRole('link', { name: 'my presentation skills' }),
    ).toHaveAttribute('href', '/home?tab=my-requests&request=request-1');
  });
});
