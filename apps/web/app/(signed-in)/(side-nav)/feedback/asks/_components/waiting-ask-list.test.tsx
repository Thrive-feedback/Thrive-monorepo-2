import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WaitingAskList } from './waiting-ask-list';

const readMyAsks = vi.fn();
vi.mock(
  '@/app/(signed-in)/(side-nav)/feedback/asks/_lib/my-asks.service',
  () => ({
    readMyAsks: (...args: unknown[]) => readMyAsks(...args),
  }),
);

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
        topic: 'my presentation skills',
        requesterName: 'Ana Silva',
        askedAt: '2026-10-11T03:00:00.000Z',
        status: 'PENDING',
      },
    ]);

    await renderList();

    // Level 2, under the page's own h1: a skipped level leaves a screen reader guessing.
    expect(
      screen.getByRole('heading', { level: 2, name: 'my presentation skills' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'my presentation skills' }),
    ).toHaveAttribute('href', '/feedback/asks/ask-1');
    expect(screen.getByText('Asked by Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('11 Oct 2026')).toBeInTheDocument();
  });

  it('calls the Requester a teammate while they have not introduced themselves', async () => {
    readMyAsks.mockResolvedValue([
      {
        askId: 'ask-1',
        topic: 'my presentation skills',
        requesterName: null,
        askedAt: '2026-10-11T03:00:00.000Z',
        status: 'PENDING',
      },
    ]);

    await renderList();

    expect(screen.getByText('Asked by a teammate')).toBeInTheDocument();
  });

  it('says so when nothing is waiting', async () => {
    readMyAsks.mockResolvedValue([]);

    await renderList();

    expect(screen.getByText('Nothing is waiting for you.')).toBeInTheDocument();
  });
});
