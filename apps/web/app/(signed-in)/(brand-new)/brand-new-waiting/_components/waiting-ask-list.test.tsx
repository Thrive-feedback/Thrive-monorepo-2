import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { type BrandNewWaitingSort, ROUTES } from '@/lib/routes.constant';
import { AnsweredAsksProvider, useAnsweredAsks } from './answered-asks';
import { WaitingAskList } from './waiting-ask-list';

const readNextWaitingAsks = vi.fn();
vi.mock(
  '@/app/(signed-in)/(brand-new)/brand-new-waiting/_lib/waiting-asks-actions.service',
  () => ({
    readNextWaitingAsks: (input: unknown) => readNextWaitingAsks(input),
  }),
);

const ask = (askId: string, requesterName: string): MyAsk => ({
  askId,
  message: `Asked by ${requesterName}`,
  messageTags: NO_TEXT_TAGS,
  requesterName,
  requesterPhotoUrl: null,
  requesterInactive: false,
  askedAt: '2026-10-31T03:00:00.000Z',
  status: 'PENDING',
});

/** Stands for the end of the list coming into view. */
let reachTheEnd: () => void;

class SeesTheEnd {
  constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
    reachTheEnd = () => callback([{ isIntersecting: true }]);
  }
  observe() {}
  disconnect() {}
}

function AnsweringBen() {
  const { markAnswered } = useAnsweredAsks();
  return (
    <button type="button" onClick={() => markAnswered('a-2')}>
      Ben was answered
    </button>
  );
}

function draw(
  nextCursor: string | null,
  items = [ask('a-1', 'Ann')],
  sort: BrandNewWaitingSort = 'newest',
) {
  render(
    <AnsweredAsksProvider>
      <WaitingAskList initialPage={{ items, nextCursor }} sort={sort} />
      <AnsweringBen />
    </AnsweredAsksProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', SeesTheEnd);
  readNextWaitingAsks.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WaitingAskList', () => {
  it('leads each card to its own postcard', () => {
    draw(null);

    expect(
      screen.getByRole('link', {
        name: 'Answer in the postcard: Ann requested feedback from you',
      }),
    ).toHaveAttribute('href', ROUTES.brandNewWaitingAsk('a-1'));
  });

  it('reads the next page as the end comes near, and keeps what it had', async () => {
    readNextWaitingAsks.mockResolvedValue({
      items: [ask('a-2', 'Ben')],
      nextCursor: null,
    });
    draw('cursor-1');

    reachTheEnd();

    expect(await screen.findByText('Asked by Ben')).toBeVisible();
    expect(screen.getByText('Asked by Ann')).toBeVisible();
    expect(readNextWaitingAsks).toHaveBeenCalledExactlyOnceWith({
      sort: 'newest',
      cursor: 'cursor-1',
    });
  });

  it('keeps its order in the next page and on each card', async () => {
    readNextWaitingAsks.mockResolvedValue({ items: [], nextCursor: null });
    draw('cursor-1', [ask('a-1', 'Ann')], 'oldest');

    reachTheEnd();

    await waitFor(() =>
      expect(readNextWaitingAsks).toHaveBeenCalledExactlyOnceWith({
        sort: 'oldest',
        cursor: 'cursor-1',
      }),
    );
    expect(
      screen.getByRole('link', {
        name: 'Answer in the postcard: Ann requested feedback from you',
      }),
    ).toHaveAttribute('href', ROUTES.brandNewWaitingAsk('a-1', 'oldest'));
  });

  it('says so when a page could not be read, and tries again on a press', async () => {
    readNextWaitingAsks.mockResolvedValueOnce(null).mockResolvedValueOnce({
      items: [ask('a-2', 'Ben')],
      nextCursor: null,
    });
    draw('cursor-1');

    reachTheEnd();
    await userEvent.click(
      await screen.findByRole('button', { name: /try again/i }),
    );

    expect(await screen.findByText('Asked by Ben')).toBeVisible();
  });

  it('takes an answered card out, wherever it stood', async () => {
    readNextWaitingAsks.mockResolvedValue({
      items: [ask('a-2', 'Ben')],
      nextCursor: null,
    });
    draw('cursor-1');
    reachTheEnd();
    await screen.findByText('Asked by Ben');

    await userEvent.click(
      screen.getByRole('button', { name: 'Ben was answered' }),
    );

    await waitFor(() =>
      expect(screen.queryByText('Asked by Ben')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Asked by Ann')).toBeVisible();
  });

  it('says nothing is waiting once the last one is answered', async () => {
    draw(null, [ask('a-2', 'Ben')]);

    await userEvent.click(
      screen.getByRole('button', { name: 'Ben was answered' }),
    );

    expect(
      await screen.findByText('Nothing is waiting for you.'),
    ).toBeVisible();
  });
});
