import type { Instrumentation } from 'next';

/**
 * Next.js calls `register` once when a server instance boots. Importing the environment
 * here makes a missing or invalid variable fail server preparation at start-up, naming
 * the variable, rather than failing the first request that happens to load the API client.
 */
export async function register(): Promise<void> {
  await import('./lib/environment.constant');
}

/**
 * A read that fails during a server render reaches the error boundary sanitized: only a
 * `digest` survives. Logging the API's correlation id against that digest is what lets
 * the digest a person quotes lead to the API's own log line. Codes and ids only — never a
 * message, which may echo what the person typed.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
) => {
  const { ApiError } = await import('@repo/api');
  const digest = (error as { digest?: unknown }).digest;

  if (error instanceof ApiError) {
    console.error(
      JSON.stringify({
        event: 'api-request-failed',
        digest,
        code: error.code,
        correlationId: error.correlationId,
        path: request.path,
      }),
    );
  }
};
