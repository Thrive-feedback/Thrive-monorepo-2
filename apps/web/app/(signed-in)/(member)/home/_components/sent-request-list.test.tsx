import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SentAsk, SentRequest } from '@/lib/feedback/sent-request.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { SentRequestList } from './sent-request-list';

const readSentRequests = vi.fn();
vi.mock('@/app/(signed-in)/(member)/home/_lib/sent-requests.service', () => ({
  readSentRequests: (...args: unknown[]) => readSentRequests(...args),
}));
vi.mock('@/lib/session/session.service', () => ({
  requireYou: async () => ({
    name: 'Ann Lee',
    photoUrl: null,
    inactive: false,
    isYou: true,
  }),
}));

const MEMBERSHIP = {
  workspace: { id: 'w-1', name: 'Acme Corp' },
  role: 'MEMBER',
} as const;

function ask(overrides: Partial<SentAsk> & Pick<SentAsk, 'askId'>): SentAsk {
  return {
    giverName: 'Ben Carter',
    giverPhotoUrl: null,
    giverInactive: false,
    status: 'PENDING',
    answer: null,
    ...overrides,
  };
}

function request(asks: readonly SentAsk[]): SentRequest {
  return {
    id: 'request-1',
    message: 'my presentation skills',
    messageTags: NO_TEXT_TAGS,
    sentAt: '2026-10-11T03:00:00.000Z',
    asks,
    readers: { value: 'ONLY_ME', selectedPeople: [] },
  };
}

const BEN_ANSWERED = ask({
  askId: 'ask-1',
  status: 'ANSWERED',
  answer: {
    message: 'Open with the story.',
    messageTags: NO_TEXT_TAGS,
    answeredAt: '2026-10-12T03:00:00.000Z',
  },
});
const CARA_WAITING = ask({ askId: 'ask-2', giverName: 'Cara Diaz' });

async function renderList() {
  render(await SentRequestList({ membership: MEMBERSHIP }));
}

describe('SentRequestList', () => {
  it('reads the requests of the person’s own Workspace', async () => {
    readSentRequests.mockResolvedValue([]);

    await renderList();

    expect(readSentRequests).toHaveBeenCalledWith(MEMBERSHIP);
  });

  it('draws each request from you, with how many answered and the day it was sent', async () => {
    readSentRequests.mockResolvedValue([request([BEN_ANSWERED, CARA_WAITING])]);

    await renderList();

    const card = screen.getByRole('article');
    expect(within(card).getByText('You')).toBeInTheDocument();
    expect(within(card).getByText('1 of 2 answered')).toBeInTheDocument();
    expect(within(card).getByText('11 Oct 2026')).toBeInTheDocument();
    expect(
      within(card).getByText('my presentation skills'),
    ).toBeInTheDocument();
  });

  it('says where each Ask stands in words, not by the colour of a face alone', async () => {
    readSentRequests.mockResolvedValue([request([BEN_ANSWERED, CARA_WAITING])]);
    const user = userEvent.setup();

    await renderList();
    await user.click(
      screen.getByRole('button', {
        name: 'Ben Carter, answered; Cara Diaz, pending. Show where each Ask stands',
      }),
    );

    const dialog = screen.getByRole('dialog', { name: 'You asked 2 people' });
    expect(dialog).toHaveTextContent('1 of 2 answered so far.');
    expect(within(dialog).getByText('Answered')).toBeInTheDocument();
    expect(within(dialog).getByText('Pending')).toBeInTheDocument();
  });

  it('shows every answer in the card, with who wrote it and when', async () => {
    readSentRequests.mockResolvedValue([request([BEN_ANSWERED, CARA_WAITING])]);

    await renderList();

    const card = screen.getByRole('article');
    expect(within(card).getByText('Open with the story.')).toBeInTheDocument();
    expect(within(card).getByText('12 Oct 2026')).toBeInTheDocument();
    expect(card).toHaveTextContent('Still waiting for Cara Diaz.');
  });

  it('says whose Ask ran out without an answer', async () => {
    readSentRequests.mockResolvedValue([
      request([
        ask({ askId: 'ask-3', giverName: 'Dan Ooi', status: 'EXPIRED' }),
      ]),
    ]);

    await renderList();

    const card = screen.getByRole('article');
    expect(within(card).getByText('Expired')).toBeInTheDocument();
    expect(card).toHaveTextContent(
      'The Ask to Dan Ooi expired without an answer.',
    );
  });

  it('says who reads the answers, as the request was sent', async () => {
    readSentRequests.mockResolvedValue([request([CARA_WAITING])]);

    await renderList();

    expect(
      screen.getByText('Only you can read what they send back.'),
    ).toBeInTheDocument();
  });

  it('folds a long answer until it is opened', async () => {
    // jsdom lays nothing out, so the fold is told the answer runs past its three lines.
    const tall = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(200);
    const shown = vi
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockReturnValue(72);
    readSentRequests.mockResolvedValue([
      request([
        {
          ...BEN_ANSWERED,
          answer: {
            message: 'A long answer. '.repeat(30),
            messageTags: NO_TEXT_TAGS,
            answeredAt: '2026-10-12T03:00:00.000Z',
          },
        },
      ]),
    ]);
    const user = userEvent.setup();

    await renderList();
    const more = screen.getByRole('button', { name: 'Show more' });
    await user.click(more);

    expect(more).toHaveAttribute('aria-expanded', 'true');
    expect(more).toHaveTextContent('Show less');
    tall.mockRestore();
    shown.mockRestore();
  });

  it('offers nothing to open when the whole answer already shows', async () => {
    readSentRequests.mockResolvedValue([request([BEN_ANSWERED])]);

    await renderList();

    expect(screen.queryByRole('button', { name: 'Show more' })).toBeNull();
  });

  it('shows a Member asked who was Deactivated as inactive', async () => {
    readSentRequests.mockResolvedValue([
      request([{ ...CARA_WAITING, giverInactive: true }]),
    ]);

    await renderList();

    expect(screen.getByRole('article')).toHaveTextContent(
      'Still waiting for Cara Diaz (inactive).',
    );
  });

  it('points at asking somebody when nothing has been sent', async () => {
    readSentRequests.mockResolvedValue([]);

    await renderList();

    expect(
      screen.getByText(
        "You haven't asked anyone for feedback yet. Ask a teammate with the form above.",
      ),
    ).toBeInTheDocument();
  });
});
