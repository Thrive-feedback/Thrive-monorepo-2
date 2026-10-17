import { describe, expect, it } from 'bun:test';
import { FakeWorkspaceMembershipPort } from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { PeopleService } from './people.service';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const OTHER_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w2';
const BEN = 'account-ben';
const CARA = 'account-cara';

function setUp() {
  const accountSummaryPort = new FakeAccountSummaryPort();
  accountSummaryPort.summaries.push({
    accountId: BEN,
    email: 'ben@acme.test',
    fullName: 'Ben Carter',
    displayName: 'Ben',
    photoUrl: null,
  });
  const workspaceMembershipPort = new FakeWorkspaceMembershipPort();
  return {
    accountSummaryPort,
    workspaceMembershipPort,
    service: new PeopleService(accountSummaryPort, workspaceMembershipPort),
  };
}

describe('naming the people on one page', () => {
  it('asks Identity and Workspace once each for everyone named, however often they appear', async () => {
    const { accountSummaryPort, workspaceMembershipPort, service } = setUp();

    await service.peopleIn(WORKSPACE_ID, [BEN, CARA, BEN]);

    expect(accountSummaryPort.calls).toEqual([[BEN, CARA]]);
    expect(workspaceMembershipPort.deactivatedCalls).toEqual([[BEN, CARA]]);
  });

  it('leaves someone unnamed while they have no name to show', async () => {
    const { service } = setUp();

    const people = await service.peopleIn(WORKSPACE_ID, [BEN, CARA]);

    expect(people.nameOf(BEN)).toBe('Ben Carter');
    expect(people.nameOf(CARA)).toBe(null);
  });

  it('marks someone Deactivated in this Workspace, and only them', async () => {
    const { workspaceMembershipPort, service } = setUp();
    workspaceMembershipPort.withDeactivated(WORKSPACE_ID, BEN);

    const people = await service.peopleIn(WORKSPACE_ID, [BEN, CARA]);

    expect(people.statusOf(BEN)).toBe('DEACTIVATED');
    expect(people.statusOf(CARA)).toBe('ACTIVE');
  });

  it('does not mark someone Deactivated only in another Workspace', async () => {
    const { workspaceMembershipPort, service } = setUp();
    workspaceMembershipPort.withDeactivated(OTHER_WORKSPACE_ID, BEN);

    const people = await service.peopleIn(WORKSPACE_ID, [BEN]);

    expect(people.statusOf(BEN)).toBe('ACTIVE');
  });
});
