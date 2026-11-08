import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InvitePeople } from './invite-people';

vi.mock(
  '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/invitation-actions.service',
  () => ({ inviteMembers: vi.fn() }),
);

describe('InvitePeople', () => {
  it('keeps the form shut until asked for', () => {
    render(<InvitePeople workspaceId="w-1" />);

    expect(
      screen.getByRole('button', { name: 'Invite people' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens the form in a dialog named for it, and gives focus back on closing', async () => {
    const user = userEvent.setup();
    render(<InvitePeople workspaceId="w-1" />);
    const trigger = screen.getByRole('button', { name: 'Invite people' });

    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Invite people' });
    expect(dialog).toHaveAccessibleDescription(
      'They get an email with a link to join. An Invitation lasts a week.',
    );
    expect(screen.getByRole('tab', { name: 'One by one' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
  it('closes on Cancel, and gives focus back', async () => {
    const user = userEvent.setup();
    render(<InvitePeople workspaceId="w-1" />);
    const trigger = screen.getByRole('button', { name: 'Invite people' });
    await user.click(trigger);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
