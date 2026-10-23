import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemberRoleActionResult } from '@/app/(signed-in)/(member)/settings/members/_lib/member-role-actions.service';
import type { MemberRole } from '@/lib/session/current-account.type';
import { MemberRoleSelect } from './member-role-select';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';

const changeMemberRole =
  vi.fn<
    (
      workspaceId: string,
      accountId: string,
      role: MemberRole,
    ) => Promise<MemberRoleActionResult>
  >();
vi.mock(
  '@/app/(signed-in)/(member)/settings/members/_lib/member-role-actions.service',
  () => ({
    changeMemberRole: (
      workspaceId: string,
      accountId: string,
      role: MemberRole,
    ) => changeMemberRole(workspaceId, accountId, role),
  }),
);

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

beforeEach(() => {
  changeMemberRole.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
});

async function pick(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(screen.getByRole('option', { name: option }));
}

describe('MemberRoleSelect', () => {
  it("shows the person's Role, named for them", () => {
    render(
      <MemberRoleSelect
        workspaceId={WORKSPACE_ID}
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
      <MemberRoleSelect
        workspaceId={WORKSPACE_ID}
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
      <MemberRoleSelect
        workspaceId={WORKSPACE_ID}
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
      <MemberRoleSelect
        workspaceId={WORKSPACE_ID}
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
      <MemberRoleSelect
        workspaceId={WORKSPACE_ID}
        accountId="a-1"
        name="Ann"
        memberRole="ADMIN"
        isSelf
      />,
    );

    await pick(user, 'Your Role', 'Member');

    expect(
      screen.getByRole('dialog', { name: 'Make yourself a Member?' }),
    ).toHaveAccessibleDescription(
      "You won't be able to invite people or change anyone's Role. Another Admin can make you an Admin again.",
    );
    expect(changeMemberRole).not.toHaveBeenCalled();
  });

  it('makes them a Member once they confirm', async () => {
    changeMemberRole.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(
      <MemberRoleSelect
        workspaceId={WORKSPACE_ID}
        accountId="a-1"
        name="Ann"
        memberRole="ADMIN"
        isSelf
      />,
    );

    await pick(user, 'Your Role', 'Member');
    await user.click(screen.getByRole('button', { name: 'Make me a Member' }));

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
      <MemberRoleSelect
        workspaceId={WORKSPACE_ID}
        accountId="a-1"
        name="Ann"
        memberRole="ADMIN"
        isSelf
      />,
    );

    await pick(user, 'Your Role', 'Member');
    await user.click(screen.getByRole('button', { name: 'Stay an Admin' }));

    expect(changeMemberRole).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(
      screen.getByRole('combobox', { name: 'Your Role' }),
    ).toHaveTextContent('Admin');
  });

  it("cannot change the only Admin's Role, and says why", () => {
    render(
      <MemberRoleSelect
        workspaceId={WORKSPACE_ID}
        accountId="a-1"
        name="Ann"
        memberRole="ADMIN"
        isSelf
        isLastAdmin
      />,
    );

    const select = screen.getByRole('combobox', { name: 'Your Role' });
    expect(select).toBeDisabled();
    expect(select).toHaveAccessibleDescription(
      'Make someone else an Admin first.',
    );
  });
});
