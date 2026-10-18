import { describe, expect, it } from 'bun:test';
import { SignedHandoff } from '@app/infrastructure/chat/signed-handoff';
import { FakeClock } from '@test/support/clock.fake';
import { SignedInstallHandoff } from './signed-install-handoff.adapter';

const SECRET = 'a-chat-application-secret-at-least-32-chars';

const start = {
  accountId: 'account-ann',
  workspaceId: '0199a0f0-0000-7000-8000-0000000000w1',
  provider: 'DISCORD',
} as const;

const install = {
  ...start,
  externalWorkspaceId: 'guild-acme',
  externalWorkspaceName: 'Acme HQ',
} as const;

function setUp(secret = SECRET) {
  const signedHandoff = new SignedHandoff(
    secret,
    new FakeClock(new Date('2026-10-18T09:00:00.000Z')),
  );
  return {
    signedHandoff,
    handoff: new SignedInstallHandoff(signedHandoff),
  };
}

describe('the install values Thrive signs', () => {
  it('reads an install back exactly as it started', () => {
    const { handoff } = setUp();

    expect(handoff.readInstallStart(handoff.signInstallStart(start))).toEqual(
      start,
    );
  });

  it('reads the authorised server back exactly as the tool reported it', () => {
    const { handoff } = setUp();

    expect(
      handoff.readAuthorizedInstall(handoff.signAuthorizedInstall(install)),
    ).toEqual(install);
  });

  it('refuses a token signed with another secret', () => {
    const { handoff } = setUp();
    const elsewhere = setUp('a-completely-different-secret-value-32+');

    expect(
      handoff.readInstallStart(elsewhere.handoff.signInstallStart(start)),
    ).toBeNull();
  });

  it('refuses a token naming a chat tool Thrive does not connect to', () => {
    const { signedHandoff, handoff } = setUp();
    const retired = signedHandoff.sign(
      { ...start, provider: 'TEAMS' },
      5 * 60 * 1000,
    );

    expect(handoff.readInstallStart(retired)).toBeNull();
  });

  it('refuses a start token where the authorised server is expected', () => {
    const { handoff } = setUp();

    expect(
      handoff.readAuthorizedInstall(handoff.signInstallStart(start)),
    ).toBeNull();
  });

  it('refuses the authorised-server token where a state is expected, though it carries every claim one needs', () => {
    const { handoff } = setUp();

    expect(
      handoff.readInstallStart(handoff.signAuthorizedInstall(install)),
    ).toBeNull();
  });
});
