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
    onAPIError: { errorURL: '/login' },
    database,
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
