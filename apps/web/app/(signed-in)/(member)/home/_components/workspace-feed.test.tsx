import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { WorkspaceFeed } from './workspace-feed';

const readWorkspaceFeed = vi.fn();
vi.mock('@/app/(signed-in)/(member)/home/_lib/workspace-feed.service', () => ({
  readWorkspaceFeed: (...args: unknown[]) => readWorkspaceFeed(...args),
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
  message: 'You kept the room with you.',
  messageTags: NO_TEXT_TAGS,
  givenAt: '2026-10-12T03:00:00.000Z',
  reactions: {},
};

async function renderFeed() {
  render(await WorkspaceFeed({ membership: MEMBERSHIP }));
}

describe('WorkspaceFeed', () => {
  it('reads the feed of the person’s own Workspace', async () => {
    readWorkspaceFeed.mockResolvedValue([]);

    await renderFeed();

    expect(readWorkspaceFeed).toHaveBeenCalledWith(MEMBERSHIP);
  });

  it('shows each piece with both people, the day and the Feedback message', async () => {
    readWorkspaceFeed.mockResolvedValue([ONE_PIECE]);

    await renderFeed();
    expect(
      screen.getByText('You kept the room with you.', { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ben Carter/)).toBeInTheDocument();
    expect(screen.getByText(/Cara Diaz/)).toBeInTheDocument();
    expect(screen.getByText('You kept the room with you.')).toBeInTheDocument();
    expect(
      screen.getByText('12 Oct 2026', { exact: false }),
    ).toBeInTheDocument();
  });

  it('says how Feedback gets here while the feed is empty', async () => {
    readWorkspaceFeed.mockResolvedValue([]);

    await renderFeed();

    expect(
      screen.getByText('Nothing has been shared with everyone yet.'),
    ).toBeInTheDocument();
  });

  it('no longer warns that the feed is preview data, because it is real', async () => {
    readWorkspaceFeed.mockResolvedValue([ONE_PIECE]);

    await renderFeed();

    expect(screen.queryByText(/Preview data/)).not.toBeInTheDocument();
  });
});
