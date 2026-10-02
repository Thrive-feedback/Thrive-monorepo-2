import { z } from 'zod';

/** One rule for every connection string, so two of them can never drift apart. */
const postgresUrl = z
  .url()
  .refine(
    (url) => ['postgres:', 'postgresql:'].includes(new URL(url).protocol),
    'Must be a PostgreSQL URL',
  );

/**
 * A comma-separated list of origins, handed on as the list it describes rather than as the
 * string it arrived as.
 *
 * It has no default on purpose: an empty list is a safe mistake, because the browser
 * refuses every cross-origin call and someone notices immediately. A default would be an
 * origin nobody chose, which is the mistake that survives to production.
 */
const originList = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin !== ''),
  )
  .pipe(
    z.array(
      z
        .url()
        .refine(
          (origin) => new URL(origin).origin === origin.replace(/\/$/, ''),
          'Must be a bare origin — scheme, host and port only, no path or trailing slash',
        ),
    ),
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

  CORS_ALLOWED_ORIGINS: originList,
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
