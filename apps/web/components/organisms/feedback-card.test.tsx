import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FeedItem } from '@/lib/feedback/feed-item.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { photosWill } from '@/lib/test/photos-will';
import { FeedbackCard } from './feedback-card';

const CARA = {
  name: 'Cara Diaz',
  photoUrl: null,
  inactive: false,
  isYou: false,
};

const OFFERED: FeedItem = {
  id: 'fb-1',
  giverName: 'Ben Carter',
  giverPhotoUrl: null,
  giverInactive: false,
  giverIsYou: false,
  receivers: [CARA],
  origin: 'OFFERED',
  message: 'You kept the room with you.\nThe recap landed.',
  messageTags: NO_TEXT_TAGS,
  givenAt: '2026-10-12T03:00:00.000Z',
  reactions: { '👏': ['Ann Lee'] },
  request: null,
};

const ANSWER: FeedItem = {
  ...OFFERED,
  origin: 'REQUESTED',
  message: 'You open strongly and keep everyone with you.',
  request: {
    message: 'Running the planning meeting',
    messageTags: NO_TEXT_TAGS,
    requester: CARA,
    asked: [
      { name: 'Ben Carter', photoUrl: null, inactive: false, isYou: false },
      { name: 'Dan Ooi', photoUrl: null, inactive: true, isYou: false },
    ],
  },
};

const SEVERAL = [
  CARA,
  { name: 'Ann Lee', photoUrl: null, inactive: false, isYou: false },
  { name: 'Dan Ooi', photoUrl: null, inactive: true, isYou: false },
  { name: 'Eve Ng', photoUrl: null, inactive: false, isYou: false },
  { name: 'Fon Pak', photoUrl: null, inactive: false, isYou: false },
];

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

  it('opens with the Giver and the one Receiver, each beside their face', () => {
    render(<FeedbackCard item={OFFERED} />);

    expect(screen.getByRole('banner')).toHaveTextContent(
      'BCBen CartertoCDCara Diaz',
    );
    expect(
      screen.queryByRole('button', { name: /Show who it is for/ }),
    ).toBeNull();
  });

  it('folds several Receivers into a stack of faces that names them all to a screen reader', () => {
    render(<FeedbackCard item={{ ...OFFERED, receivers: SEVERAL }} />);

    expect(
      screen.getByRole('button', {
        name: 'Cara Diaz, Ann Lee, Dan Ooi (inactive), Eve Ng, and Fon Pak. Show who it is for',
      }),
    ).toBeInTheDocument();
    for (const initials of ['CD', 'AL', 'DO', 'EN']) {
      expect(screen.getByText(initials)).toBeInTheDocument();
    }
    expect(screen.queryByText('FP')).not.toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('lists every Receiver, face and name, in a dialog opened from the stack, and gives focus back on close', async () => {
    const user = userEvent.setup();
    render(<FeedbackCard item={{ ...OFFERED, receivers: SEVERAL }} />);
    const stack = screen.getByRole('button', { name: /Show who it is for/ });

    await user.click(stack);

    const dialog = screen.getByRole('dialog', { name: 'For 5 people' });
    expect(
      within(dialog).getByText(
        'Ben Carter gave this Feedback to all of them. Each of them sees who else it was for.',
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog)
        .getAllByRole('listitem')
        .map((row) => row.textContent),
    ).toEqual([
      'CDCara Diaz',
      'ALAnn Lee',
      'DODan Ooi (inactive)',
      'ENEve Ng',
      'FPFon Pak',
    ]);

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(stack).toHaveFocus();
  });

  it('keeps the line breaks the writer typed', () => {
    render(<FeedbackCard item={OFFERED} />);

    expect(screen.getByText(/You kept the room with you/)).toHaveClass(
      'whitespace-pre-line',
    );
  });

  it('tells Feedback given without being asked from an answer by its badge', () => {
    render(<FeedbackCard item={OFFERED} />);
    expect(screen.getByText('Offered')).toHaveAttribute('data-slot', 'badge');

    render(<FeedbackCard item={ANSWER} />);
    expect(screen.getByText('Requested')).toHaveAttribute('data-slot', 'badge');
  });

  it('says what an answer responds to: who asked, everyone they asked, and the question', () => {
    render(<FeedbackCard item={ANSWER} />);

    expect(screen.getByText(/^In answer to/)).toHaveTextContent(
      'In answer to Cara Diaz, who asked Ben Carter and Dan Ooi (inactive): Running the planning meeting',
    );
  });

  it('says "your request" when the person reading asked, and names them "you" among those asked', () => {
    render(
      <FeedbackCard
        item={{
          ...ANSWER,
          request: ANSWER.request && {
            ...ANSWER.request,
            requester: { ...CARA, isYou: true },
          },
        }}
      />,
    );

    expect(screen.getByText(/^In answer to/)).toHaveTextContent(
      'In answer to your request to Ben Carter and Dan Ooi (inactive): Running the planning meeting',
    );
  });

  it('names the person reading "You" when they gave it, and "you" first among several Receivers', () => {
    render(
      <FeedbackCard
        item={{
          ...OFFERED,
          giverIsYou: true,
          receivers: [
            { ...CARA, isYou: true },
            {
              name: 'Ben Carter',
              photoUrl: null,
              inactive: false,
              isYou: false,
            },
            { name: 'Dan Ooi', photoUrl: null, inactive: false, isYou: false },
          ],
        }}
      />,
    );

    const card = screen.getByRole('article');
    expect(within(card).getByText('You')).toBeInTheDocument();
    expect(within(card).getByText('you')).toBeInTheDocument();
    expect(
      within(card).getByRole('button', {
        name: 'Ben Carter and Dan Ooi. Show who it is for',
      }),
    ).toBeInTheDocument();
  });

  it('keeps the answer the main text, before what it responds to', () => {
    render(<FeedbackCard item={ANSWER} />);

    const answer = screen.getByText(/You open strongly/);
    const inAnswerTo = screen.getByText(/^In answer to/);
    expect(
      answer.compareDocumentPosition(inAnswerTo) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('says nothing about a request on Feedback given without being asked', () => {
    render(<FeedbackCard item={OFFERED} />);

    expect(screen.queryByText(/In answer to/)).toBeNull();
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
          giverIsYou: false,
          receivers: [{ ...CARA, inactive: true, isYou: false }],
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
