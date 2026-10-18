import { describe, expect, it } from 'bun:test';
import { Clock } from '@app/shared/application/clock.port';
import { SignedHandoff } from './signed-handoff';

const SECRET = 'a-chat-application-secret-at-least-32-chars';

const FIELDS = ['accountId', 'workspaceId', 'provider'] as const;

const FIVE_MINUTES_MS = 5 * 60 * 1000;

/** Moves on command, because every claim this signs is about how long it stays good for. */
class MovingClock extends Clock {
  constructor(private instant: Date) {
    super();
  }

  advance(milliseconds: number): void {
    this.instant = new Date(this.instant.getTime() + milliseconds);
  }

  now(): Date {
    return this.instant;
  }
}

function setUp(secret = SECRET) {
  const clock = new MovingClock(new Date('2026-10-18T09:00:00.000Z'));
  return { clock, handoff: new SignedHandoff(secret, clock) };
}

const claims = {
  accountId: 'account-ann',
  workspaceId: 'workspace-acme',
  provider: 'DISCORD',
};

describe('carrying a value through somebody else and back', () => {
  it('reads back exactly what it signed', () => {
    const { handoff } = setUp();

    expect(
      handoff.verify(handoff.sign(claims, FIVE_MINUTES_MS), FIELDS),
    ).toEqual(claims);
  });

  it('signs two tokens differently for the same claims, so one cannot be recognised', () => {
    const { handoff } = setUp();

    expect(handoff.sign(claims, FIVE_MINUTES_MS)).not.toBe(
      handoff.sign(claims, FIVE_MINUTES_MS),
    );
  });

  it('refuses a token once its life is over', () => {
    const { clock, handoff } = setUp();
    const token = handoff.sign(claims, FIVE_MINUTES_MS);

    clock.advance(FIVE_MINUTES_MS + 1);

    expect(handoff.verify(token, FIELDS)).toBeNull();
  });

  it('accepts a token up to the last moment of its life', () => {
    const { clock, handoff } = setUp();
    const token = handoff.sign(claims, FIVE_MINUTES_MS);

    clock.advance(FIVE_MINUTES_MS - 1);

    expect(handoff.verify(token, FIELDS)).toEqual(claims);
  });

  it('refuses a token signed with another secret', () => {
    const { handoff } = setUp();
    const elsewhere = setUp('a-completely-different-secret-value-32+');

    expect(
      handoff.verify(elsewhere.handoff.sign(claims, FIVE_MINUTES_MS), FIELDS),
    ).toBeNull();
  });

  it('refuses a token whose claims were edited after signing', () => {
    const { handoff } = setUp();
    const [, signature] = handoff.sign(claims, FIVE_MINUTES_MS).split('.');
    const theirs = Buffer.from(
      JSON.stringify({
        ...claims,
        workspaceId: 'workspace-globex',
        exp: Number.MAX_SAFE_INTEGER,
      }),
    ).toString('base64url');

    expect(handoff.verify(`${theirs}.${signature}`, FIELDS)).toBeNull();
  });

  it('refuses a token that is missing a claim the caller needs', () => {
    const { handoff } = setUp();
    const token = handoff.sign(
      { accountId: 'account-ann', workspaceId: 'workspace-acme' },
      FIVE_MINUTES_MS,
    );

    expect(handoff.verify(token, FIELDS)).toBeNull();
  });

  it.each([
    ['nothing at all', ''],
    ['no signature', 'eyJhIjoxfQ'],
    ['more parts than it signs', 'eyJhIjoxfQ.one.two'],
    [
      'a payload that is not JSON',
      `${Buffer.from('nonsense').toString('base64url')}.x`,
    ],
  ])('refuses a token that is %s', (_shape, token) => {
    const { handoff } = setUp();

    expect(handoff.verify(token, FIELDS)).toBeNull();
  });
});
