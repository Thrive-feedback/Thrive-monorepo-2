import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FeedItem } from '@/lib/feedback/feed-item.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { photosWill } from '@/lib/test/photos-will';
import { FeedbackCard } from './feedback-card';

const CARA = { name: 'Cara Diaz', photoUrl: null, inactive: false };

const OFFERED: FeedItem = {
  id: 'fb-1',
  giverName: 'Ben Carter',
  giverPhotoUrl: null,
  giverInactive: false,
  receivers: [CARA],
  origin: 'OFFERED',
  message: 'You kept the room with you.\nThe recap landed.',
  messageTags: NO_TEXT_TAGS,
  givenAt: '2026-10-12T03:00:00.000Z',
  reactions: { '👏': ['Ann Lee'] },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FeedbackCard', () => {
  it("shows the Giver's Google photo once it has loaded", async () => {
    photosWill('load');
    const photo = 'https://lh3.googleusercontent.com/a/ben=s96-c';

    const { container } = render(
      <FeedbackCard item={{ ...OFFERED, giverPhotoUrl: photo }} />,
    );

    await vi.waitFor(() =>
      expect(container.querySelector('img')).toHaveAttribute('src', photo),
    );
  });

  it("shows the Giver's initials while they have no photo", () => {
    const { container } = render(<FeedbackCard item={OFFERED} />);

    expect(screen.getByText('BC')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('says who wrote it, who it is about, what they wrote and when', () => {
    render(<FeedbackCard item={OFFERED} />);

    expect(screen.getByText(/Ben Carter/)).toBeInTheDocument();
    expect(screen.getByText(/Cara Diaz/)).toBeInTheDocument();
    expect(
      screen.getByText(/You kept the room with you\./),
    ).toBeInTheDocument();
    expect(
      screen.getByText('12 Oct 2026', { exact: false }),
    ).toBeInTheDocument();
  });

  it('names everyone it is for, and closes with their faces as one stack', () => {
    render(
      <FeedbackCard
        item={{
          ...OFFERED,
          receivers: [
            CARA,
            { name: 'Ann Lee', photoUrl: null, inactive: false },
            { name: 'Dan Ooi', photoUrl: null, inactive: true },
            { name: 'Eve Ng', photoUrl: null, inactive: false },
            { name: 'Fon Pak', photoUrl: null, inactive: false },
          ],
        }}
      />,
    );

    expect(screen.getByText(/^Ben Carter/)).toHaveTextContent(
      'Ben Carter to Cara Diaz, Ann Lee, Dan Ooi (inactive), Eve Ng and Fon Pak',
    );
    for (const initials of ['CD', 'AL', 'DO', 'EN']) {
      expect(screen.getByText(initials)).toBeInTheDocument();
    }
    expect(screen.queryByText('FP')).not.toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('keeps the line breaks the writer typed', () => {
    render(<FeedbackCard item={OFFERED} />);

    expect(screen.getByText(/You kept the room with you/)).toHaveClass(
      'whitespace-pre-line',
    );
  });

  it('tells Feedback given without being asked from an answer', () => {
    render(<FeedbackCard item={OFFERED} />);
    expect(screen.getByText(/Offered/)).toBeInTheDocument();

    render(<FeedbackCard item={{ ...OFFERED, origin: 'REQUESTED' }} />);
    expect(screen.getByText(/Requested/)).toBeInTheDocument();
  });

  it('calls a Giver with no Profile a teammate, rather than showing a gap', () => {
    render(<FeedbackCard item={{ ...OFFERED, giverName: null }} />);

    expect(screen.getByText(/A teammate/)).toBeInTheDocument();
    expect(screen.getByText(/Cara Diaz/)).toBeInTheDocument();
  });

  it('calls a Receiver with no Profile a teammate too', () => {
    render(
      <FeedbackCard
        item={{ ...OFFERED, receivers: [{ ...CARA, name: null }] }}
      />,
    );

    expect(screen.getByText(/Ben Carter/)).toBeInTheDocument();
    expect(screen.getByText(/a teammate/)).toBeInTheDocument();
  });

  it('shows a Giver or Receiver who was Deactivated as inactive', () => {
    render(
      <FeedbackCard
        item={{
          ...OFFERED,
          giverInactive: true,
          receivers: [{ ...CARA, inactive: true }],
        }}
      />,
    );

    expect(screen.getByText('Ben Carter (inactive)')).toBeInTheDocument();
    expect(screen.getByText('Cara Diaz (inactive)')).toBeInTheDocument();
  });

  it('shows who reacted, so a Reaction is never anonymous', () => {
    render(<FeedbackCard item={OFFERED} />);

    expect(screen.getByRole('list', { name: 'Reactions' })).toBeInTheDocument();
  });
});
