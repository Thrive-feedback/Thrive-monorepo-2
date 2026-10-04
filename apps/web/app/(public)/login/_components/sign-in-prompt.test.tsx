import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/lib/test/render-with-intl';
import { SignInPrompt } from './sign-in-prompt';

vi.mock('@/app/(public)/_lib/mock-session.service', () => ({
  signIn: vi.fn(),
}));

describe('SignInPrompt', () => {
  it('asks the visitor in and offers the one way in', () => {
    renderWithIntl(<SignInPrompt />);

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

  it('asks in Thai when the language is Thai', () => {
    renderWithIntl(<SignInPrompt />, { locale: 'th' });

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'พร้อมจะ Thrive แล้วหรือยัง?',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'ดำเนินการต่อด้วย Google' }),
    ).toBeInTheDocument();
  });
});
