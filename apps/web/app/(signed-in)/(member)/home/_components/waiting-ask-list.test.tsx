import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { WaitingAskList } from './waiting-ask-list';

const readMyAsks = vi.fn();
vi.mock('@/lib/feedback/my-asks.service', () => ({
  readMyAsks: (...args: unknown[]) => readMyAsks(...args),
}));

const MEMBERSHIP = {
  workspace: { id: 'w-1', name: 'Acme Corp' },
  role: 'MEMBER',
} as const;

async function renderList() {
  render(await WaitingAskList({ membership: MEMBERSHIP }));
}

describe('WaitingAskList', () => {
  it('reads the Asks of the person’s own Workspace', async () => {
    readMyAsks.mockResolvedValue([]);

    await renderList();

    expect(readMyAsks).toHaveBeenCalledWith(MEMBERSHIP);
  });

  it('shows who asked, about what, and when', async () => {
    readMyAsks.mockResolvedValue([
      {
        askId: 'ask-1',
        message: 'my presentation skills',
        messageTags: NO_TEXT_TAGS,
        requesterName: 'Ana Silva',
        askedAt: '2026-10-11T03:00:00.000Z',
        status: 'PENDING',
      },
    ]);

    await renderList();

    // Level 2, under the page's own h1: a skipped level leaves a screen reader guessing.
    expect(
      screen.getByRole('heading', { level: 2, name: 'Waiting for me' }),
    ).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'my presentation skills' }),
    ).toHaveAttribute('href', '/home?tab=waiting&ask=ask-1');
    expect(screen.getByRole('article')).toHaveTextContent(
      'Ana Silva asked you',
    );
    expect(screen.getByText('11 Oct 2026')).toBeInTheDocument();
  });

  it('calls the Requester a teammate while they have not introduced themselves', async () => {
    readMyAsks.mockResolvedValue([
      {
        askId: 'ask-1',
        message: 'my presentation skills',
        messageTags: NO_TEXT_TAGS,
        requesterName: null,
        askedAt: '2026-10-11T03:00:00.000Z',
        status: 'PENDING',
      },
    ]);

    await renderList();

    expect(screen.getByRole('article')).toHaveTextContent(
      'A teammate asked you',
    );
  });

  it('shows a Requester who was Deactivated as inactive, and keeps their Ask', async () => {
    readMyAsks.mockResolvedValue([
      {
        askId: 'ask-1',
        message: 'my presentation skills',
        messageTags: NO_TEXT_TAGS,
        requesterName: 'Ana Silva',
        requesterInactive: true,
        askedAt: '2026-10-11T03:00:00.000Z',
        status: 'PENDING',
      },
    ]);

    await renderList();

    expect(screen.getByText('Ana Silva (inactive)')).toBeInTheDocument();
    expect(screen.getByText('my presentation skills')).toBeInTheDocument();
  });

  it('says so when nothing is waiting', async () => {
    readMyAsks.mockResolvedValue([]);

    await renderList();

    expect(screen.getByText('Nothing is waiting for you.')).toBeInTheDocument();
  });
});
