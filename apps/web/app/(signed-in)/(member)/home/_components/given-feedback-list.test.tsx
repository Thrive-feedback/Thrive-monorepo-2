import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { GivenFeedbackList } from './given-feedback-list';

const readGivenFeedback = vi.fn();
vi.mock('@/app/(signed-in)/(member)/home/_lib/given-feedback.service', () => ({
  readGivenFeedback: (...args: unknown[]) => readGivenFeedback(...args),
}));

const MEMBERSHIP = {
  workspace: { id: 'w-1', name: 'Acme Corp' },
  role: 'MEMBER',
} as const;

const ONE_PIECE = {
  id: 'fb-1',
  topic: 'the customer demo',
  topicTags: NO_TEXT_TAGS,
  offered: false,
  receiverName: 'Cara Diaz',
  receiverInactive: false,
  body: 'You kept the room with you when the demo broke.',
  bodyTags: NO_TEXT_TAGS,
  writtenAt: '2026-10-12T03:00:00.000Z',
};

async function renderList() {
  render(await GivenFeedbackList({ membership: MEMBERSHIP }));
}

describe('GivenFeedbackList', () => {
  it('reads the Feedback of the person’s own Workspace', async () => {
    readGivenFeedback.mockResolvedValue([]);

    await renderList();

    expect(readGivenFeedback).toHaveBeenCalledWith(MEMBERSHIP);
  });

  it('shows what was written, whom it was for, and when', async () => {
    readGivenFeedback.mockResolvedValue([ONE_PIECE]);

    await renderList();

    expect(
      screen.getByRole('heading', { level: 2, name: 'the customer demo' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/To Cara Diaz/)).toBeInTheDocument();
    expect(screen.getByText('12 Oct 2026')).toBeInTheDocument();
    expect(
      screen.getByText('You kept the room with you when the demo broke.'),
    ).toBeInTheDocument();
  });

  it('shows a Receiver who was Deactivated as inactive, and keeps what was written', async () => {
    readGivenFeedback.mockResolvedValue([
      { ...ONE_PIECE, receiverInactive: true },
    ]);

    await renderList();

    expect(screen.getByText('Cara Diaz (inactive)')).toBeInTheDocument();
    expect(
      screen.getByText('You kept the room with you when the demo broke.'),
    ).toBeInTheDocument();
  });

  it('marks Feedback given without being asked, and only that', async () => {
    readGivenFeedback.mockResolvedValue([
      { ...ONE_PIECE, id: 'fb-2', topic: 'the release notes', offered: true },
      ONE_PIECE,
    ]);

    await renderList();

    expect(screen.getAllByText(/Given without a request/)).toHaveLength(1);
  });

  it('calls the Receiver a teammate while they have not introduced themselves', async () => {
    readGivenFeedback.mockResolvedValue([{ ...ONE_PIECE, receiverName: null }]);

    await renderList();

    expect(screen.getByText(/To a teammate/)).toBeInTheDocument();
  });

  it('says so when they have given nothing', async () => {
    readGivenFeedback.mockResolvedValue([]);

    await renderList();

    expect(
      screen.getByText(
        'You haven’t given anyone feedback yet. Give a teammate some with the form above.',
      ),
    ).toBeInTheDocument();
  });
});
