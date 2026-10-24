import { describe, expect, it } from 'bun:test';
import { SignedHandoff } from '@app/infrastructure/chat/signed-handoff';
import { SignedInstallHandoff } from '@app/modules/integrations/infrastructure/signed-install-handoff.adapter';
import { FakeClock } from '@test/support/clock.fake';
import { SignedLinkHandoff } from './signed-link-handoff.adapter';

const SECRET = 'a-discord-client-secret';
const ANN = 'account-ann';

function setUp(now = new Date('2026-10-24T09:00:00.000Z')) {
  const clock = new FakeClock(now);
  return {
    clock,
    handoff: new SignedLinkHandoff(new SignedHandoff(SECRET, clock)),
  };
}

describe('the `state` a link carries', () => {
  it('reads back what it signed', () => {
    const { handoff } = setUp();

    const state = handoff.signLinkStart({
      accountId: ANN,
      provider: 'DISCORD',
    });

    expect(handoff.readLinkStart(state)).toEqual({
      accountId: ANN,
      provider: 'DISCORD',
    });
  });

  it('refuses one signed with another secret', () => {
    const { handoff, clock } = setUp();
    const elsewhere = new SignedLinkHandoff(
      new SignedHandoff('another-secret', clock),
    );

    const forged = elsewhere.signLinkStart({
      accountId: ANN,
      provider: 'DISCORD',
    });

    expect(handoff.readLinkStart(forged)).toBeNull();
  });

  it('refuses one that has expired', () => {
    const { handoff } = setUp();
    const state = handoff.signLinkStart({
      accountId: ANN,
      provider: 'DISCORD',
    });

    // Six minutes later, read by the same signer with a later "now": a `state` is worth five.
    const { handoff: sixMinutesLater } = setUp(
      new Date('2026-10-24T09:06:00.000Z'),
    );

    expect(sixMinutesLater.readLinkStart(state)).toBeNull();
  });

  it('refuses a tampered payload rather than throwing', () => {
    const { handoff } = setUp();

    expect(handoff.readLinkStart('not-a-token')).toBeNull();
    expect(handoff.readLinkStart('')).toBeNull();
    expect(handoff.readLinkStart('a.b.c')).toBeNull();
  });

  it('refuses one naming a chat tool Thrive does not link', () => {
    const { handoff } = setUp();

    const state = handoff.signLinkStart({
      accountId: ANN,
      provider: 'TEAMS' as never,
    });

    expect(handoff.readLinkStart(state)).toBeNull();
  });
});

describe('an install `state` is not a link `state`', () => {
  it('refuses a token Integrations signed, although the secret is the same', () => {
    const { handoff, clock } = setUp();
    const installs = new SignedInstallHandoff(new SignedHandoff(SECRET, clock));

    // Both are signed with the application's Discord secret, and an install start carries an
    // Account and a provider too — so without the kind claim this would read as a valid link
    // `state`, and a round trip begun for one purpose could be finished as the other.
    const installState = installs.signInstallStart({
      accountId: ANN,
      workspaceId: '0199a0f0-0000-7000-8000-0000000000w1',
      provider: 'DISCORD',
    });

    expect(handoff.readLinkStart(installState)).toBeNull();
  });

  it('and a link `state` is not an install `state`', () => {
    const { handoff, clock } = setUp();
    const installs = new SignedInstallHandoff(new SignedHandoff(SECRET, clock));

    const linkState = handoff.signLinkStart({
      accountId: ANN,
      provider: 'DISCORD',
    });

    expect(installs.readInstallStart(linkState)).toBeNull();
  });
});
