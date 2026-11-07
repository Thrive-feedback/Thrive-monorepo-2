import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InvitationNotFound } from './invitation-not-found';

describe('InvitationNotFound', () => {
  it('says the invitation cannot be found, why, and the way back in', () => {
    render(<InvitationNotFound />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: "We can't find this invitation.",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(/ask whoever invited you to send a new one/),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Sign in to Thrive' }),
    ).toHaveAttribute('href', '/signin');
  });
});
