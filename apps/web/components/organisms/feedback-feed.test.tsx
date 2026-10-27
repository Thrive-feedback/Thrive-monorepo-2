import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { FeedItem } from '@/lib/feedback/feed-item.type';
import type { KudosItem } from '@/lib/feedback/kudos-item.type';
import { FeedbackFeed } from './feedback-feed';

const NO_TAGS = { workspaceGoals: [], mentions: [] };

function feedback(id: string, message: string, givenAt: string): FeedItem {
  return {
    id,
    giverName: 'Ben Carter',
    giverPhotoUrl: null,
    giverInactive: false,
    receiverName: 'Cara Diaz',
    receiverInactive: false,
    origin: 'OFFERED',
    message,
    messageTags: NO_TAGS,
    givenAt,
    reactions: {},
  };
}

function kudos(id: string, message: string, givenAt: string): KudosItem {
  return {
    id,
    giver: { name: 'Ann Lee', inactive: false },
    recipients: [{ name: 'Ben Carter', inactive: false }],
    message,
    messageTags: NO_TAGS,
    givenAt,
  };
}

describe('FeedbackFeed', () => {
  it('puts Kudos among the Feedback, newest first', () => {
    render(
      <FeedbackFeed
        items={[
          feedback('f2', 'Newest feedback', '2026-10-24T05:00:00.000Z'),
          feedback('f1', 'Oldest feedback', '2026-10-22T05:00:00.000Z'),
        ]}
        kudos={[kudos('k1', 'Kudos in between', '2026-10-23T05:00:00.000Z')]}
        emptyMessage="Nothing yet."
      />,
    );

    expect(
      screen.getAllByRole('article').map((card) => card.textContent),
    ).toEqual([
      expect.stringContaining('Newest feedback'),
      expect.stringContaining('Kudos in between'),
      expect.stringContaining('Oldest feedback'),
    ]);
  });

  it('is empty only when there is neither Feedback nor Kudos', () => {
    render(
      <FeedbackFeed
        items={[]}
        kudos={[kudos('k1', 'Only Kudos', '2026-10-23T05:00:00.000Z')]}
        emptyMessage="Nothing yet."
      />,
    );

    expect(screen.queryByText('Nothing yet.')).not.toBeInTheDocument();
    expect(screen.getByText('Only Kudos')).toBeInTheDocument();
  });
});
