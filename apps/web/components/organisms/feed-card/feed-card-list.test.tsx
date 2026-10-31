import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { HomeFeedItem } from '@/lib/feedback/home-feed-item.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { FeedCardList } from './feed-card-list';

const person = (accountId: string, name: string) => ({
  accountId,
  name,
  photoUrl: null,
  inactive: false,
});

const OFFERED: HomeFeedItem = {
  id: 'fb-1',
  origin: 'OFFERED',
  giver: person('cara', 'Cara Diaz'),
  receivers: [person('ben', 'Ben Carter')],
  message: 'First in the list.',
  messageTags: NO_TEXT_TAGS,
  givenAt: '2026-10-31T03:00:00.000Z',
  visibility: 'EVERYONE',
  request: null,
};

const REQUESTED: HomeFeedItem = {
  ...OFFERED,
  id: 'fb-2',
  origin: 'REQUESTED',
  message: 'Second in the list.',
  request: {
    message: 'How clear was the plan?',
    messageTags: NO_TEXT_TAGS,
    requester: person('ben', 'Ben Carter'),
    asked: [],
  },
};

function renderList(items: readonly HomeFeedItem[]) {
  render(
    <FeedCardList
      items={items}
      readerAccountId="ann"
      targetFor={(item) => ({ href: `/postcard/${item.id}` })}
    />,
  );
}

describe('FeedCardList', () => {
  it('draws one card for each piece, in the order given', () => {
    renderList([OFFERED, REQUESTED]);

    const [first, second] = screen.getAllByRole('listitem');
    expect(first).toHaveTextContent('First in the list.');
    expect(second).toHaveTextContent('Second in the list.');
  });

  it('chooses each card by how the piece came about', () => {
    renderList([OFFERED, REQUESTED]);

    const [first, second] = screen.getAllByRole('article');
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(
      within(first as HTMLElement).queryByText(/asked:/),
    ).not.toBeInTheDocument();
    expect(second).toHaveTextContent('Ben Carter asked:');
  });

  it('leads each small postcard to its own piece', () => {
    renderList([OFFERED, REQUESTED]);

    expect(
      screen.getAllByRole('link').map((link) => link.getAttribute('href')),
    ).toEqual(['/postcard/fb-1', '/postcard/fb-2']);
  });
});
