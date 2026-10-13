import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ReactionBar } from './reaction-bar';

describe('ReactionBar', () => {
  it('offers the four Reactions, each with how many reacted', () => {
    render(<ReactionBar reactions={{ '👏': ['Ann Lee', 'Ben Carter'] }} />);

    expect(
      screen
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Clap, 2', 'Heart, 0', 'Idea, 0', 'Thanks, 0']);
  });

  it('names who reacted', () => {
    render(<ReactionBar reactions={{ '👏': ['Ann Lee', 'Ben Carter'] }} />);

    expect(screen.getByRole('button', { name: 'Clap, 2' })).toHaveAttribute(
      'title',
      'Ann Lee, Ben Carter',
    );
  });

  it('adds the person’s own Reaction, and takes it back', async () => {
    const user = userEvent.setup();
    render(<ReactionBar reactions={{ '👏': ['Ann Lee'] }} />);

    await user.click(screen.getByRole('button', { name: 'Clap, 1' }));

    const clap = screen.getByRole('button', { name: 'Clap, 2' });
    expect(clap).toHaveAttribute('aria-pressed', 'true');
    expect(clap).toHaveAttribute('title', 'You, Ann Lee');

    await user.click(clap);

    expect(screen.getByRole('button', { name: 'Clap, 1' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
