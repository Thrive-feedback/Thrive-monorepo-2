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

/**
 * Whichever model endpoint answers today. Every value here is vendor-shaped and none has a
 * default: a default endpoint is a wrong production target nobody notices, and a default model
 * is a silent price and quality change on the day the config is mistyped (ADR 0077).
 */
/**
 * Whichever model endpoint answers today, or **nothing at all** where a deployment has no
 * provider yet (ADR 0085). Every value here is vendor-shaped and none has a default: a default
 * endpoint is a wrong production target nobody notices, and a default model is a silent price and
 * quality change on the day the config is mistyped.
 */
export class AiConfig {
  private constructor(
    /** An OpenAI-compatible base URL; `/chat/completions` is appended to it. */
    readonly endpoint: string,
    readonly apiKey: string,
    readonly model: string,
    /** Only ever a log field, so a log stays readable after a provider swap. */
    readonly label: string,
  ) {}

  /** A provider to ask. The environment schema has already refused a half-set one. */
  static configured(details: {
    readonly endpoint: string;
    readonly apiKey: string;
    readonly model: string;
    readonly label: string;
  }): AiConfig {
    return new AiConfig(
      details.endpoint,
      details.apiKey,
      details.model,
      details.label,
    );
  }

  /**
   * No provider. Everything that would ask a model is switched off, and says so — rather than
   * asking an endpoint that does not exist and failing once per attempt.
   */
  static readonly none = null;
}

/** What the application is given: a provider, or nothing to ask. */
export type AiSetting = AiConfig | null;

/**
 * Injection token for {@link AiSetting}. A symbol rather than the class, because the value may be
 * `null` and a class token promises an instance.
 */
export const AI_SETTING = Symbol('AI_SETTING');

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
  readonly ai: AiSetting;
  readonly web: WebConfig;
}

/**
 * A provider, or nothing. The schema refuses a half-set one, so one value standing is enough to
 * know all four do.
 */
function aiSettingOf(environment: {
  AI_PROVIDER_ENDPOINT?: string;
  AI_PROVIDER_API_KEY?: string;
  AI_PROVIDER_MODEL?: string;
  AI_PROVIDER_LABEL?: string;
}): AiSetting {
  const { AI_PROVIDER_ENDPOINT, AI_PROVIDER_API_KEY } = environment;
  const { AI_PROVIDER_MODEL, AI_PROVIDER_LABEL } = environment;
  if (
    AI_PROVIDER_ENDPOINT === undefined ||
    AI_PROVIDER_API_KEY === undefined ||
    AI_PROVIDER_MODEL === undefined ||
    AI_PROVIDER_LABEL === undefined
  ) {
    return AiConfig.none;
  }
  return AiConfig.configured({
    endpoint: AI_PROVIDER_ENDPOINT,
    apiKey: AI_PROVIDER_API_KEY,
    model: AI_PROVIDER_MODEL,
    label: AI_PROVIDER_LABEL,
  });
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
    ai: aiSettingOf(parsed.data),
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
