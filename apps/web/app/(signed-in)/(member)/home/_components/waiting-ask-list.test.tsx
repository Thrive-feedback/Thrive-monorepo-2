import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { WaitingAskList } from './waiting-ask-list';

const readMyAsks = vi.fn();
vi.mock('@/app/(signed-in)/(member)/home/_lib/my-asks.service', () => ({
  readMyAsks: (...args: unknown[]) => readMyAsks(...args),
}));
vi.mock('@/lib/session/session.service', () => ({
  requireYou: async () => ({
    name: 'Ben Carter',
    photoUrl: null,
    inactive: false,
    isYou: true,
  }),
}));

const MEMBERSHIP = {
  workspace: { id: 'w-1', name: 'Acme Corp' },
  role: 'MEMBER',
} as const;

const AN_ASK: MyAsk = {
  askId: 'ask-1',
  message: 'my presentation skills',
  messageTags: NO_TEXT_TAGS,
  requesterName: 'Ana Silva',
  requesterPhotoUrl: null,
  requesterInactive: false,
  onWorkspaceFeed: false,
  askedAt: '2026-10-11T03:00:00.000Z',
  status: 'PENDING',
};

async function renderList() {
  render(await WaitingAskList({ membership: MEMBERSHIP }));
}

describe('WaitingAskList', () => {
  it('reads the Asks of the person’s own Workspace', async () => {
    readMyAsks.mockResolvedValue([]);

    await renderList();

    expect(readMyAsks).toHaveBeenCalledWith(MEMBERSHIP);
  });

  it('shows who asked you, about what, and when, as an Ask card', async () => {
    readMyAsks.mockResolvedValue([AN_ASK]);

    await renderList();

    // Level 2, under the page's own h1: a skipped level leaves a screen reader guessing.
    expect(
      screen.getByRole('heading', { level: 2, name: 'Waiting for me' }),
    ).toBeInTheDocument();
    const card = screen.getByRole('article');
    expect(within(card).getByText('Ana Silva')).toBeInTheDocument();
    expect(within(card).getByText('you')).toBeInTheDocument();
    expect(within(card).getByText('Ask')).toBeInTheDocument();
    expect(within(card).getByText('11 Oct 2026')).toBeInTheDocument();
    expect(
      within(card).getByText('my presentation skills'),
    ).toBeInTheDocument();
  });

  it('opens the Ask to answer from its "Answer" button', async () => {
    readMyAsks.mockResolvedValue([AN_ASK]);

    await renderList();

    expect(
      screen.getByRole('link', { name: 'Answer Ana Silva’s Ask' }),
    ).toHaveAttribute('href', '/home?tab=waiting&ask=ask-1');
  });

  it('tells you an answer goes on the Workspace feed, and nothing else about who reads it', async () => {
    readMyAsks.mockResolvedValue([
      AN_ASK,
      { ...AN_ASK, askId: 'ask-2', onWorkspaceFeed: true },
    ]);

    await renderList();

    const [onlyThem, everyone] = screen.getAllByRole('article');
    expect(onlyThem).not.toHaveTextContent('Workspace feed');
    expect(everyone).toHaveTextContent(
      'Your answer goes on the Workspace feed.',
    );
  });

  it('calls the Requester a teammate while they have not introduced themselves', async () => {
    readMyAsks.mockResolvedValue([{ ...AN_ASK, requesterName: null }]);

    await renderList();

    expect(
      within(screen.getByRole('article')).getByText('A teammate'),
    ).toBeInTheDocument();
  });

  it('shows a Requester who was Deactivated as inactive, and keeps their Ask', async () => {
    readMyAsks.mockResolvedValue([{ ...AN_ASK, requesterInactive: true }]);

    await renderList();

    expect(screen.getByText('Ana Silva (inactive)')).toBeInTheDocument();
  });

  it('says so when nothing is waiting', async () => {
    readMyAsks.mockResolvedValue([]);

    await renderList();

    expect(screen.getByText('Nothing is waiting for you.')).toBeInTheDocument();
  });
});
