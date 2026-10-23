import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignInPrompt } from './sign-in-prompt';

const signIn = vi.fn<(destination: string | null) => Promise<void>>();
vi.mock('@/lib/session/session-actions.service', () => ({
  signIn: (destination: string | null) => signIn(destination),
}));
vi.mock('@/components/atoms/one-time-toast', () => ({
  OneTimeToast: ({ type, message }: { type: string; message: string }) => (
    <output>{`${type} toast: ${message}`}</output>
  ),
}));

beforeEach(() => {
  signIn.mockReset().mockResolvedValue(undefined);
});

describe('SignInPrompt', () => {
  it('asks the visitor in and offers the one way in', () => {
    render(<SignInPrompt />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome to Thrive' }),
    ).toHaveClass('font-handwrite', 'text-subtitle-handwrite-1');
    expect(screen.getByRole('img', { name: 'Thrive' })).toBeInTheDocument();
    expect(screen.getByText('Thrive')).toHaveClass('text-fg-accent');
    expect(screen.getByText('Thrive').parentElement).toHaveTextContent(
      "Let's Thrive together.",
    );
    expect(screen.queryByText('sign in or sign up')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Continue with Google' }),
    ).toHaveAttribute('type', 'submit');
    expect(
      screen.queryByText("error toast: Sign-in didn't finish. Try again."),
    ).toBeNull();
  });

  it('signs in towards the page the visitor was going to', async () => {
    const destination =
      '/home?tab=waiting&ask=0199a0f0-0000-7000-8000-000000000001';
    render(<SignInPrompt destination={destination} />);

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Continue with Google' }));

    expect(signIn).toHaveBeenCalledWith(destination);
  });

  it('signs in towards nowhere in particular when the visitor came here by themselves', async () => {
    render(<SignInPrompt />);

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Continue with Google' }));

    expect(signIn).toHaveBeenCalledWith(null);
  });

  it('raises the failure toast when the last attempt did not finish', () => {
    render(<SignInPrompt didSignInFail />);

    expect(
      screen.getByText("error toast: Sign-in didn't finish. Try again."),
    ).toBeInTheDocument();
  });
});
