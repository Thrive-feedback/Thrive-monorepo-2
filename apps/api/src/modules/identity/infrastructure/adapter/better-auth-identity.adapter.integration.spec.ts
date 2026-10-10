import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaClient } from '@app/infrastructure/database/generated/client';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { PrismaPg } from '@prisma/adapter-pg';
import { makeSignature } from 'better-auth/crypto';
import { v7 as uuidv7 } from 'uuid';
import type { IdentityPort } from '../../application/port/identity.port';
import { BetterAuthIdentityAdapter } from './better-auth-identity.adapter';

const configuration = loadConfiguration();
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: configuration.database.url }),
});
const auth = createAuth(prisma, configuration.auth, new UuidIdGenerator());
const identityPort: IdentityPort = new BetterAuthIdentityAdapter(auth);

const DAY_MS = 24 * 60 * 60 * 1000;
const SIGNED_OUT = { account: null, needsRefresh: false };

const createdAccountIds: string[] = [];
const createdStates: string[] = [];

/** The `cookie` header a browser holding this session would send. */
async function cookieFor(token: string): Promise<string> {
  const signature = await makeSignature(token, configuration.auth.secret);
  return `thrive.session_token=${encodeURIComponent(`${token}.${signature}`)}`;
}

/** Moves a session's expiry as if it had last been refreshed `days` ago. */
async function ageSession(sessionId: string, days: number): Promise<Date> {
  const expiresAt = new Date(Date.now() + (7 - days) * DAY_MS);
  await prisma.session.update({
    where: { id: sessionId },
    data: { expiresAt },
  });
  return expiresAt;
}

async function storedExpiry(sessionId: string): Promise<Date | undefined> {
  return (await prisma.session.findUnique({ where: { id: sessionId } }))
    ?.expiresAt;
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
  return {
    accountId: account.id,
    email,
    session,
    credential: await cookieFor(session.token),
  };
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
  it('answers the Account behind a live session cookie, not yet due a refresh', async () => {
    const { accountId, email, credential } = await aSignedInAccount();

    expect(await identityPort.currentSession(credential)).toEqual({
      account: { id: accountId, email, name: 'Ann Lee' },
      needsRefresh: false,
    });
  });

  it('reports a session in use for over a day as due, and writes nothing', async () => {
    const { session, credential } = await aSignedInAccount();
    const agedExpiry = await ageSession(session.id, 2);

    expect(await identityPort.currentSession(credential)).toMatchObject({
      needsRefresh: true,
    });
    expect(await storedExpiry(session.id)).toEqual(agedExpiry);
  });

  it('refreshing pushes the expiry a full idle limit ahead and reissues the cookie', async () => {
    const { session, credential } = await aSignedInAccount();
    await ageSession(session.id, 2);

    const { sessionCookies } = await identityPort.refreshSession(credential);

    const expiry = (await storedExpiry(session.id))?.getTime() ?? 0;
    expect(Math.abs(expiry - (Date.now() + 7 * DAY_MS))).toBeLessThan(60_000);
    expect(sessionCookies).toContainEqual(
      expect.stringMatching(/^thrive\.session_token=[^;]+;.*Max-Age=604800/),
    );
    expect(await identityPort.currentSession(credential)).toMatchObject({
      needsRefresh: false,
    });
  });

  it('refreshing makes the cookie expire when the session in the database does', async () => {
    const { session, credential } = await aSignedInAccount();
    await ageSession(session.id, 2);

    const refreshedAt = Date.now();
    const { sessionCookies } = await identityPort.refreshSession(credential);

    const sessionCookie = sessionCookies.find((c) =>
      c.startsWith('thrive.session_token='),
    );
    const maxAgeSeconds = Number(
      /Max-Age=(\d+)/.exec(sessionCookie ?? '')?.[1],
    );
    const cookieExpiresAt = refreshedAt + maxAgeSeconds * 1000;
    const sessionExpiresAt = (await storedExpiry(session.id))?.getTime() ?? 0;
    // The browser starts counting Max-Age when the response arrives, so the two can only
    // differ by the time the request took.
    expect(Math.abs(cookieExpiresAt - sessionExpiresAt)).toBeLessThan(5_000);
  });

  it('ends the session and returns a clearing cookie', async () => {
    const { session, credential } = await aSignedInAccount();

    const { sessionCookies } = await identityPort.signOut(credential);

    expect(
      await prisma.session.findUnique({ where: { id: session.id } }),
    ).toBeNull();
    expect(sessionCookies).toContainEqual(
      expect.stringMatching(/^thrive\.session_token=; Max-Age=0/),
    );
  });

  it('starts Google sign-in with a state and a PKCE challenge', async () => {
    const { url, sessionCookies } = await identityPort.startGoogleSignIn({
      invitationId: null,
    });

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

  it('sends someone signing in to accept an Invitation back to it, new Account or not', async () => {
    const invitationId = '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b';

    const { url } = await identityPort.startGoogleSignIn({ invitationId });

    const state = new URL(url).searchParams.get('state') ?? '';
    createdStates.push(state);
    const stored = await prisma.verification.findFirst({
      where: { identifier: `auth-state:${state}` },
    });
    const attempt = JSON.parse(stored?.value ?? '{}');
    expect(attempt.callbackURL).toBe(`/invitations/${invitationId}?signedIn=1`);
    expect(attempt.newUserURL).toBe(`/invitations/${invitationId}?signedIn=1`);
  });

  describe('refreshing writes nothing and issues no session cookie', () => {
    it('without a cookie', async () => {
      const { sessionCookies } = await identityPort.refreshSession('');

      expect(sessionCookies.filter((c) => /=[^;]/.test(c))).toEqual([]);
    });

    it('for a tampered signature', async () => {
      const { session } = await aSignedInAccount();
      const agedExpiry = await ageSession(session.id, 2);
      const forged = `thrive.session_token=${encodeURIComponent(`${session.token}.forged`)}`;

      const { sessionCookies } = await identityPort.refreshSession(forged);

      expect(await storedExpiry(session.id)).toEqual(agedExpiry);
      expect(sessionCookies.filter((c) => /=[^;]/.test(c))).toEqual([]);
    });
  });

  describe('reads as signed out', () => {
    it('without a cookie', async () => {
      expect(await identityPort.currentSession('')).toEqual(SIGNED_OUT);
    });

    it('for a tampered signature', async () => {
      const { session } = await aSignedInAccount();
      const forged = `thrive.session_token=${encodeURIComponent(`${session.token}.forged`)}`;

      expect(await identityPort.currentSession(forged)).toEqual(SIGNED_OUT);
    });

    it('for an expired session', async () => {
      const { session, credential } = await aSignedInAccount();
      await prisma.session.update({
        where: { id: session.id },
        data: { expiresAt: new Date(Date.now() - 60_000) },
      });

      expect(await identityPort.currentSession(credential)).toEqual(SIGNED_OUT);
    });

    it('for a signed-out session', async () => {
      const { credential } = await aSignedInAccount();
      await identityPort.signOut(credential);

      expect(await identityPort.currentSession(credential)).toEqual(SIGNED_OUT);
    });
  });
});
