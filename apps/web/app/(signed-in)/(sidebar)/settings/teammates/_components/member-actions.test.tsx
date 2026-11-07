import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemberDeactivationResult } from '@/app/(signed-in)/(sidebar)/settings/_lib/member-deactivation-actions.service';
import type { MemberRoleActionResult } from '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/member-role-actions.service';
import type { MemberRole } from '@/lib/session/current-account.type';
import { InactiveMemberActions, MemberActions } from './member-actions';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const WORKSPACE = { workspaceId: WORKSPACE_ID, workspaceName: 'Acme' };

const changeMemberRole =
  vi.fn<
    (
      workspaceId: string,
      accountId: string,
      role: MemberRole,
    ) => Promise<MemberRoleActionResult>
  >();
vi.mock(
  '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/member-role-actions.service',
  () => ({
    changeMemberRole: (
      workspaceId: string,
      accountId: string,
      role: MemberRole,
    ) => changeMemberRole(workspaceId, accountId, role),
  }),
);

const deactivateMember =
  vi.fn<
    (
      workspaceId: string,
      accountId: string,
    ) => Promise<MemberDeactivationResult>
  >();
vi.mock(
  '@/app/(signed-in)/(sidebar)/settings/_lib/member-deactivation-actions.service',
  () => ({
    deactivateMember: (workspaceId: string, accountId: string) =>
      deactivateMember(workspaceId, accountId),
    leaveWorkspace: vi.fn(),
    reactivateMember: vi.fn(),
  }),
);

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

beforeEach(() => {
  changeMemberRole.mockReset();
  deactivateMember.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
});

/** Picks a Role from the badge that shows it, named for whose Role it is. */
async function pick(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  role: 'Admin' | 'Member',
) {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(screen.getByRole('option', { name: role }));
}

