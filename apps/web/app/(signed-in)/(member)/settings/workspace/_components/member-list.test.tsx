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

const MEMBERSHIP = {
  workspace: { id: 'w-1', name: 'Acme Corp' },
  role: 'MEMBER',
} as const;

describe('MemberList', () => {
  it('shows each Member as initials, name, email and Role, with a dash and the first letter of the email for no name, and marks the person', async () => {
    readMembers.mockResolvedValue([
      {
        accountId: 'a-1',
        email: 'ann@acme.test',
        name: 'Ann',
        photoUrl: null,
        role: 'OWNER',
      },
      {
        accountId: 'a-2',
        email: 'ben@acme.test',
        name: null,
        photoUrl: null,
        role: 'MEMBER',
      },
    ]);

    render(
      await MemberList({ membership: MEMBERSHIP, ownEmail: 'ben@acme.test' }),
    );

    expect(
      screen.getAllByRole('listitem').map((item) => item.textContent),
    ).toEqual(['AAnnann@acme.testOwner', 'B—ben@acme.testMember (you)']);
    expect(readMembers).toHaveBeenCalledWith(MEMBERSHIP);
  });
});
