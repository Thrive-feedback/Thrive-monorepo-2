import { describe, expect, it } from 'bun:test';
import { getMigrationDatabaseUrl } from './configuration';

const LOCAL_POSTGRES_URL =
  'postgresql://thrive:local_only@127.0.0.1:54329/thrive';

describe('the migration connection string', () => {
  it('is handed to the migration tool when the environment sets a PostgreSQL URL', () => {
    const url = getMigrationDatabaseUrl({
      DATABASE_MIGRATION_URL: LOCAL_POSTGRES_URL,
    });

    expect(url).toBe(LOCAL_POSTGRES_URL);
  });

  it('refuses to migrate when the environment sets nothing, and names the variable', () => {
    expect(() => getMigrationDatabaseUrl({})).toThrow(/DATABASE_MIGRATION_URL/);
  });

  it('refuses to migrate against a database that is not PostgreSQL', () => {
    expect(() =>
      getMigrationDatabaseUrl({
        DATABASE_MIGRATION_URL:
          'mysql://thrive:local_only@127.0.0.1:3306/thrive',
      }),
    ).toThrow(/Must be a PostgreSQL URL/);
  });

  it('keeps the rejected value out of the error it reports', () => {
    const secret = 'super_secret_password';

    expect(() =>
      getMigrationDatabaseUrl({
        DATABASE_MIGRATION_URL: `mysql://thrive:${secret}@127.0.0.1:3306/thrive`,
      }),
    ).toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining(secret),
      }),
    );
  });
});
