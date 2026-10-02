import { describe, expect, it } from 'bun:test';
import { environmentSchema } from './environment.schema';

const validEnvironment = {
  DATABASE_URL: 'postgresql://thrive:local_only@127.0.0.1:54329/thrive',
  BETTER_AUTH_SECRET: 'a'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:3000',
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
});
