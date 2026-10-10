import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GoogleSignInButton } from './google-sign-in-button';

describe('GoogleSignInButton', () => {
  it('is a button named for what it does', () => {
    render(<GoogleSignInButton />);

    expect(
      screen.getByRole('button', { name: 'Continue with Google' }),
    ).toBeInTheDocument();
  });

  it('is reached from the keyboard', async () => {
    const user = userEvent.setup();
    render(<GoogleSignInButton />);

    await user.tab();

    expect(
      screen.getByRole('button', { name: 'Continue with Google' }),
    ).toHaveFocus();
  });

  it('reports a click to whoever handles it', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<GoogleSignInButton onClick={handleClick} />);

    await user.click(
      screen.getByRole('button', { name: 'Continue with Google' }),
    );

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
