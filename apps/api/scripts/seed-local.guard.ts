/**
 * Hosts a developer's own database answers on. Anything else — a Supabase pooler, a Railway
 * private address — is somebody's real data, and seeding writes invented people into whatever
 * it is pointed at.
 */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export class NotALocalDatabaseError extends Error {
  constructor(readonly host: string) {
    super(
      `Refusing to seed: ${host} is not a local database. This writes invented people and is only for a developer's own machine.`,
    );
  }
}

/**
 * Throws unless the connection string points at this machine. Parsing rather than matching a
 * substring: `localhost.example.com` contains "localhost" and is not local, and a password can
 * contain anything at all.
 */
export function assertLocalDatabase(connectionString: string): void {
  let host: string;
  try {
    host = new URL(connectionString).hostname;
  } catch {
    throw new NotALocalDatabaseError('an unreadable connection string');
  }
  if (!LOCAL_HOSTS.has(host)) {
    throw new NotALocalDatabaseError(host);
  }
}
