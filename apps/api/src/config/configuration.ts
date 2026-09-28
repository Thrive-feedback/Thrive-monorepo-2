import { environmentSchema } from './environment.schema';

/**
 * Configuration is split into namespaces, and a module is given only the namespace it
 * needs. Each class doubles as its injection token.
 */
export class HttpConfig {
  constructor(readonly port: number) {}
}

export interface Configuration {
  readonly http: HttpConfig;
}

/** Injection token for the whole parsed configuration, from which each namespace is projected. */
export const CONFIGURATION = Symbol('CONFIGURATION');

/**
 * The only file in the application that reads `process.env`. Everywhere else
 * configuration arrives as an injected value.
 */
export function loadConfiguration(
  env: NodeJS.ProcessEnv = process.env,
): Configuration {
  const parsed = environmentSchema.safeParse(env);

  if (!parsed.success) {
    // Report which variables failed, never the values they held — a value may be a secret.
    const failed = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    process.stderr.write(`Invalid environment configuration:\n${failed}\n`);
    // A misconfigured process exits rather than starting half-configured.
    process.exit(1);
  }

  return { http: new HttpConfig(parsed.data.PORT) };
}
