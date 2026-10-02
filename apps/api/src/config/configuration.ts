import type { ZodError } from 'zod';
import {
  environmentSchema,
  migrationEnvironmentSchema,
} from './environment.schema';

/**
 * Configuration is split into namespaces, and a module is given only the namespace it
 * needs. Each class doubles as its injection token.
 */
export class HttpConfig {
  constructor(
    readonly port: number,
    /** The origins a browser may call this API from. Empty means none. */
    readonly allowedOrigins: readonly string[],
  ) {}
}

export class DatabaseConfig {
  constructor(readonly url: string) {}
}

export interface Configuration {
  readonly http: HttpConfig;
  readonly database: DatabaseConfig;
}

/** Injection token for the whole parsed configuration, from which each namespace is projected. */
export const CONFIGURATION = Symbol('CONFIGURATION');

/** Names which variables failed and why, never the values they held — a value may be a secret. */
function describeIssues(error: ZodError): string {
  return error.issues
    .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
}

/**
 * The only file in the application that reads `process.env`. Everywhere else
 * configuration arrives as an injected value.
 */
export function loadConfiguration(
  env: NodeJS.ProcessEnv = process.env,
): Configuration {
  const parsed = environmentSchema.safeParse(env);

  if (!parsed.success) {
    process.stderr.write(
      `Invalid environment configuration:\n${describeIssues(parsed.error)}\n`,
    );
    // A misconfigured process exits rather than starting half-configured.
    process.exit(1);
  }

  return {
    http: new HttpConfig(parsed.data.PORT, parsed.data.CORS_ALLOWED_ORIGINS),
    database: new DatabaseConfig(parsed.data.DATABASE_URL),
  };
}

/**
 * Read when the migration tool loads its configuration rather than at boot, because the
 * API never holds this credential. It throws instead of exiting: the caller is a Prisma
 * config file, and a thrown error is what the CLI reports.
 */
export function getMigrationDatabaseUrl(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const parsed = migrationEnvironmentSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(
      `Invalid migration configuration:\n${describeIssues(parsed.error)}`,
    );
  }

  return parsed.data.DATABASE_MIGRATION_URL;
}
