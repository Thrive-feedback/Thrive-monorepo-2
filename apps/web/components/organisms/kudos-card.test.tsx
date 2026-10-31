import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  it('names who gave it and everyone it is for, marked as Kudos by its badge', () => {
    render(<KudosCard item={kudos()} />);

    expect(screen.getByRole('banner')).toHaveTextContent(/^ALAnn Leeto/);
    expect(
      screen.getByRole('button', {
        name: 'Ben Carter, Cara Diaz, and Dee Park. Show who it is for',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Kudos')).toHaveAttribute('data-slot', 'badge');
    expect(screen.getByText('@Ben')).toBeInTheDocument();
  });

  it('says a Kudos that names nobody went to the whole Workspace', () => {
    render(<KudosCard item={kudos({ recipients: [] })} />);

    expect(screen.getByRole('banner')).toHaveTextContent(
      /Ann Leetothe whole Workspace/,
    );
  });

  it('says in the dialog of several recipients that the Giver sent them all this Kudos', async () => {
    const user = userEvent.setup();
    render(<KudosCard item={kudos()} />);

    await user.click(
      screen.getByRole('button', { name: /Show who it is for/ }),
    );

    expect(
      screen.getByRole('dialog', { name: 'For 3 people' }),
    ).toHaveTextContent('Ann Lee sent this Kudos to all of them.');
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

    expect(screen.getByRole('banner')).toHaveTextContent(
      'A teammatetoBCBen Carter (inactive)',
    );
  });
});
