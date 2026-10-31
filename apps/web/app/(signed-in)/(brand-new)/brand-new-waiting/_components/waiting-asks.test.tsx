import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import type { CurrentMembership } from '@/lib/session/current-account.type';

const readWaitingAsks = vi.fn();
vi.mock(
  '@/app/(signed-in)/(brand-new)/brand-new-waiting/_lib/waiting-asks.service',
  () => ({
    readWaitingAsks: (...args: unknown[]) => readWaitingAsks(...args),
  }),
);
vi.mock(
  '@/app/(signed-in)/(brand-new)/brand-new-waiting/_lib/waiting-asks-actions.service',
  () => ({ readNextWaitingAsks: vi.fn() }),
);

const { WaitingAsks } = await import('./waiting-asks');

const MEMBERSHIP = {
  workspace: { id: 'w-1', name: 'Acme' },
  role: 'MEMBER',
} as CurrentMembership;

const ask: MyAsk = {
  askId: 'a-1',
  message: 'Asked by Ben',
  messageTags: NO_TEXT_TAGS,
  requesterName: 'Ben',
  requesterPhotoUrl: null,
  requesterInactive: false,
  askedAt: '2026-10-31T03:00:00.000Z',
  status: 'PENDING',
};

beforeEach(() => {
  readWaitingAsks.mockReset();
});

describe('WaitingAsks', () => {
  it('says so when nothing is waiting', async () => {
    readWaitingAsks.mockResolvedValue({ items: [], nextCursor: null });

    render(await WaitingAsks({ membership: MEMBERSHIP, sort: 'oldest' }));

    expect(screen.getByText('Nothing is waiting for you.')).toBeVisible();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('reads the first page of the Workspace the person is in, in that order', async () => {
    readWaitingAsks.mockResolvedValue({ items: [ask], nextCursor: null });

    render(await WaitingAsks({ membership: MEMBERSHIP, sort: 'oldest' }));

    expect(readWaitingAsks).toHaveBeenCalledWith(MEMBERSHIP, 'oldest');
    expect(screen.getByText('Asked by Ben')).toBeVisible();
  });
});
