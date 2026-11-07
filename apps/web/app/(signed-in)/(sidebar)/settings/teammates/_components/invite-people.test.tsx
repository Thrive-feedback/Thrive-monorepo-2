import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InvitePeople } from './invite-people';

vi.mock(
  '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/invitation-actions.service',
  () => ({ inviteMembers: vi.fn() }),
);

describe('InvitePeople', () => {
  it('keeps the invite card shut until asked for', () => {
    render(<InvitePeople workspaceId="w-1" />);

    expect(
      screen.getByRole('button', { name: 'Invite people' }),
    ).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Invite people' }),
    ).toBeNull();
  });

  it('opens the card and takes focus to it, then gives focus back on closing', async () => {
    const user = userEvent.setup();
    render(<InvitePeople workspaceId="w-1" />);
    const toggle = screen.getByRole('button', { name: 'Invite people' });

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const title = screen.getByRole('heading', {
      level: 2,
      name: 'Invite people',
    });
    await waitFor(() => expect(title).toHaveFocus());

    await user.click(
      screen.getByRole('button', { name: 'Close Invite people' }),
    );

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
  });
});
