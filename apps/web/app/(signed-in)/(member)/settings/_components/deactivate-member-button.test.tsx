import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemberDeactivationResult } from '../_lib/member-deactivation-actions.service';
import { DeactivateMemberButton } from './deactivate-member-button';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';

const deactivateMember =
  vi.fn<
    (
      workspaceId: string,
      accountId: string,
    ) => Promise<MemberDeactivationResult>
  >();
const leaveWorkspace =
  vi.fn<
    (
      workspaceId: string,
      accountId: string,
    ) => Promise<MemberDeactivationResult>
  >();
vi.mock(
  '@/app/(signed-in)/(member)/settings/_lib/member-deactivation-actions.service',
  () => ({
    deactivateMember: (workspaceId: string, accountId: string) =>
      deactivateMember(workspaceId, accountId),
    leaveWorkspace: (workspaceId: string, accountId: string) =>
      leaveWorkspace(workspaceId, accountId),
  }),
);

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

beforeEach(() => {
  deactivateMember.mockReset();
  leaveWorkspace.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
});

describe('DeactivateMemberButton', () => {
  it('asks first, naming the person and saying their Feedback stays', async () => {
    const user = userEvent.setup();
    render(
      <DeactivateMemberButton
        workspaceId={WORKSPACE_ID}
        accountId="a-2"
        name="Ben"
        workspaceName="Acme"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Deactivate Ben' }));

    const dialog = screen.getByRole('dialog', { name: 'Deactivate Ben?' });
    expect(dialog).toHaveTextContent(
      "They won't be able to open Acme any more. The Feedback they gave and received stays, with “(inactive)” after their name, until an Admin reactivates them.",
    );
    expect(deactivateMember).not.toHaveBeenCalled();
  });

  it('dims the page behind the question, as every dialog does', async () => {
    const user = userEvent.setup();
    render(
      <DeactivateMemberButton
        workspaceId={WORKSPACE_ID}
        accountId="a-2"
        name="Ben"
        workspaceName="Acme"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Deactivate Ben' }));

    expect(
      document.querySelector('[data-slot="dialog-overlay"]'),
    ).toBeInTheDocument();
  });

  it('Deactivates them once confirmed, and says so', async () => {
    deactivateMember.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(
      <DeactivateMemberButton
        workspaceId={WORKSPACE_ID}
        accountId="a-2"
        name="Ben"
        workspaceName="Acme"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Deactivate Ben' }));
    await user.click(screen.getByRole('button', { name: 'Deactivate' }));

    expect(deactivateMember).toHaveBeenCalledWith(WORKSPACE_ID, 'a-2');
    expect(toast.success).toHaveBeenCalledWith('Ben was deactivated');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps them when the Admin changes their mind', async () => {
    const user = userEvent.setup();
    render(
      <DeactivateMemberButton
        workspaceId={WORKSPACE_ID}
        accountId="a-2"
        name="Ben"
        workspaceName="Acme"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Deactivate Ben' }));
    await user.click(screen.getByRole('button', { name: 'Keep Ben' }));

    expect(deactivateMember).not.toHaveBeenCalled();
  });

  it('says why when the API refuses', async () => {
    deactivateMember.mockResolvedValue({
      ok: false,
      message: 'Make someone else an Admin first.',
    });
    const user = userEvent.setup();
    render(
      <DeactivateMemberButton
        workspaceId={WORKSPACE_ID}
        accountId="a-2"
        name="Ben"
        workspaceName="Acme"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Deactivate Ben' }));
    await user.click(screen.getByRole('button', { name: 'Deactivate' }));

    expect(toast.error).toHaveBeenCalledWith(
      'Make someone else an Admin first.',
    );
  });

  it('asks the person leaving about their own Workspace, and leaves once confirmed', async () => {
    leaveWorkspace.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(
      <DeactivateMemberButton
        workspaceId={WORKSPACE_ID}
        accountId="a-2"
        name="Ben"
        workspaceName="Acme"
        isSelf
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Leave Workspace' }));
    expect(
      screen.getByRole('dialog', { name: 'Leave Acme?' }),
    ).toHaveTextContent(
      "You won't be able to open Acme again. The Feedback you gave and received stays, with “(inactive)” after your name.",
    );
    expect(
      screen.getByRole('button', { name: 'Stay in Acme' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Leave Acme' }));

    expect(leaveWorkspace).toHaveBeenCalledWith(WORKSPACE_ID, 'a-2');
    expect(deactivateMember).not.toHaveBeenCalled();
  });
});
