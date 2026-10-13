import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InvitationActionResult } from '@/app/(signed-in)/(member)/settings/members/_lib/invitation-actions.service';
import { ResendInvitationButton } from './resend-invitation-button';

const resendInvitation =
  vi.fn<(invitationId: string) => Promise<InvitationActionResult>>();
vi.mock(
  '@/app/(signed-in)/(member)/settings/members/_lib/invitation-actions.service',
  () => ({
    resendInvitation: (invitationId: string) => resendInvitation(invitationId),
  }),
);

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

const INVITATION_ID = '0199a0f0-0000-7000-8000-000000000003';

beforeEach(() => {
  resendInvitation.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
});

async function openDialog() {
  const user = userEvent.setup();
  render(
    <ResendInvitationButton
      invitationId={INVITATION_ID}
      email="cat@acme.test"
    />,
  );
  await user.click(
    screen.getByRole('button', { name: 'Resend invitation to cat@acme.test' }),
  );
  return user;
}

describe('ResendInvitationButton', () => {
  it('asks before resending, naming who the Invitation was sent to', async () => {
    await openDialog();

    const dialog = screen.getByRole('alertdialog', {
      name: 'Send this invitation again?',
    });
    expect(dialog).toHaveAccessibleDescription(
      'cat@acme.test will get a new email, and the invitation will be good for another 7 days.',
    );
    expect(resendInvitation).not.toHaveBeenCalled();
  });

  it('resends once confirmed, and says so', async () => {
    resendInvitation.mockResolvedValue({ ok: true });
    const user = await openDialog();

    await user.click(screen.getByRole('button', { name: 'Resend' }));

    expect(resendInvitation).toHaveBeenCalledWith(INVITATION_ID);
    expect(toast.success).toHaveBeenCalledWith(
      'Invitation sent again to cat@acme.test',
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('says why when the resend is refused', async () => {
    resendInvitation.mockResolvedValue({
      ok: false,
      message: 'You sent this a moment ago. Try again in a few minutes.',
    });
    const user = await openDialog();

    await user.click(screen.getByRole('button', { name: 'Resend' }));

    expect(toast.error).toHaveBeenCalledWith(
      'You sent this a moment ago. Try again in a few minutes.',
    );
  });

  it('sends nothing when the person changes their mind, and gives focus back', async () => {
    const user = await openDialog();

    await user.click(screen.getByRole('button', { name: 'Not now' }));

    expect(resendInvitation).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', {
        name: 'Resend invitation to cat@acme.test',
      }),
    ).toHaveFocus();
  });
});
