import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { KudosItem } from '@/lib/feedback/kudos-item.type';
import { KudosCard } from './kudos-card';

const NO_TAGS = { workspaceGoals: [], mentions: [] };

function kudos(overrides: Partial<KudosItem> = {}): KudosItem {
  return {
    id: 'kudos-1',
    giver: { name: 'Ann Lee', inactive: false },
    recipients: [
      { name: 'Ben Carter', inactive: false },
      { name: 'Cara Diaz', inactive: false },
      { name: 'Dee Park', inactive: false },
    ],
    message: '@ben carried the launch.',
    messageTags: {
      workspaceGoals: [],
      mentions: [{ slug: 'ben', displayName: 'Ben' }],
    },
    givenAt: '2026-10-24T03:00:00.000Z',
    ...overrides,
  };
}

describe('KudosCard', () => {
  it('names who gave it and everyone it is for, marked as Kudos', () => {
    render(<KudosCard item={kudos()} />);

    expect(screen.getByRole('article')).toHaveTextContent(
      'Ann Lee to Ben Carter, Cara Diaz and Dee Park',
    );
    expect(screen.getByText('Kudos')).toBeInTheDocument();
    expect(screen.getByText('@Ben')).toBeInTheDocument();
  });

  it('shows somebody Deactivated as inactive, and somebody unnamed as a teammate', () => {
    render(
      <KudosCard
        item={kudos({
          giver: { name: null, inactive: false },
          recipients: [{ name: 'Ben Carter', inactive: true }],
          messageTags: NO_TAGS,
        })}
      />,
    );

    expect(screen.getByRole('article')).toHaveTextContent(
      'A teammate to Ben Carter (inactive)',
    );
  });
});
