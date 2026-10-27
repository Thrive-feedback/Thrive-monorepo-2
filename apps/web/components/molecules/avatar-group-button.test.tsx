import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AvatarGroupButton } from './avatar-group-button';

const PEOPLE = [
  { id: 'mali', name: 'Mali Sombat' },
  { id: 'krit', name: 'Krit Chan' },
  { id: 'ann', name: 'Ann Lee' },
  { id: 'ben', name: 'Ben Park' },
  { id: 'dao', name: 'Dao Prasert' },
];

describe('AvatarGroupButton', () => {
  it('is the "+" alone, named by what it does, while nobody is chosen', () => {
    render(<AvatarGroupButton people={[]} label="Choose who to ask" />);

    expect(
      screen.getByRole('button', { name: 'Choose who to ask' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('MS')).not.toBeInTheDocument();
  });

  it('names everyone chosen after what it does, those past four included', () => {
    render(<AvatarGroupButton people={PEOPLE} label="Choose who to ask" />);

    expect(
      screen.getByRole('button', {
        name: 'Choose who to ask. Chosen: Mali Sombat, Krit Chan, Ann Lee, Ben Park, and Dao Prasert',
      }),
    ).toBeInTheDocument();
    for (const initials of ['MS', 'KC', 'AL', 'BP']) {
      expect(screen.getByText(initials)).toBeInTheDocument();
    }
    expect(screen.queryByText('DP')).not.toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('is marked invalid when somebody must be chosen', () => {
    render(<AvatarGroupButton people={[]} label="Choose who to ask" invalid />);

    expect(screen.getByRole('button')).toHaveAttribute('aria-invalid', 'true');
  });

  it('is pressed as one button, faces and "+" alike', async () => {
    const onClick = vi.fn();
    render(
      <AvatarGroupButton
        people={PEOPLE}
        label="Choose who to ask"
        onClick={onClick}
      />,
    );

    await userEvent.click(screen.getByText('KC'));
    expect(screen.getByRole('button')).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
