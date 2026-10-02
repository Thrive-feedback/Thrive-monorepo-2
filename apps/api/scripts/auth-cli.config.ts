import { PrismaPg } from '@prisma/adapter-pg';

import { loadConfiguration } from '../src/config/configuration';
import { createAuth } from '../src/infrastructure/auth/auth';
import { PrismaClient } from '../src/infrastructure/database/generated/client';

/**
 * The Better Auth CLI reads its options from a statically exported `auth`, while the app
 * builds its instance through Nest's injector. This file builds the same instance from
 * the same `createAuth`, so the schema the CLI generates matches the one the app runs.
 * The CLI only reads the options; it never connects to the database through this client.
 */
const configuration = loadConfiguration();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: configuration.database.url }),
});

export const auth = createAuth(prisma, configuration.auth);
