import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MemberDeactivationResult } from '../_lib/member-deactivation-actions.service';
import { DeactivatedMemberList } from './deactivated-member-list';

const readMembers = vi.fn();
vi.mock(
  '@/app/(signed-in)/(member)/settings/workspace/_lib/members.service',
  () => ({
    readMembers: (...args: unknown[]) => readMembers(...args),
  }),
);

const reactivateMember =
  vi.fn<(accountId: string) => Promise<MemberDeactivationResult>>();
vi.mock(
  '@/app/(signed-in)/(member)/settings/workspace/_lib/member-deactivation-actions.service',
  () => ({
    reactivateMember: (accountId: string) => reactivateMember(accountId),
  }),
);

const membership = {
  workspace: { id: 'w-1', name: 'Acme Corp' },
  role: 'MEMBER',
} as const;

const BEN = {
  accountId: 'a-2',
  email: 'ben@acme.test',
  name: 'Ben',
  photoUrl: null,
  role: 'MEMBER',
} as const;

describe('DeactivatedMemberList', () => {
  it('lists those Deactivated, each named as inactive', async () => {
    readMembers.mockResolvedValue([BEN]);

    render(await DeactivatedMemberList({ membership }));

    expect(
      screen.getAllByRole('listitem').map((item) => item.textContent),
    ).toEqual(['BBen (inactive)ben@acme.test']);
    expect(readMembers).toHaveBeenCalledWith(membership, 'DEACTIVATED');
  });

  it('offers a Member no way to Reactivate anyone', async () => {
    readMembers.mockResolvedValue([BEN]);

    render(await DeactivatedMemberList({ membership }));

    expect(
      screen.queryByRole('button', { name: 'Reactivate Ben' }),
    ).not.toBeInTheDocument();
  });

  it('offers an Admin Reactivate on each person', async () => {
    readMembers.mockResolvedValue([BEN]);

    render(
      await DeactivatedMemberList({
        membership: { ...membership, role: 'ADMIN' },
      }),
    );

    expect(
      screen.getByRole('button', { name: 'Reactivate Ben' }),
    ).toBeInTheDocument();
  });

  it('says so when nobody has left', async () => {
    readMembers.mockResolvedValue([]);

    render(await DeactivatedMemberList({ membership }));

    expect(
      screen.getByText('Nobody has left or been Deactivated.'),
    ).toBeInTheDocument();
  });
});
