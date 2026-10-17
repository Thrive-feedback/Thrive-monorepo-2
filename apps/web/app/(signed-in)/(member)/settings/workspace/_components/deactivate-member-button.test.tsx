import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemberDeactivationResult } from '../_lib/member-deactivation-actions.service';
import { DeactivateMemberButton } from './deactivate-member-button';

const deactivateMember =
  vi.fn<(accountId: string) => Promise<MemberDeactivationResult>>();
const leaveWorkspace =
  vi.fn<(accountId: string) => Promise<MemberDeactivationResult>>();
vi.mock(
  '@/app/(signed-in)/(member)/settings/workspace/_lib/member-deactivation-actions.service',
  () => ({
    deactivateMember: (accountId: string) => deactivateMember(accountId),
    leaveWorkspace: (accountId: string) => leaveWorkspace(accountId),
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
        accountId="a-2"
        name="Ben"
        workspaceName="Acme"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Deactivate Ben' }));

    const dialog = screen.getByRole('alertdialog', { name: 'Deactivate Ben?' });
    expect(dialog).toHaveTextContent(
      "They won't be able to open Acme any more. The Feedback they gave and received stays, with “Deactivated” beside their name.",
    );
    expect(deactivateMember).not.toHaveBeenCalled();
  });

  it('Deactivates them once confirmed, and says so', async () => {
    deactivateMember.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(
      <DeactivateMemberButton
        accountId="a-2"
        name="Ben"
        workspaceName="Acme"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Deactivate Ben' }));
    await user.click(screen.getByRole('button', { name: 'Deactivate' }));

    expect(deactivateMember).toHaveBeenCalledWith('a-2');
    expect(toast.success).toHaveBeenCalledWith('Ben was Deactivated');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('keeps them when the Admin changes their mind', async () => {
    const user = userEvent.setup();
    render(
      <DeactivateMemberButton
        accountId="a-2"
        name="Ben"
        workspaceName="Acme"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Deactivate Ben' }));
    await user.click(screen.getByRole('button', { name: 'Keep them' }));

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
        accountId="a-2"
        name="Ben"
        workspaceName="Acme"
        isSelf
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Leave Workspace' }));
    expect(
      screen.getByRole('alertdialog', { name: 'Leave Acme?' }),
    ).toHaveTextContent(
      "You won't be able to open Acme again. The Feedback you gave and received stays, with “Deactivated” beside your name.",
    );
    await user.click(
      screen
        .getAllByRole('button', { name: 'Leave Workspace' })
        .at(-1) as HTMLElement,
    );

    expect(leaveWorkspace).toHaveBeenCalledWith('a-2');
    expect(deactivateMember).not.toHaveBeenCalled();
  });
});
