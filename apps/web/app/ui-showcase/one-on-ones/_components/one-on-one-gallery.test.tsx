import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock(
  '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-actions.service',
  () => ({
    acceptOneOnOne: vi.fn(),
    declineOneOnOne: vi.fn(),
    endOneOnOne: vi.fn(),
    inviteToOneOnOne: vi.fn(),
    rescheduleOneOnOne: vi.fn(),
    suggestAnotherTime: vi.fn(),
  }),
);

vi.mock(
  '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting-actions.service',
  () => ({
    addTopic: vi.fn(),
    finishMeeting: vi.fn(),
    removePreviewTopic: vi.fn(),
    removeTopic: vi.fn(),
    reorderPreviewTopics: vi.fn(),
    reorderTopics: vi.fn(),
    startMeeting: vi.fn(),
    updateTopic: vi.fn(),
  }),
);

vi.mock(
  '@/app/(signed-in)/(sidebar)/_lib/send-postcard-actions.service',
  () => ({
    sendPostcardFeedback: vi.fn(),
    sendPostcardRequest: vi.fn(),
    sendKudosCard: vi.fn(),
  }),
);

const { OneOnOneGallery } = await import('./one-on-one-gallery');

describe('OneOnOneGallery', () => {
  it('shows the open 1:1 in every state, each captioned', () => {
    render(<OneOnOneGallery />);

    for (const caption of [
      'Invitation, with a note',
      'Invitation, without a note',
      'Invitation, just once',
      'Another time suggested',
      'Running · weekly',
      'Running · monthly',
      'Running · every two weeks',
      'Running · just once',
      'Your invitation, waiting',
      'Your suggestion, waiting',
      'Declined, with a note',
      'Declined, without a note',
      'Schedule ended',
      'Met once',
    ]) {
      expect(
        screen.getByRole('heading', { level: 3, name: caption }),
      ).toBeInTheDocument();
    }
  });

  it('lists every group in its tab, and gives no two headings the same id', () => {
    const { container } = render(<OneOnOneGallery />);

    const [upcoming, pending, history, alone] = screen.getAllByRole(
      'navigation',
      { name: 'Your 1:1s' },
    );
    for (const [list, groups] of [
      [pending, ['Needs your answer', 'Waiting on them']],
      [history, ['Declined', 'Ended']],
    ] as const) {
      for (const group of groups) {
        expect(
          within(list as HTMLElement).getByRole('heading', {
            name: new RegExp(`^${group}`),
          }),
        ).toBeInTheDocument();
      }
    }
    expect(
      within(upcoming as HTMLElement).getByRole('tab', { name: /Upcoming/ }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      within(alone as HTMLElement).queryByRole('tablist'),
    ).not.toBeInTheDocument();
    const ids = [...container.querySelectorAll('[id]')].map(
      (element) => element.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('offers the one way to begin, and the empty page', () => {
    render(<OneOnOneGallery />);

    expect(screen.getByRole('button', { name: 'Create 1:1' })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Ask for a 1:1' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('No 1:1s yet')).toBeInTheDocument();
  });
});
