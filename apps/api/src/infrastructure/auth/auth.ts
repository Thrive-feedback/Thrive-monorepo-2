import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { v7 as uuidv7 } from 'uuid';
import type { AuthConfig } from '../../config/configuration';
import type { PrismaClient } from '../database/generated/client';

/**
 * Builds the Better Auth instance on the application's one Prisma client, so auth shares
 * the connection pool rather than opening a second one. Configuration arrives as an
 * argument; Better Auth is never left to read the environment itself.
 */
export function createAuth(prisma: PrismaClient, config: AuthConfig) {
  return betterAuth({
    secret: config.secret,
    baseURL: config.baseUrl,
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    // Better Auth's tables keep its own names (`user`, `account`, …): it resolves a model
    // by those names before any rename, so reusing one for another model breaks lookups.
    // They are the provider's tables; domain code never names them.
    advanced: { database: { generateId: () => uuidv7() } },
  });
}

export type Auth = ReturnType<typeof createAuth>;

/** Injection token for the Better Auth instance. */
export const AUTH = Symbol('AUTH');
