import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IntroduceYourselfCard } from './introduce-yourself-card';

vi.mock('@/lib/session/session-actions.service', () => ({
  signOut: vi.fn(),
}));
vi.mock('../_lib/profile-actions.service', () => ({
  saveProfile: vi.fn(),
}));

describe('IntroduceYourselfCard', () => {
  it('says who is signed in and offers a way out', () => {
    render(<IntroduceYourselfCard email="tony@stark.com" name="Tony Stark" />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Introduce yourself' }),
    ).toBeInTheDocument();
    expect(screen.getByText('tony@stark.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Not you?' })).toHaveAttribute(
      'type',
      'submit',
    );
  });

  it('starts Full Name from the name Google gave', () => {
    render(<IntroduceYourselfCard email="tony@stark.com" name="Tony Stark" />);

    expect(screen.getByRole('textbox', { name: 'Full Name' })).toHaveValue(
      'Tony Stark',
    );
  });
});
