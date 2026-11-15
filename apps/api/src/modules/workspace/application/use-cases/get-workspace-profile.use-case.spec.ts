import { describe, expect, it } from 'bun:test';
import { FakeAccountBySlugPort } from '@test/support/feedback.fakes';
import {
  FakeAccountSummaryPort,
  FakeMembershipQuery,
} from '@test/support/workspace.fakes';
import { ProfileNotFoundError } from '../workspace.errors';
import { GetWorkspaceProfileUseCase } from './get-workspace-profile.use-case';

const ACME = { id: '0199a0f0-0000-7000-8000-0000000000aa', name: 'Acme' };
const GLOBEX = { id: '0199a0f0-0000-7000-8000-0000000000bb', name: 'Globex' };
const BEN_IN_ACME = { workspace: ACME, role: 'MEMBER' } as const;
const ANN_JOINED = new Date('2026-10-02T03:04:05.000Z');
const ANN_PHOTO = 'https://lh3.googleusercontent.com/a/ann=s96-c';

function setUp() {
  const membershipQuery = new FakeMembershipQuery();
  const accountSummaryPort = new FakeAccountSummaryPort();
  const accountBySlugPort = new FakeAccountBySlugPort().with(
    { accountId: 'account-ann', slug: 'ann.lee', displayName: 'Ann' },
    { accountId: 'account-cat', slug: 'cat', displayName: 'Cat' },
    { accountId: 'account-dan', slug: 'dan', displayName: 'Dan' },
  );
  membershipQuery.memberships.push(
    {
      accountId: 'account-ann',
      workspace: ACME,
      role: 'ADMIN',
      joinedAt: ANN_JOINED,
    },
    { accountId: 'account-ben', ...BEN_IN_ACME },
    { accountId: 'account-cat', workspace: GLOBEX, role: 'ADMIN' },
    {
      accountId: 'account-dan',
      workspace: ACME,
      role: 'MEMBER',
      deactivatedAt: new Date('2026-11-01T00:00:00.000Z'),
    },
  );
  accountSummaryPort.summaries.push(
    {
      accountId: 'account-ann',
      email: 'ann@acme.co',
      fullName: 'Ann Lee',
      displayName: 'Ann',
      slug: 'ann.lee',
      photoUrl: ANN_PHOTO,
    },
    {
      accountId: 'account-cat',
      email: 'cat@globex.co',
      fullName: 'Cat Ng',
      displayName: 'Cat',
      slug: 'cat',
      photoUrl: null,
    },
    {
      accountId: 'account-dan',
      email: 'dan@acme.co',
      fullName: 'Dan Ito',
      displayName: 'Dan',
      slug: 'dan',
      photoUrl: null,
    },
  );
  return new GetWorkspaceProfileUseCase(
    accountBySlugPort,
    membershipQuery,
    accountSummaryPort,
  );
}

describe('opening a Profile in a Workspace', () => {
  it('shows a Member who they are and where they stand in the Workspace', async () => {
    const profile = await setUp().execute({
      membership: BEN_IN_ACME,
      slug: 'ann.lee',
    });

    expect(profile).toEqual({
      accountId: 'account-ann',
      slug: 'ann.lee',
      email: 'ann@acme.co',
      fullName: 'Ann Lee',
      displayName: 'Ann',
      photoUrl: ANN_PHOTO,
      role: 'ADMIN',
      status: 'ACTIVE',
      joinedAt: ANN_JOINED,
    });
  });

  it('still shows someone Deactivated in the Workspace, as Deactivated', async () => {
    const profile = await setUp().execute({
      membership: BEN_IN_ACME,
      slug: 'dan',
    });

    expect(profile.status).toBe('DEACTIVATED');
  });

  it('finds nobody who is only in another Workspace', async () => {
    const opening = setUp().execute({ membership: BEN_IN_ACME, slug: 'cat' });

    await expect(opening).rejects.toThrow(ProfileNotFoundError);
  });

  it('finds nobody for a slug no Profile holds', async () => {
    const opening = setUp().execute({
      membership: BEN_IN_ACME,
      slug: 'nobody',
    });

    await expect(opening).rejects.toThrow(ProfileNotFoundError);
  });
});
