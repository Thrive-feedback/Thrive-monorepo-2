import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InviteResults } from './invite-results';

const RESULTS = [
  { email: 'pepper@stark.com', outcome: 'invited' },
  { email: 'happy@stark.com', outcome: 'already_member' },
  { email: 'rhodey@stark.com', outcome: 'already_invited' },
  { email: 'tony@stark.com', outcome: 'failed' },
] as const;

describe('InviteResults', () => {
  it('says what happened to each address, in the colour of how serious it is', () => {
    render(<InviteResults results={RESULTS} onContinue={vi.fn()} />);

    expect(screen.getByText('Invitation sent')).toHaveClass(
      'text-status-success-fg',
    );
    expect(screen.getByText('is already in this Workspace')).toHaveClass(
      'text-status-info-fg',
    );
    expect(screen.getByText('already has a pending Invitation')).toHaveClass(
      'text-status-warning-fg',
    );
    expect(screen.getByText("Couldn't send")).toHaveClass(
      'text-status-error-fg',
    );
  });

  it('moves focus to its heading when it replaces the form', () => {
    render(<InviteResults results={RESULTS} onContinue={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Invitations' })).toHaveFocus();
  });
});
