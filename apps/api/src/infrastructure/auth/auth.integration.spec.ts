import { afterAll, describe, expect, it } from 'bun:test';
import { PrismaPg } from '@prisma/adapter-pg';
import type { AuthContext } from 'better-auth';
import { decryptOAuthToken, setTokenUtil } from 'better-auth/oauth2';
import { version as uuidVersion, v7 as uuidv7 } from 'uuid';
import { loadConfiguration } from '../../config/configuration';
import { PrismaClient } from '../database/generated/client';
import { UuidIdGenerator } from '../uuid-id-generator.adapter';
import { createAuth } from './auth';

const configuration = loadConfiguration();
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: configuration.database.url }),
});
const auth = createAuth(prisma, configuration.auth, new UuidIdGenerator());

describe('createAuth against Postgres', () => {
  const createdAccountIds: string[] = [];

  afterAll(async () => {
    // Deleting the Better Auth user cascades to its sessions.
    await prisma.user.deleteMany({ where: { id: { in: createdAccountIds } } });
    await prisma.$disconnect();
  });

  it('stores an Account with a UUIDv7 id and a session that points at it', async () => {
    const { internalAdapter } = await auth.$context;
    const email = `auth-integration-${uuidv7()}@example.test`;

    const account = await internalAdapter.createUser(
      { email, name: 'Integration Test', emailVerified: true },
      { method: 'oauth', oauth: { providerId: 'google' } },
    );
    createdAccountIds.push(account.id);

    expect(uuidVersion(account.id)).toBe(7);
    expect((await internalAdapter.findUserByEmail(email))?.user.id).toBe(
      account.id,
    );

    const session = await internalAdapter.createSession(account.id);

    expect(uuidVersion(session.id)).toBe(7);
    expect(
      await prisma.session.findUnique({ where: { id: session.id } }),
    ).toMatchObject({ userId: account.id, token: session.token });
  });

  it("stores Google's tokens encrypted, and keeps no ID token", async () => {
    // Better Auth types these helpers against its generic context; ours is narrowed by our
    // own options, which TypeScript will not widen on its own. Same object at run time.
    const context = (await auth.$context) as unknown as AuthContext;
    const { internalAdapter } = context;
    const person = await internalAdapter.createUser(
      {
        email: `auth-tokens-${uuidv7()}@example.test`,
        name: 'Token Test',
        emailVerified: true,
      },
      { method: 'oauth', oauth: { providerId: 'google' } },
    );
    createdAccountIds.push(person.id);

    // The same steps Better Auth's Google callback takes: encrypt, then store.
    const link = await internalAdapter.createAccount({
      userId: person.id,
      providerId: 'google',
      accountId: `google-${uuidv7()}`,
      accessToken: await setTokenUtil('plain-access-token', context),
      refreshToken: await setTokenUtil('plain-refresh-token', context),
      idToken: 'header.payload.signature',
    });
    await internalAdapter.updateAccount(link.id, {
      idToken: 'a.later.id-token',
    });

    const stored = await prisma.account.findUniqueOrThrow({
      where: { id: link.id },
    });
    expect(stored.accessToken).not.toContain('plain-access-token');
    expect(stored.refreshToken).not.toContain('plain-refresh-token');
    expect(await decryptOAuthToken(stored.accessToken ?? '', context)).toBe(
      'plain-access-token',
    );
    expect(stored.idToken).toBeNull();
  });
});
