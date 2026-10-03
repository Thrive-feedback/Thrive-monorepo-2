import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SignInPrompt } from './sign-in-prompt';

vi.mock('@/lib/session/session-actions.service', () => ({
  signIn: vi.fn(),
}));
vi.mock('@/components/atoms/one-time-toast', () => ({
  OneTimeToast: ({ type, message }: { type: string; message: string }) => (
    <output>{`${type} toast: ${message}`}</output>
  ),
}));

describe('SignInPrompt', () => {
  it('asks the visitor in and offers the one way in', () => {
    render(<SignInPrompt />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Are you ready to Thrive?',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('sign in or sign up')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Continue with Google' }),
    ).toHaveAttribute('type', 'submit');
    expect(
      screen.queryByText("error toast: Sign-in didn't finish. Try again."),
    ).toBeNull();
  });

  it('raises the failure toast when the last attempt did not finish', () => {
    render(<SignInPrompt didSignInFail />);

    expect(
      screen.getByText("error toast: Sign-in didn't finish. Try again."),
    ).toBeInTheDocument();
  });
});
