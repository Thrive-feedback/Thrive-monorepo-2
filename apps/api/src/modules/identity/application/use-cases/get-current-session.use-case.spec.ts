import { describe, expect, it } from 'bun:test';
import {
  FakeIdentityPort,
  FakeProfileQuery,
} from '@test/support/identity.fakes';
import { GetCurrentSessionUseCase } from './get-current-session.use-case';

const ANN = { id: 'account-ann', email: 'ann@acme.test', name: 'Ann Lee' };
const ANN_PROFILE = { fullName: 'Ann Lee', displayName: 'Ann', slug: 'ann' };

function signedInAs(account: typeof ANN, needsRefresh = false) {
  const identityPort = new FakeIdentityPort();
  identityPort.session = { account, needsRefresh };
  return identityPort;
}

describe('reading the current session', () => {
  it('answers the Account, its Profile, and whether the session is due a refresh', async () => {
    const identityPort = signedInAs(ANN, true);
    const profileQuery = new FakeProfileQuery();
    profileQuery.profiles.set(ANN.id, ANN_PROFILE);
    const useCase = new GetCurrentSessionUseCase(identityPort, profileQuery);

    expect(await useCase.execute({ credential: 'cookie-a' })).toEqual({
      account: { ...ANN, profile: ANN_PROFILE },
      needsRefresh: true,
    });
    expect(identityPort.calls).toEqual([
      { method: 'currentSession', credential: 'cookie-a' },
    ]);
  });

  it('answers no Profile for an Account that has not introduced itself yet', async () => {
    const useCase = new GetCurrentSessionUseCase(
      signedInAs(ANN),
      new FakeProfileQuery(),
    );

    expect(await useCase.execute({ credential: 'cookie-a' })).toEqual({
      account: { ...ANN, profile: null },
      needsRefresh: false,
    });
  });

  it('answers no Account when nobody is signed in, and only reads', async () => {
    const identityPort = new FakeIdentityPort();
    const useCase = new GetCurrentSessionUseCase(
      identityPort,
      new FakeProfileQuery(),
    );

    expect(await useCase.execute({ credential: '' })).toEqual({
      account: null,
      needsRefresh: false,
    });
    expect(identityPort.calls.map((call) => call.method)).toEqual([
      'currentSession',
    ]);
  });
});
