import { describe, expect, it } from 'bun:test';
import { environmentSchema } from './environment.schema';

const validEnvironment = {
  DATABASE_URL: 'postgresql://thrive:local_only@127.0.0.1:54329/thrive',
  CORS_ALLOWED_ORIGINS: 'http://localhost:3001',
  BETTER_AUTH_SECRET: 'a'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:3001',
  GOOGLE_CLIENT_ID: 'client-id.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'client-secret',
};

function failedPaths(env: Record<string, string | undefined>): string[] {
  const parsed = environmentSchema.safeParse(env);
  return parsed.success
    ? []
    : parsed.error.issues.map((issue) => issue.path.join('.'));
}

describe('environmentSchema', () => {
  it('accepts a complete environment', () => {
    expect(environmentSchema.safeParse(validEnvironment).success).toBe(true);
  });

  it('refuses a missing auth secret, rather than defaulting one', () => {
    expect(
      failedPaths({ ...validEnvironment, BETTER_AUTH_SECRET: undefined }),
    ).toEqual(['BETTER_AUTH_SECRET']);
  });

  it('refuses an auth secret shorter than 32 characters', () => {
    expect(
      failedPaths({ ...validEnvironment, BETTER_AUTH_SECRET: 'a'.repeat(31) }),
    ).toEqual(['BETTER_AUTH_SECRET']);
  });

  it('refuses an auth URL that does not parse', () => {
    expect(
      failedPaths({ ...validEnvironment, BETTER_AUTH_URL: 'localhost' }),
    ).toEqual(['BETTER_AUTH_URL']);
  });

  it.each(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'])(
    'refuses a missing %s',
    (name) => {
      expect(failedPaths({ ...validEnvironment, [name]: undefined })).toEqual([
        name,
      ]);
    },
  );
});
