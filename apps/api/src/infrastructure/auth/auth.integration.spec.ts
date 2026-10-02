import { afterAll, describe, expect, it } from 'bun:test';
import { PrismaPg } from '@prisma/adapter-pg';
import { version as uuidVersion, v7 as uuidv7 } from 'uuid';
import { loadConfiguration } from '../../config/configuration';
import { PrismaClient } from '../database/generated/client';
import { createAuth } from './auth';

const configuration = loadConfiguration();
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: configuration.database.url }),
});
const auth = createAuth(prisma, configuration.auth);

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
});
