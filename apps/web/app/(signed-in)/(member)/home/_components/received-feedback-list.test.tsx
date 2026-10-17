import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReceivedFeedbackList } from './received-feedback-list';

const readReceivedFeedback = vi.fn();
vi.mock(
  '@/app/(signed-in)/(member)/home/_lib/received-feedback.service',
  () => ({
    readReceivedFeedback: (...args: unknown[]) => readReceivedFeedback(...args),
  }),
);

const MEMBERSHIP = {
  workspace: { id: 'w-1', name: 'Acme Corp' },
  role: 'MEMBER',
} as const;

const ONE_PIECE = {
  id: 'fb-1',
  topic: 'my presentation skills',
  offered: false,
  giverName: 'Ben Carter',
  body: 'You open strongly and lose the room at the detail.',
  writtenAt: '2026-10-11T03:00:00.000Z',
};

async function renderList() {
  render(await ReceivedFeedbackList({ membership: MEMBERSHIP }));
}

describe('ReceivedFeedbackList', () => {
  it('reads the Feedback of the person’s own Workspace', async () => {
    readReceivedFeedback.mockResolvedValue([]);

    await renderList();

    expect(readReceivedFeedback).toHaveBeenCalledWith(MEMBERSHIP);
  });

  it('shows what was written, who wrote it, and when', async () => {
    readReceivedFeedback.mockResolvedValue([ONE_PIECE]);

    await renderList();

    // Level 2, under Home's own h1: a skipped level leaves a screen reader guessing.
    expect(
      screen.getByRole('heading', { level: 2, name: 'my presentation skills' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/From Ben Carter/)).toBeInTheDocument();
    expect(screen.getByText('11 Oct 2026')).toBeInTheDocument();
    expect(
      screen.getByText('You open strongly and lose the room at the detail.'),
    ).toBeInTheDocument();
  });

  it('shows a Giver who was Deactivated as inactive, and keeps what they wrote', async () => {
    readReceivedFeedback.mockResolvedValue([
      { ...ONE_PIECE, giverInactive: true },
    ]);

    await renderList();

    expect(screen.getByText('Ben Carter (inactive)')).toBeInTheDocument();
    expect(
      screen.getByText('You open strongly and lose the room at the detail.'),
    ).toBeInTheDocument();
  });

  it('marks Feedback given without being asked, and only that', async () => {
    readReceivedFeedback.mockResolvedValue([
      { ...ONE_PIECE, id: 'fb-2', topic: 'the customer demo', offered: true },
      ONE_PIECE,
    ]);

    await renderList();

    expect(screen.getAllByText(/Given without a request/)).toHaveLength(1);
  });

  it('keeps the line breaks the Giver wrote', async () => {
    readReceivedFeedback.mockResolvedValue([
      { ...ONE_PIECE, body: 'First point.\n\nSecond point.' },
    ]);

    await renderList();

    const body = screen.getByText(/First point\./);
    expect(body).toHaveClass('whitespace-pre-wrap');
    expect(body.textContent).toBe('First point.\n\nSecond point.');
  });

  it('calls the Giver a teammate while they have not introduced themselves', async () => {
    readReceivedFeedback.mockResolvedValue([{ ...ONE_PIECE, giverName: null }]);

    await renderList();

    expect(screen.getByText(/From a teammate/)).toBeInTheDocument();
  });

  it('says so when nobody has written anything', async () => {
    readReceivedFeedback.mockResolvedValue([]);

    await renderList();

    expect(
      screen.getByText(
        'No one has written you feedback yet. Ask a teammate with the form above.',
      ),
    ).toBeInTheDocument();
  });
});
