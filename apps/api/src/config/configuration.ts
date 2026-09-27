import { environmentSchema } from './environment.schema';

/**
 * BE_10 R4 — configuration is split into namespaces, and a module is given only
 * the namespace it needs. Each class doubles as its injection token.
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
 * BE_10 R1 — the only file in the application that reads `process.env`.
 * Everywhere else configuration arrives as an injected value.
 */
export function loadConfiguration(
  env: NodeJS.ProcessEnv = process.env,
): Configuration {
  const parsed = environmentSchema.safeParse(env);

  if (!parsed.success) {
    // BE_10 R10 — report which variables failed, never the values they held.
    const failed = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    process.stderr.write(`Invalid environment configuration:\n${failed}\n`);
    // BE_10 R2 — a misconfigured process exits rather than starting half-configured.
    process.exit(1);
  }

  return { http: new HttpConfig(parsed.data.PORT) };
}
