import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InvitationActionResult } from '@/app/(signed-in)/(member)/settings/members/_lib/invitation-actions.service';
import { RevokeInvitationButton } from './revoke-invitation-button';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';

const revokeInvitation =
  vi.fn<
    (
      workspaceId: string,
      invitationId: string,
    ) => Promise<InvitationActionResult>
  >();
vi.mock(
  '@/app/(signed-in)/(member)/settings/members/_lib/invitation-actions.service',
  () => ({
    revokeInvitation: (workspaceId: string, invitationId: string) =>
      revokeInvitation(workspaceId, invitationId),
  }),
);

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

const INVITATION_ID = '0199a0f0-0000-7000-8000-000000000003';

beforeEach(() => {
  revokeInvitation.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
});

async function openDialog() {
  const user = userEvent.setup();
  render(
    <RevokeInvitationButton
      workspaceId={WORKSPACE_ID}
      invitationId={INVITATION_ID}
      email="cat@acme.test"
    />,
  );
  await user.click(
    screen.getByRole('button', { name: 'Revoke Invitation to cat@acme.test' }),
  );
  return user;
}

describe('RevokeInvitationButton', () => {
  it('asks before revoking, naming who the Invitation was sent to', async () => {
    await openDialog();

    const dialog = screen.getByRole('alertdialog', {
      name: 'Revoke this Invitation?',
    });
    expect(dialog).toHaveAccessibleDescription(
      "cat@acme.test won't be able to join with it. You can invite them again later.",
    );
    expect(revokeInvitation).not.toHaveBeenCalled();
  });

  it('revokes once confirmed, and says so', async () => {
    revokeInvitation.mockResolvedValue({ ok: true });
    const user = await openDialog();

    await user.click(screen.getByRole('button', { name: 'Revoke' }));

    expect(revokeInvitation).toHaveBeenCalledWith(WORKSPACE_ID, INVITATION_ID);
    expect(toast.success).toHaveBeenCalledWith(
      'Invitation to cat@acme.test revoked',
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('says why when the revoke is refused', async () => {
    revokeInvitation.mockResolvedValue({
      ok: false,
      message: 'They have already joined.',
    });
    const user = await openDialog();

    await user.click(screen.getByRole('button', { name: 'Revoke' }));

    expect(toast.error).toHaveBeenCalledWith('They have already joined.');
  });

  it('keeps the Invitation when the person changes their mind, and gives focus back', async () => {
    const user = await openDialog();

    await user.click(screen.getByRole('button', { name: 'Keep Invitation' }));

    expect(revokeInvitation).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', {
        name: 'Revoke Invitation to cat@acme.test',
      }),
    ).toHaveFocus();
  });
});
