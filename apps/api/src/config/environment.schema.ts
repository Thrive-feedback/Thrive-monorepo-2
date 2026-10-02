import { z } from 'zod';

/** One rule for every connection string, so two of them can never drift apart. */
const postgresUrl = z
  .url()
  .refine(
    (url) => ['postgres:', 'postgresql:'].includes(new URL(url).protocol),
    'Must be a PostgreSQL URL',
  );

/**
 * The shape of every environment variable this application reads, parsed once at boot.
 *
 * Nothing here defaults a secret, and no default weakens production. A new entry ships
 * with its `.env.example` line in the same change.
 */
export const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),

  DATABASE_URL: postgresUrl,
});

export type Environment = z.infer<typeof environmentSchema>;

/**
 * The migration tool's own connection, deliberately not part of the schema above: the
 * running API is given a credential that cannot change the schema, so requiring this one
 * at boot would make every deployment carry DDL rights it must not have. Only the Prisma
 * config file asks for it, and it is validated the moment it is asked for.
 */
export const migrationEnvironmentSchema = z.object({
  DATABASE_MIGRATION_URL: postgresUrl,
});
