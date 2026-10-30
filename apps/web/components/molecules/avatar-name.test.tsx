import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AvatarName } from './avatar-name';

describe('AvatarName', () => {
  it('shows the name beside the face', () => {
    render(<AvatarName name="Mali Sombat" photoUrl={null} />);

    expect(screen.getByText('Mali Sombat')).toBeInTheDocument();
    expect(screen.getByText('MS')).toBeInTheDocument();
  });

  it('shows what it is given in place of the name, and still draws their face', () => {
    render(
      <AvatarName name="Mali Sombat" photoUrl={null}>
        <h3>Mali Sombat Lee</h3>
      </AvatarName>,
    );

    expect(
      screen.getByRole('heading', { name: 'Mali Sombat Lee' }),
    ).toBeInTheDocument();
    expect(screen.getByText('MS')).toBeInTheDocument();
  });

  it('says the name once to a screen reader: the face is hidden from it', () => {
    render(<AvatarName name="Mali Sombat" photoUrl={null} />);

    expect(screen.getByText('MS').closest('[aria-hidden="true"]')).toBeTruthy();
  });
});
