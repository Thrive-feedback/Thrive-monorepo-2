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

  it('shows the Request message, the day it was sent, and each Ask’s state', async () => {
    readSentRequests.mockResolvedValue([
      {
        id: 'request-1',
        message: 'my presentation skills',
        messageTags: NO_TEXT_TAGS,
        sentAt: '2026-10-11T03:00:00.000Z',
        asks: [
          { askId: 'ask-1', giverName: 'Ben Carter', status: 'PENDING' },
          { askId: 'ask-2', giverName: 'Cara Diaz', status: 'ANSWERED' },
        ],
      },
    ]);

    await renderList();

    // Where each Ask stands sits beside the name of the person asked.
    expect(screen.getByRole('article')).toHaveTextContent(
      'You asked Ben Carter Pending and Cara Diaz Answered',
    );
    expect(screen.getByText('my presentation skills')).toBeInTheDocument();
    expect(screen.getByText('11 Oct 2026')).toBeInTheDocument();
  });

  it('calls a Member who has not introduced themselves a teammate', async () => {
    readSentRequests.mockResolvedValue([
      {
        id: 'request-1',
        message: 'my presentation skills',
        messageTags: NO_TEXT_TAGS,
        sentAt: '2026-10-11T03:00:00.000Z',
        asks: [{ askId: 'ask-1', giverName: null, status: 'PENDING' }],
      },
    ]);

    await renderList();

    expect(screen.getByRole('article')).toHaveTextContent(
      'You asked a teammate Pending',
    );
  });

  it('shows a Member asked who was Deactivated as inactive', async () => {
    readSentRequests.mockResolvedValue([
      {
        id: 'request-1',
        message: 'my presentation skills',
        messageTags: NO_TEXT_TAGS,
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
        message: 'my presentation skills',
        messageTags: NO_TEXT_TAGS,
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
