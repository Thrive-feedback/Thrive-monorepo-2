import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeFeed } from './home-feed';

const readHomeFeed = vi.fn();
vi.mock(
  '@/app/(signed-in)/(brand-new)/brand-new-home/_lib/home-feed.service',
  () => ({
    readHomeFeed: (...args: unknown[]) => readHomeFeed(...args),
  }),
);
vi.mock(
  '@/app/(signed-in)/(brand-new)/brand-new-home/_lib/home-feed-actions.service',
  () => ({ readNextHomeFeedPage: vi.fn() }),
);

const MEMBERSHIP = {
  workspace: { id: 'w-1', name: 'Acme' },
  role: 'MEMBER',
} as const;

beforeEach(() => {
  readHomeFeed.mockResolvedValue({
    readerAccountId: 'ann',
    items: [],
    nextCursor: null,
  });
});

describe('HomeFeed', () => {
  it('reads the choice it was given', async () => {
    render(await HomeFeed({ membership: MEMBERSHIP, show: 'shared' }));

    expect(readHomeFeed).toHaveBeenCalledWith(MEMBERSHIP, 'shared');
  });

  it.each([
    ['all', 'No Feedback to show yet'],
    ['everyone', 'Nothing has been shared with the whole Workspace yet.'],
    ['shared', 'Nothing has been shared with you yet.'],
  ] as const)(
    'says what %s holds when it holds nothing',
    async (show, title) => {
      render(await HomeFeed({ membership: MEMBERSHIP, show }));

      expect(screen.getByText(title)).toBeInTheDocument();
    },
  );
});
