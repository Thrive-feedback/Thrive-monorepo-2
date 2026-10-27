import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { photosWill } from '@/lib/test/photos-will';
import { AvatarGroupButton } from './avatar-group-button';

const PEOPLE = [
  { id: 'mali', name: 'Mali Sombat', photoUrl: null },
  { id: 'krit', name: 'Krit Chan', photoUrl: null },
  { id: 'ann', name: 'Ann Lee', photoUrl: null },
  { id: 'ben', name: 'Ben Park', photoUrl: null },
  { id: 'dao', name: 'Dao Prasert', photoUrl: null },
];

const MALI_PHOTO = 'https://lh3.googleusercontent.com/a/mali=s96-c';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AvatarGroupButton', () => {
  it("shows each person's Google photo, and initials for someone without one", async () => {
    photosWill('load');
    const people = [
      { id: 'mali', name: 'Mali Sombat', photoUrl: MALI_PHOTO },
      ...PEOPLE.slice(1),
    ];

    const { container } = render(
      <AvatarGroupButton people={people} label="Choose who to ask" />,
    );

    await vi.waitFor(() =>
      expect(container.querySelector('img')).toHaveAttribute('src', MALI_PHOTO),
    );
    expect(screen.queryByText('MS')).not.toBeInTheDocument();
    expect(screen.getByText('KC')).toBeInTheDocument();
  });

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
