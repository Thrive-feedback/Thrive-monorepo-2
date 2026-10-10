import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import InvitationPage from './page';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('notFound');
  }),
}));

function open(invitationId: string) {
  return InvitationPage({ params: Promise.resolve({ invitationId }) });
}

describe('InvitationPage', () => {
  it('tells someone following an Accept link that joining opens soon', async () => {
    render(await open('0199a0f0-0000-7000-8000-000000000001'));

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: "You've been invited to Thrive",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Joining opens soon/)).toBeInTheDocument();
  });

  it('answers not found for a link that carries no Invitation id', async () => {
    await expect(open('not-an-id')).rejects.toThrow('notFound');
  });
});
