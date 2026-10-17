import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeactivatedMemberList } from './deactivated-member-list';

const readMembers = vi.fn();
vi.mock(
  '@/app/(signed-in)/(member)/settings/workspace/_lib/members.service',
  () => ({
    readMembers: (...args: unknown[]) => readMembers(...args),
  }),
);

const membership = {
  workspace: { id: 'w-1', name: 'Acme Corp' },
  role: 'MEMBER',
} as const;

describe('DeactivatedMemberList', () => {
  it('lists those Deactivated, with "Deactivated" beside each name', async () => {
    readMembers.mockResolvedValue([
      {
        accountId: 'a-2',
        email: 'ben@acme.test',
        name: 'Ben',
        photoUrl: null,
        role: 'MEMBER',
      },
    ]);

    render(await DeactivatedMemberList({ membership }));

    expect(
      screen.getAllByRole('listitem').map((item) => item.textContent),
    ).toEqual(['BBenben@acme.testDeactivated']);
    expect(readMembers).toHaveBeenCalledWith(membership, 'DEACTIVATED');
  });

  it('says so when nobody has left', async () => {
    readMembers.mockResolvedValue([]);

    render(await DeactivatedMemberList({ membership }));

    expect(
      screen.getByText('Nobody has left or been Deactivated.'),
    ).toBeInTheDocument();
  });
});
