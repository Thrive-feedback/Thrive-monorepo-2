import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IntroduceYourselfCard } from './introduce-yourself-card';

vi.mock('@/app/(public)/_lib/mock-session.service', () => ({
  signOut: vi.fn(),
}));

describe('IntroduceYourselfCard', () => {
  it('says who is signed in and offers a way out', () => {
    render(<IntroduceYourselfCard email="tony@stark.com" />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Introduce yourself' }),
    ).toBeInTheDocument();
    expect(screen.getByText('tony@stark.com')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Not you?' }),
    ).toBeInTheDocument();
  });
});
