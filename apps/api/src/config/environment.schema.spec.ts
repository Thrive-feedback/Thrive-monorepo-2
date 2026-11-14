import { describe, expect, it } from 'bun:test';
import { environmentSchema } from './environment.schema';

const validEnvironment = {
  DATABASE_URL: 'postgresql://thrive:local_only@127.0.0.1:54329/thrive',
  CORS_ALLOWED_ORIGINS: 'http://localhost:3001',
  BETTER_AUTH_SECRET: 'a'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:3001',
  GOOGLE_CLIENT_ID: 'client-id.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'client-secret',
  RESEND_API_KEY: 're_test_key',
  RESEND_FROM_ADDRESS: 'no-reply@send.thrive.example',
  DISCORD_CLIENT_ID: 'discord-client-id',
  DISCORD_CLIENT_SECRET: 'discord-client-secret',
  DISCORD_BOT_TOKEN: 'discord-bot-token',
  AI_PROVIDER_ENDPOINT: 'https://models.thrive.example/v1',
  AI_PROVIDER_API_KEY: 'ai-provider-key',
  AI_PROVIDER_MODEL: 'a-model',
  AI_PROVIDER_LABEL: 'A_PROVIDER',
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

  it.each(['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_BOT_TOKEN'])(
    'refuses a missing %s, since one application serves every Workspace',
    (name) => {
      expect(failedPaths({ ...validEnvironment, [name]: undefined })).toEqual([
        name,
      ]);
    },
  );

  it.each(['RESEND_API_KEY', 'RESEND_FROM_ADDRESS'])(
    'refuses a missing %s, since every email is sent for real',
    (name) => {
      expect(failedPaths({ ...validEnvironment, [name]: undefined })).toEqual([
        name,
      ]);
    },
  );

  const AI_PROVIDER: string[] = [
    'AI_PROVIDER_ENDPOINT',
    'AI_PROVIDER_API_KEY',
    'AI_PROVIDER_MODEL',
    'AI_PROVIDER_LABEL',
  ];

  it('accepts an environment naming no model provider, which switches AI off', () => {
    const withoutAi: Record<string, unknown> = { ...validEnvironment };
    for (const name of AI_PROVIDER) {
      delete withoutAi[name];
    }

    expect(environmentSchema.safeParse(withoutAi).success).toBe(true);
  });

  it.each(AI_PROVIDER)(
    'refuses a provider missing only its %s, because half of one never works and never says why',
    (name) => {
      expect(
        failedPaths({ ...validEnvironment, [name]: undefined }),
      ).not.toEqual([]);
    },
  );

  it('refuses a model endpoint that does not parse', () => {
    expect(
      failedPaths({ ...validEnvironment, AI_PROVIDER_ENDPOINT: 'models' }),
    ).toEqual(['AI_PROVIDER_ENDPOINT']);
  });

  it('refuses a From address that is not an email address', () => {
    expect(
      failedPaths({ ...validEnvironment, RESEND_FROM_ADDRESS: 'no-reply' }),
    ).toEqual(['RESEND_FROM_ADDRESS']);
  });
});
