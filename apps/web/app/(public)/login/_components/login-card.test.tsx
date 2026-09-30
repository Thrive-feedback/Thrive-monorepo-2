import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LoginCard } from './login-card';

vi.mock('@/app/(public)/_lib/mock-session.service', () => ({
  signIn: vi.fn(),
}));

describe('LoginCard', () => {
  it('welcomes the visitor and offers the one way in', () => {
    render(<LoginCard />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome to Thrive' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Continue with Google' }),
    ).toBeInTheDocument();
  });
});
