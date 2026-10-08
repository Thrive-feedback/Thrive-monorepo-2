import {
  type Auth as BetterAuth,
  type BetterAuthOptions,
  betterAuth,
  type DBAdapterInstance,
} from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import type { AuthConfig } from '../../config/configuration';
import type { IdGenerator } from '../../shared/application/id-generator.port';
import type { PrismaClient } from '../database/generated/client';

/** A session ends after this long without use. Using Thrive pushes it forward again. */
const SESSION_IDLE_LIMIT_SECONDS = 7 * 24 * 60 * 60;

/** How often, at most, a session in use is pushed forward. */
const SESSION_REFRESH_INTERVAL_SECONDS = 24 * 60 * 60;

/** Drops the ID token before an account row is written; nothing reads it afterwards. */
function withoutIdToken<T extends { idToken?: string | null }>(account: T): T {
  return { ...account, idToken: null };
}

/**
 * Builds the Better Auth instance on the application's one Prisma client, so auth shares
 * the connection pool rather than opening a second one. Configuration arrives as an
 * argument; Better Auth is never left to read the environment itself.
 */
export function createAuth(
  prismaClient: PrismaClient,
  authConfig: AuthConfig,
  idGenerator: IdGenerator,
): Auth {
  return betterAuth(authOptions(prismaClient, authConfig, idGenerator));
}

function authOptions(
  prismaClient: PrismaClient,
  authConfig: AuthConfig,
  idGenerator: IdGenerator,
) {
  const database: DBAdapterInstance = prismaAdapter(prismaClient, {
    provider: 'postgresql',
  });
  return {
    secret: authConfig.secret,
    baseURL: authConfig.baseUrl,
    // `baseUrl` is the web origin, so it is also the only origin a request may come from.
    trustedOrigins: [authConfig.baseUrl],
    // A callback that fails before its sign-in attempt is identified has no per-attempt
    // error page yet, so it lands on the sign-in page too, never on a page of Better Auth's.
    onAPIError: { errorURL: '/signin' },
    database,
    // Google's tokens are credentials. The access and refresh tokens are encrypted at
    // rest with the auth secret; the ID token is not kept at all, because it is only
    // needed during sign-in, and Better Auth does not encrypt it.
    account: { encryptOAuthTokens: true },
    databaseHooks: {
      account: {
        create: {
          before: async (account) => ({ data: withoutIdToken(account) }),
        },
        update: {
          before: async (account) => ({ data: withoutIdToken(account) }),
        },
      },
    },
    session: {
      expiresIn: SESSION_IDLE_LIMIT_SECONDS,
      updateAge: SESSION_REFRESH_INTERVAL_SECONDS,
      // Reading a session never writes: it only reports `needsRefresh`. Pushing the session
      // forward is a separate POST, made where the new cookie can reach the browser.
      deferSessionRefresh: true,
    },
    socialProviders: {
      google: {
        clientId: authConfig.googleClientId,
        clientSecret: authConfig.googleClientSecret,
        // Without it, Google signs straight back into the last account, so signing out
        // and choosing a different account would be impossible.
        prompt: 'select_account',
      },
    },
    // Better Auth's tables keep its own names (`user`, `account`, …): it resolves a model
    // by those names before any rename, so reusing one for another model breaks lookups.
    // They are the provider's tables; domain code never names them.
    advanced: {
      // Accounts and sessions take their ids from the same source as everything else.
      database: { generateId: () => idGenerator.next() },
      // Names the session cookie `thrive.session_token`, which the web app checks for
      // before asking the API. Better Auth adds `__Secure-` in front of it on https.
      cookiePrefix: 'thrive',
    },
  } satisfies BetterAuthOptions;
}

/**
 * Named from our own options rather than inferred from `betterAuth()`: the inferred type
 * writes a path from inside Better Auth into the build's declaration files, which nothing
 * can resolve.
 */
export type Auth = BetterAuth<ReturnType<typeof authOptions>>;

/** Injection token for the Better Auth instance. */
export const AUTH = Symbol('AUTH');
