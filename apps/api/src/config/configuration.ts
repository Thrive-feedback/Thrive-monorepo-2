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

export class AuthConfig {
  constructor(
    readonly secret: string,
    readonly baseUrl: string,
    readonly googleClientId: string,
    readonly googleClientSecret: string,
  ) {}
}

export class EmailConfig {
  constructor(
    readonly resendApiKey: string,
    /** The address every email is sent from, on the verified sending subdomain. */
    readonly fromAddress: string,
  ) {}
}

/**
 * Thrive's own credentials for one chat tool. One application serves every Workspace, so these
 * are application-wide values and never per-Workspace: what a Workspace stores is identifiers
 * (design 0020 D3).
 */
export class ChatConfig {
  constructor(
    /** Discord's application id. Public: it appears in the authorise URL an Admin is sent to. */
    readonly discordClientId: string,
    /** Exchanges the authorisation code, and signs the install `state` (design 0020 D5). */
    readonly discordClientSecret: string,
    /** Authorises every call to Discord's API as Thrive's bot. */
    readonly discordBotToken: string,
  ) {}
}

export class WebConfig {
  constructor(
    /** Where a link sent to a person points: the web app they open, not this API. */
    readonly origin: string,
  ) {}
}

export interface Configuration {
  readonly http: HttpConfig;
  readonly database: DatabaseConfig;
  readonly auth: AuthConfig;
  readonly email: EmailConfig;
  readonly chat: ChatConfig;
  readonly web: WebConfig;
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
    auth: new AuthConfig(
      parsed.data.BETTER_AUTH_SECRET,
      parsed.data.BETTER_AUTH_URL,
      parsed.data.GOOGLE_CLIENT_ID,
      parsed.data.GOOGLE_CLIENT_SECRET,
    ),
    email: new EmailConfig(
      parsed.data.RESEND_API_KEY,
      parsed.data.RESEND_FROM_ADDRESS,
    ),
    chat: new ChatConfig(
      parsed.data.DISCORD_CLIENT_ID,
      parsed.data.DISCORD_CLIENT_SECRET,
      parsed.data.DISCORD_BOT_TOKEN,
    ),
    // The auth URL is already the web origin (ADR 0027), so a second variable would only be
    // one that could disagree with it.
    web: new WebConfig(new URL(parsed.data.BETTER_AUTH_URL).origin),
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
