'use client';

import { Button } from '@/components/atoms/button';

/**
 * FE_11 R5 — this route can fail, so it has an error file, and it offers a retry.
 *
 * FE_10 R5 — the digest is surfaced so a person can quote it; the server logs the API's
 * correlation id against it (see instrumentation.ts).
 */
export default function TodoListError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const reference = error.digest;

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-8">
      <div
        role="alert"
        className="rounded-lg border border-subtle bg-surface-danger p-6"
      >
        <h1 className="text-lg font-semibold text-danger">
          This list could not be loaded
        </h1>
        <p className="mt-2 text-sm text-body">
          Nothing on it has been changed.
        </p>
        {reference === undefined ? null : (
          <p className="mt-4 text-sm text-muted">
            Quote this if you report it:{' '}
            <code className="font-mono">{reference}</code>
          </p>
        )}
        <Button onClick={reset} className="mt-6">
          Try again
        </Button>
      </div>
    </main>
  );
}
