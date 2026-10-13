import { describe, expect, it } from 'bun:test';
import {
  assertLocalDatabase,
  NotALocalDatabaseError,
} from './seed-local.guard';

describe('refusing to seed anything but a local database', () => {
  it('allows the compose database this repository ships', () => {
    expect(() =>
      assertLocalDatabase(
        'postgresql://thrive:local_only@127.0.0.1:54329/thrive',
      ),
    ).not.toThrow();
  });

  it('allows localhost and the IPv6 loopback', () => {
    for (const host of ['localhost', '[::1]']) {
      expect(() =>
        assertLocalDatabase(
          `postgresql://thrive:local_only@${host}:54329/thrive`,
        ),
      ).not.toThrow();
    }
  });

  it('refuses the deployed database', () => {
    expect(() =>
      assertLocalDatabase(
        'postgresql://postgres:secret@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
      ),
    ).toThrow(NotALocalDatabaseError);
  });

  it('refuses a host that merely contains a local name', () => {
    // A substring check would have let this through.
    expect(() =>
      assertLocalDatabase('postgresql://u:p@localhost.attacker.example/thrive'),
    ).toThrow(NotALocalDatabaseError);
  });

  it('refuses a connection string it cannot read', () => {
    expect(() => assertLocalDatabase('not-a-url')).toThrow(
      NotALocalDatabaseError,
    );
  });

  it('names the host it refused, so the reason is on screen', () => {
    expect(() =>
      assertLocalDatabase('postgresql://u:p@db.railway.internal:5432/thrive'),
    ).toThrow('db.railway.internal');
  });
});
