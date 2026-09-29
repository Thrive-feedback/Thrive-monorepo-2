import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoginCard } from './login-card';

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
