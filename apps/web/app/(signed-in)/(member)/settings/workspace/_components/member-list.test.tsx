import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemberList } from './member-list';

const readMembers = vi.fn();
vi.mock(
  '@/app/(signed-in)/(member)/settings/workspace/_lib/members.service',
  () => ({
    readMembers: (...args: unknown[]) => readMembers(...args),
  }),
);
vi.mock(
  '@/app/(signed-in)/(member)/settings/workspace/_lib/member-role-actions.service',
  () => ({ changeMemberRole: vi.fn() }),
);
vi.mock(
  '@/app/(signed-in)/(member)/settings/workspace/_lib/member-deactivation-actions.service',
  () => ({ deactivateMember: vi.fn(), leaveWorkspace: vi.fn() }),
);

const WORKSPACE = { id: 'w-1', name: 'Acme Corp' };

const ANN = {
  accountId: 'a-1',
  email: 'ann@acme.test',
  name: 'Ann',
  photoUrl: null,
  role: 'ADMIN',
};
const BEN = {
  accountId: 'a-2',
  email: 'ben@acme.test',
  name: null,
  photoUrl: null,
  role: 'MEMBER',
};

describe('MemberList', () => {
  it('shows a Member each person as initials, name, email and Role, with a dash and the first letter of the email for no name, and marks the person', async () => {
    readMembers.mockResolvedValue([ANN, BEN]);
    const membership = { workspace: WORKSPACE, role: 'MEMBER' } as const;

    render(await MemberList({ membership, ownEmail: 'ben@acme.test' }));

    expect(
      screen.getAllByRole('listitem').map((item) => item.textContent),
    ).toEqual(['AAnnann@acme.testAdmin', 'B—ben@acme.testMember (you)']);
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(readMembers).toHaveBeenCalledWith(membership);
  });

  it("gives an Admin a control over everyone's Role, their own included", async () => {
    readMembers.mockResolvedValue([ANN, { ...BEN, role: 'ADMIN' }]);
    const membership = { workspace: WORKSPACE, role: 'ADMIN' } as const;

    render(await MemberList({ membership, ownEmail: 'ann@acme.test' }));

    expect(screen.getByRole('combobox', { name: 'Your Role' })).toBeEnabled();
    expect(
      screen.getByRole('combobox', { name: "ben@acme.test's Role" }),
    ).toBeEnabled();
  });

  it("does not let an Admin change the only Admin's Role", async () => {
    readMembers.mockResolvedValue([ANN, BEN]);
    const membership = { workspace: WORKSPACE, role: 'ADMIN' } as const;

    render(await MemberList({ membership, ownEmail: 'ann@acme.test' }));

    expect(screen.getByRole('combobox', { name: 'Your Role' })).toBeDisabled();
    expect(
      screen.getByText('Make someone else an Admin first'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: "ben@acme.test's Role" }),
    ).toBeEnabled();
  });

  it('lets a Member Deactivate nobody', async () => {
    readMembers.mockResolvedValue([ANN, BEN]);
    const membership = { workspace: WORKSPACE, role: 'MEMBER' } as const;

    render(await MemberList({ membership, ownEmail: 'ben@acme.test' }));

    expect(screen.queryByRole('button', { name: /Deactivate/ })).toBeNull();
  });

  it('lets an Admin Deactivate everyone else, other Admins included, and not themselves', async () => {
    readMembers.mockResolvedValue([
      ANN,
      { ...BEN, role: 'ADMIN' },
      { ...BEN, accountId: 'a-3', email: 'cat@acme.test', name: 'Cat' },
    ]);
    const membership = { workspace: WORKSPACE, role: 'ADMIN' } as const;

    render(await MemberList({ membership, ownEmail: 'ann@acme.test' }));

    expect(
      screen.getByRole('button', { name: 'Deactivate ben@acme.test' }),
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Deactivate Cat' }),
    ).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Deactivate Ann' })).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Leave Workspace' }),
    ).toBeNull();
  });
});
