import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemberList } from './member-list';

const readMembers = vi.fn();
vi.mock('@/app/(signed-in)/(sidebar)/settings/_lib/members.service', () => ({
  readMembers: (...args: unknown[]) => readMembers(...args),
}));
vi.mock(
  '@/app/(signed-in)/(sidebar)/settings/teammates/_lib/member-role-actions.service',
  () => ({ changeMemberRole: vi.fn() }),
);
vi.mock(
  '@/app/(signed-in)/(sidebar)/settings/_lib/member-deactivation-actions.service',
  () => ({
    deactivateMember: vi.fn(),
    leaveWorkspace: vi.fn(),
    reactivateMember: vi.fn(),
  }),
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

/** Who is active in the Workspace, and who left or was Deactivated there. */
function membersAre(active: unknown[], deactivated: unknown[] = []) {
  readMembers.mockImplementation(async (_membership, status) =>
    status === 'DEACTIVATED' ? deactivated : active,
  );
}

/** The choices in one teammate's menu, as a person opening it reads them. */
async function menuOf(name: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: `Manage ${name}` }));
  return screen.getByRole('menu');
}

describe('MemberList', () => {
  it('lists the person first, marked You, then everyone else, each as initials, name, email and Role, with a dash and the first letter of the email for no name', async () => {
    membersAre([ANN, BEN]);
    const membership = { workspace: WORKSPACE, role: 'MEMBER' } as const;

    render(await MemberList({ membership, ownEmail: 'ben@acme.test' }));

    expect(
      screen.getAllByRole('listitem').map((item) => item.textContent),
    ).toEqual(['B—Youben@acme.testMember', 'AAnnann@acme.testAdmin']);
    expect(readMembers).toHaveBeenCalledWith(membership);
    expect(readMembers).toHaveBeenCalledWith(membership, 'DEACTIVATED');
  });

  it('gives a Member no way to manage anyone, only their Roles to read', async () => {
    membersAre([ANN, BEN], [{ ...BEN, accountId: 'a-3', name: 'Cat' }]);
    const membership = { workspace: WORKSPACE, role: 'MEMBER' } as const;

    render(await MemberList({ membership, ownEmail: 'ben@acme.test' }));

    expect(screen.queryByRole('button', { name: /^Manage / })).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it("gives an Admin a control over everyone's Role, their own included, on the badge that shows it", async () => {
    membersAre([ANN, { ...BEN, role: 'ADMIN' }]);
    const membership = { workspace: WORKSPACE, role: 'ADMIN' } as const;

    render(await MemberList({ membership, ownEmail: 'ann@acme.test' }));

    expect(screen.getByRole('combobox', { name: 'Your Role' })).toBeEnabled();
    expect(
      screen.getByRole('combobox', { name: "ben@acme.test's Role" }),
    ).toHaveTextContent('Admin');
  });

  it('explains, rather than does, making the only Admin a Member', async () => {
    membersAre([ANN, BEN]);
    const membership = { workspace: WORKSPACE, role: 'ADMIN' } as const;

    render(await MemberList({ membership, ownEmail: 'ann@acme.test' }));
    const user = userEvent.setup();
    await user.click(screen.getByRole('combobox', { name: 'Your Role' }));
    await user.click(screen.getByRole('option', { name: 'Member' }));

    expect(
      await screen.findByRole('dialog', { name: "You're the only Admin" }),
    ).toBeInTheDocument();
  });

  it('lets an Admin Deactivate everyone else, other Admins included, and not themselves', async () => {
    membersAre([ANN, { ...BEN, role: 'ADMIN' }]);
    const membership = { workspace: WORKSPACE, role: 'ADMIN' } as const;

    render(await MemberList({ membership, ownEmail: 'ann@acme.test' }));

    expect(
      within(await menuOf('ben@acme.test')).getByRole('menuitem', {
        name: /Deactivate/,
      }),
    ).toBeInTheDocument();
  });

  it('gives an Admin Deactivate on their own row too, which only says why when they are the only Admin', async () => {
    membersAre([ANN, BEN]);
    const membership = { workspace: WORKSPACE, role: 'ADMIN' } as const;

    render(await MemberList({ membership, ownEmail: 'ann@acme.test' }));
    const user = userEvent.setup();
    await user.click(
      within(await menuOf('Ann')).getByRole('menuitem', { name: 'Deactivate' }),
    );

    expect(
      await screen.findByRole('dialog', { name: "You're the only Admin" }),
    ).toHaveAccessibleDescription(
      'Acme Corp always needs at least one Admin. Make someone else an Admin first, then you can leave.',
    );
  });

  it('asks an Admin who is not the only one before they leave from their own row', async () => {
    membersAre([ANN, { ...BEN, role: 'ADMIN' }]);
    const membership = { workspace: WORKSPACE, role: 'ADMIN' } as const;

    render(await MemberList({ membership, ownEmail: 'ann@acme.test' }));
    const user = userEvent.setup();
    await user.click(
      within(await menuOf('Ann')).getByRole('menuitem', { name: 'Deactivate' }),
    );

    expect(
      await screen.findByRole('dialog', { name: 'Leave Acme Corp?' }),
    ).toBeInTheDocument();
  });

  it('lists those who left or were Deactivated last, under their own heading, their names inactive', async () => {
    membersAre([ANN], [{ ...BEN, name: 'Ben' }]);
    const membership = { workspace: WORKSPACE, role: 'MEMBER' } as const;

    render(await MemberList({ membership, ownEmail: 'ann@acme.test' }));

    const inactive = screen.getByRole('region', { name: 'Inactive' });
    expect(within(inactive).getByRole('listitem')).toHaveTextContent(
      'Ben (inactive)',
    );
    expect(screen.queryByRole('button', { name: 'Manage Ben' })).toBeNull();
  });

  it('lets an Admin Reactivate anyone inactive', async () => {
    membersAre([ANN], [{ ...BEN, name: 'Ben' }]);
    const membership = { workspace: WORKSPACE, role: 'ADMIN' } as const;

    render(await MemberList({ membership, ownEmail: 'ann@acme.test' }));

    expect(
      within(await menuOf('Ben')).getByRole('menuitem', {
        name: /Reactivate/,
      }),
    ).toBeInTheDocument();
  });
});
