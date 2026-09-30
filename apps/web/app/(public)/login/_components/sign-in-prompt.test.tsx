import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SignInPrompt } from './sign-in-prompt';

vi.mock('@/app/(public)/_lib/mock-session.service', () => ({
  signIn: vi.fn(),
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
  });
});
