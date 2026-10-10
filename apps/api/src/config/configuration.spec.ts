import { describe, expect, it } from 'bun:test';
import { getMigrationDatabaseUrl } from './configuration';
import { environmentSchema } from './environment.schema';

const LOCAL_POSTGRES_URL =
  'postgresql://thrive:local_only@127.0.0.1:54329/thrive';

function parseOrigins(value: string): readonly string[] | undefined {
  const parsed = environmentSchema.safeParse({
    DATABASE_URL: LOCAL_POSTGRES_URL,
    CORS_ALLOWED_ORIGINS: value,
    BETTER_AUTH_SECRET: 'a'.repeat(32),
    BETTER_AUTH_URL: 'http://localhost:3001',
    GOOGLE_CLIENT_ID: 'client-id.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: 'client-secret',
    GMAIL_SMTP_USER: 'thrive.test@gmail.com',
    GMAIL_SMTP_APP_PASSWORD: 'abcd efgh ijkl mnop',
  });

  return parsed.success ? parsed.data.CORS_ALLOWED_ORIGINS : undefined;
}

describe('the origins a browser may call from', () => {
  it('arrives as a list, not as the string it was written in', () => {
    expect(parseOrigins('http://localhost:3001')).toEqual([
      'http://localhost:3001',
    ]);
  });

  it('accepts several, however they were spaced', () => {
    expect(
      parseOrigins('http://localhost:3001, https://thrive.example'),
    ).toEqual(['http://localhost:3001', 'https://thrive.example']);
  });

  it('reads an empty value as "no origin may call", not as "every origin may"', () => {
    expect(parseOrigins('')).toEqual([]);
  });

  it('refuses a value that is not an origin, rather than passing it to the browser', () => {
    expect(parseOrigins('localhost:3001')).toBeUndefined();
  });

  it('refuses an origin carrying a path, which a browser would never match', () => {
    expect(parseOrigins('http://localhost:3001/app')).toBeUndefined();
  });

  it('is required, because a default origin is one nobody chose', () => {
    const parsed = environmentSchema.safeParse({
      DATABASE_URL: LOCAL_POSTGRES_URL,
    });

    expect(parsed.success).toBe(false);
  });
});

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
