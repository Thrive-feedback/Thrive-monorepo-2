import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaClient } from '@app/infrastructure/database/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { makeSignature } from 'better-auth/crypto';
import { v7 as uuidv7 } from 'uuid';
import type { IdentityPort } from '../../application/port/identity.port';
import { BetterAuthIdentityAdapter } from './better-auth-identity.adapter';

const configuration = loadConfiguration();
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: configuration.database.url }),
});
const auth = createAuth(prisma, configuration.auth);
const identity: IdentityPort = new BetterAuthIdentityAdapter(auth);

const createdAccountIds: string[] = [];
const createdStates: string[] = [];

/** The `cookie` header a browser holding this session would send. */
async function cookieFor(token: string): Promise<string> {
  const signature = await makeSignature(token, configuration.auth.secret);
  return `thrive.session_token=${encodeURIComponent(`${token}.${signature}`)}`;
}

async function aSignedInAccount() {
  const { internalAdapter } = await auth.$context;
  const email = `identity-${uuidv7()}@acme.test`;
  const account = await internalAdapter.createUser(
    { email, name: 'Ann Lee', emailVerified: true },
    { method: 'oauth', oauth: { providerId: 'google' } },
  );
  createdAccountIds.push(account.id);
  const session = await internalAdapter.createSession(account.id);
  return { email, session, credential: await cookieFor(session.token) };
}

afterAll(async () => {
  // Deleting the Better Auth user cascades to its sessions.
  await prisma.user.deleteMany({ where: { id: { in: createdAccountIds } } });
  await prisma.verification.deleteMany({
    where: { identifier: { in: createdStates.map((s) => `auth-state:${s}`) } },
  });
  await prisma.$disconnect();
});

describe('Better Auth identity, through the port', () => {
  it('answers the Account behind a live session cookie', async () => {
    const { email, credential } = await aSignedInAccount();

    expect(await identity.currentAccount(credential)).toEqual({
      email,
      name: 'Ann Lee',
    });
  });

  it('ends the session and returns a clearing cookie', async () => {
    const { session, credential } = await aSignedInAccount();

    const { sessionCookies } = await identity.signOut(credential);

    expect(
      await prisma.session.findUnique({ where: { id: session.id } }),
    ).toBeNull();
    expect(sessionCookies).toContainEqual(
      expect.stringMatching(/^thrive\.session_token=; Max-Age=0/),
    );
  });

  it('starts Google sign-in with a state and a PKCE challenge', async () => {
    const { url, sessionCookies } = await identity.startGoogleSignIn();

    const google = new URL(url);
    const state = google.searchParams.get('state') ?? '';
    createdStates.push(state);
    expect(google.origin).toBe('https://accounts.google.com');
    expect(state).not.toBe('');
    expect(google.searchParams.get('code_challenge_method')).toBe('S256');
    expect(google.searchParams.get('redirect_uri')).toBe(
      `${configuration.auth.baseUrl}/api/auth/callback/google`,
    );
    expect(sessionCookies).toContainEqual(
      expect.stringMatching(/^thrive\.state=/),
    );
  });

  describe('answers null', () => {
    it('without a cookie', async () => {
      expect(await identity.currentAccount('')).toBeNull();
    });

    it('for a tampered signature', async () => {
      const { session } = await aSignedInAccount();
      const forged = `thrive.session_token=${encodeURIComponent(`${session.token}.forged`)}`;

      expect(await identity.currentAccount(forged)).toBeNull();
    });

    it('for an expired session', async () => {
      const { session, credential } = await aSignedInAccount();
      await prisma.session.update({
        where: { id: session.id },
        data: { expiresAt: new Date(Date.now() - 60_000) },
      });

      expect(await identity.currentAccount(credential)).toBeNull();
    });

    it('for a signed-out session', async () => {
      const { credential } = await aSignedInAccount();
      await identity.signOut(credential);

      expect(await identity.currentAccount(credential)).toBeNull();
    });
  });
});