describe('MemberActions', () => {
  it("shows the person's Role on the badge that changes it, named for them", () => {
    render(
      <MemberActions
        {...WORKSPACE}
        accountId="a-2"
        name="Ben"
        memberRole="MEMBER"
      />,
    );

    expect(
      screen.getByRole('combobox', { name: "Ben's Role" }),
    ).toHaveTextContent('Member');
  });

  it('makes someone an Admin at once, and says so', async () => {
    changeMemberRole.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(
      <MemberActions
        {...WORKSPACE}
        accountId="a-2"
        name="Ben"
        memberRole="MEMBER"
      />,
    );

    await pick(user, "Ben's Role", 'Admin');

    expect(changeMemberRole).toHaveBeenCalledWith(WORKSPACE_ID, 'a-2', 'ADMIN');
    expect(toast.success).toHaveBeenCalledWith('Ben is now an Admin');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('makes another Admin a Member without asking', async () => {
    changeMemberRole.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(
      <MemberActions
        {...WORKSPACE}
        accountId="a-2"
        name="Ben"
        memberRole="ADMIN"
      />,
    );

    await pick(user, "Ben's Role", 'Member');

    expect(changeMemberRole).toHaveBeenCalledWith(
      WORKSPACE_ID,
      'a-2',
      'MEMBER',
    );
  });

  it('says why when the change is refused, and shows the Role it still has', async () => {
    changeMemberRole.mockResolvedValue({
      ok: false,
      message: 'Make someone else an Admin first.',
    });
    const user = userEvent.setup();
    render(
      <MemberActions
        {...WORKSPACE}
        accountId="a-2"
        name="Ben"
        memberRole="ADMIN"
      />,
    );

    await pick(user, "Ben's Role", 'Member');

    expect(toast.error).toHaveBeenCalledWith(
      'Make someone else an Admin first.',
    );
    // The Role shown while the change was in flight is React's to put back, and it does so in a
    // later paint than the refusal: reading it straight after the toast catches the old frame.
    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: "Ben's Role" }),
      ).toHaveTextContent('Admin'),
    );
  });

  it('asks before an Admin makes themselves a Member', async () => {
    const user = userEvent.setup();
    render(
      <MemberActions
        {...WORKSPACE}
        accountId="a-1"
        name="Ann"
        memberRole="ADMIN"
        isSelf
      />,
    );

    await pick(user, 'Your Role', 'Member');

    expect(
      await screen.findByRole('dialog', { name: 'Make yourself a Member?' }),
    ).toHaveAccessibleDescription(
      "You won't be able to invite people or change anyone's Role. Another Admin can make you an Admin again.",
    );
    expect(changeMemberRole).not.toHaveBeenCalled();
  });

  it('makes them a Member once they confirm', async () => {
    changeMemberRole.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(
      <MemberActions
        {...WORKSPACE}
        accountId="a-1"
        name="Ann"
        memberRole="ADMIN"
        isSelf
      />,
    );

    await pick(user, 'Your Role', 'Member');
    await user.click(
      await screen.findByRole('button', { name: 'Make me a Member' }),
    );

    expect(changeMemberRole).toHaveBeenCalledWith(
      WORKSPACE_ID,
      'a-1',
      'MEMBER',
    );
    expect(toast.success).toHaveBeenCalledWith('You are now a Member');
  });

  it('keeps them an Admin when they think better of it', async () => {
    const user = userEvent.setup();
    render(
      <MemberActions
        {...WORKSPACE}
        accountId="a-1"
        name="Ann"
        memberRole="ADMIN"
        isSelf
      />,
    );

    await pick(user, 'Your Role', 'Member');
    await user.click(
      await screen.findByRole('button', { name: 'Stay an Admin' }),
    );

    expect(changeMemberRole).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(
      screen.getByRole('combobox', { name: 'Your Role' }),
    ).toHaveTextContent('Admin');
  });

  it('answers making the only Admin a Member with why it cannot be, and changes nothing', async () => {
    const user = userEvent.setup();
    render(
      <MemberActions
        {...WORKSPACE}
        accountId="a-1"
        name="Ann"
        memberRole="ADMIN"
        isSelf
        isLastAdmin
      />,
    );

    await pick(user, 'Your Role', 'Member');

    expect(
      await screen.findByRole('dialog', { name: "You're the only Admin" }),
    ).toHaveAccessibleDescription(
      'Acme always needs at least one Admin. Make someone else an Admin first, then you can become a Member.',
    );
    await user.click(screen.getByRole('button', { name: 'Got it' }));

    expect(changeMemberRole).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(
      screen.getByRole('combobox', { name: 'Your Role' }),
    ).toHaveTextContent('Admin');
  });

  it('offers a menu with Deactivate only when asked to, and asks before doing it', async () => {
    deactivateMember.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    const { rerender } = render(
      <MemberActions
        {...WORKSPACE}
        accountId="a-2"
        name="Ben"
        memberRole="MEMBER"
      />,
    );

    expect(screen.queryByRole('button', { name: 'Manage Ben' })).toBeNull();

    rerender(
      <MemberActions
        {...WORKSPACE}
        accountId="a-2"
        name="Ben"
        memberRole="MEMBER"
        canDeactivate
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Manage Ben' }));
    await user.click(screen.getByRole('menuitem', { name: /Deactivate/ }));

    expect(
      await screen.findByRole('dialog', { name: 'Deactivate Ben?' }),
    ).toBeInTheDocument();
    expect(deactivateMember).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Deactivate' }));

    expect(deactivateMember).toHaveBeenCalledWith(WORKSPACE_ID, 'a-2');
    expect(toast.success).toHaveBeenCalledWith('Ben was deactivated');
  });
});

describe('InactiveMemberActions', () => {
  it('shows the Role they would come back with, and offers to bring them back', async () => {
    const user = userEvent.setup();
    render(
      <InactiveMemberActions
        {...WORKSPACE}
        accountId="a-2"
        name="Ben"
        memberRole="ADMIN"
      />,
    );

    expect(screen.getByText('Admin')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Manage Ben' }));
    await user.click(screen.getByRole('menuitem', { name: /Reactivate/ }));

    expect(
      await screen.findByRole('dialog', { name: 'Reactivate Ben?' }),
    ).toBeInTheDocument();
  });
});
