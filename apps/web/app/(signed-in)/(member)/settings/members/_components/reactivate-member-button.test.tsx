import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemberDeactivationResult } from '@/app/(signed-in)/(member)/settings/_lib/member-deactivation-actions.service';
import { ReactivateMemberButton } from './reactivate-member-button';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';

const reactivateMember =
  vi.fn<
    (
      workspaceId: string,
      accountId: string,
    ) => Promise<MemberDeactivationResult>
  >();
vi.mock(
  '@/app/(signed-in)/(member)/settings/_lib/member-deactivation-actions.service',
  () => ({
    reactivateMember: (workspaceId: string, accountId: string) =>
      reactivateMember(workspaceId, accountId),
  }),
);

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

beforeEach(() => {
  reactivateMember.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
});

describe('ReactivateMemberButton', () => {
  it('asks first, naming the person and the Role they come back with', async () => {
    const user = userEvent.setup();
    render(
      <ReactivateMemberButton
        workspaceId={WORKSPACE_ID}
        accountId="a-2"
        name="Ben"
        memberRole="ADMIN"
        workspaceName="Acme"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Reactivate Ben' }));

    const dialog = screen.getByRole('dialog', { name: 'Reactivate Ben?' });
    expect(dialog).toHaveTextContent(
      "They'll be able to open Acme again, as an Admin, and read the Feedback they gave and received there.",
    );
    expect(reactivateMember).not.toHaveBeenCalled();
  });

  it('Reactivates them once confirmed, and says so', async () => {
    reactivateMember.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(
      <ReactivateMemberButton
        workspaceId={WORKSPACE_ID}
        accountId="a-2"
        name="Ben"
        memberRole="MEMBER"
        workspaceName="Acme"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Reactivate Ben' }));
    await user.click(
      screen.getByRole('button', { name: 'Reactivate as Member' }),
    );

    expect(reactivateMember).toHaveBeenCalledWith(WORKSPACE_ID, 'a-2');
    expect(toast.success).toHaveBeenCalledWith('Ben was reactivated');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('leaves them inactive when the Admin changes their mind', async () => {
    const user = userEvent.setup();
    render(
      <ReactivateMemberButton
        workspaceId={WORKSPACE_ID}
        accountId="a-2"
        name="Ben"
        memberRole="MEMBER"
        workspaceName="Acme"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Reactivate Ben' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(reactivateMember).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('says why when the API refuses', async () => {
    reactivateMember.mockResolvedValue({
      ok: false,
      message: 'Only Admins can reactivate people.',
    });
    const user = userEvent.setup();
    render(
      <ReactivateMemberButton
        workspaceId={WORKSPACE_ID}
        accountId="a-2"
        name="Ben"
        memberRole="MEMBER"
        workspaceName="Acme"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Reactivate Ben' }));
    await user.click(
      screen.getByRole('button', { name: 'Reactivate as Member' }),
    );

    expect(toast.error).toHaveBeenCalledWith(
      'Only Admins can reactivate people.',
    );
  });
});
