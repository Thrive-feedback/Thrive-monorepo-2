import { describe, expect, it } from 'bun:test';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { AccountNamesService } from './account-names.service';

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
  return {
    accountSummaryPort,
    service: new AccountNamesService(accountSummaryPort),
  };
}

describe('naming the Accounts on one page', () => {
  it('asks once for everyone named, however often they appear', async () => {
    const { accountSummaryPort, service } = setUp();

    await service.namesOf([BEN, CARA, BEN]);

    expect(accountSummaryPort.calls).toEqual([[BEN, CARA]]);
  });

  it('leaves an Account unnamed while it has no name to show', async () => {
    const { service } = setUp();

    const names = await service.namesOf([BEN, CARA]);

    expect(names.get(BEN)).toBe('Ben Carter');
    expect(names.has(CARA)).toBe(false);
  });
});
