import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RevokeInvitationResult } from '@/app/(signed-in)/home/_lib/invitation-actions.service';
import { RevokeInvitationButton } from './revoke-invitation-button';

const revokeInvitation =
  vi.fn<(invitationId: string) => Promise<RevokeInvitationResult>>();
vi.mock('@/app/(signed-in)/home/_lib/invitation-actions.service', () => ({
  revokeInvitation: (invitationId: string) => revokeInvitation(invitationId),
}));

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
      invitationId={INVITATION_ID}
      email="cat@acme.test"
    />,
  );
  await user.click(
    screen.getByRole('button', { name: 'Revoke invitation to cat@acme.test' }),
  );
  return user;
}

describe('RevokeInvitationButton', () => {
  it('asks before revoking, naming who the Invitation was sent to', async () => {
    await openDialog();

    const dialog = screen.getByRole('alertdialog', {
      name: 'Revoke this invitation?',
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

    expect(revokeInvitation).toHaveBeenCalledWith(INVITATION_ID);
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

    await user.click(screen.getByRole('button', { name: 'Keep it' }));

    expect(revokeInvitation).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', {
        name: 'Revoke invitation to cat@acme.test',
      }),
    ).toHaveFocus();
  });
});
