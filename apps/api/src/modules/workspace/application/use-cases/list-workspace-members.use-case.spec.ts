import { describe, expect, it } from 'bun:test';
import {
  FAKE_JOINED_AT,
  FakeAccountSummaryPort,
  FakeMembershipQuery,
} from '@test/support/workspace.fakes';
import { ListWorkspaceMembersUseCase } from './list-workspace-members.use-case';

const ACME_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const PAGE = { page: 1, pageSize: 20 };

const ANN_PHOTO = 'https://lh3.googleusercontent.com/a/ann=s96-c';
const ANN_JOINED = new Date('2026-09-30T08:00:00.000Z');

function setUp() {
  const membershipQuery = new FakeMembershipQuery();
  const accountSummaryPort = new FakeAccountSummaryPort();
  const acme = { id: ACME_ID, name: 'Acme' };
  membershipQuery.memberships.push(
    {
      accountId: 'account-ann',
      workspace: acme,
      role: 'ADMIN',
      joinedAt: ANN_JOINED,
    },
    { accountId: 'account-ben', workspace: acme, role: 'MEMBER' },
    {
      accountId: 'account-cat',
      workspace: { id: 'other', name: 'Globex' },
      role: 'ADMIN',
    },
  );
  accountSummaryPort.summaries.push(
    {
      accountId: 'account-ann',
      email: 'ann@acme.co',
      fullName: 'Ann Lee',
      displayName: 'Ann',
      slug: 'ann',
      photoUrl: ANN_PHOTO,
    },
    {
      accountId: 'account-ben',
      email: 'ben@acme.co',
      fullName: null,
      displayName: null,
      slug: null,
      photoUrl: null,
    },
    {
      accountId: 'account-cat',
      email: 'cat@globex.co',
      fullName: 'Cat',
      displayName: 'Cat',
      slug: null,
      photoUrl: null,
    },
  );
  return new ListWorkspaceMembersUseCase(membershipQuery, accountSummaryPort);
}

describe('listing the Members of a Workspace', () => {
  it('names each Member of the caller’s Workspace by email, Profile name, slug and photo, with their Role and when they joined', async () => {
    const members = await setUp().execute({
      membership: { workspace: { id: ACME_ID, name: 'Acme' }, role: 'MEMBER' },
      page: PAGE,
      status: 'ACTIVE',
    });

    expect(members).toEqual({
      items: [
        {
          accountId: 'account-ann',
          email: 'ann@acme.co',
          fullName: 'Ann Lee',
          displayName: 'Ann',
          slug: 'ann',
          photoUrl: ANN_PHOTO,
          role: 'ADMIN',
          joinedAt: ANN_JOINED,
        },
        {
          accountId: 'account-ben',
          email: 'ben@acme.co',
          fullName: null,
          displayName: null,
          slug: null,
          photoUrl: null,
          role: 'MEMBER',
          joinedAt: FAKE_JOINED_AT,
        },
      ],
      total: 2,
    });
  });
});
