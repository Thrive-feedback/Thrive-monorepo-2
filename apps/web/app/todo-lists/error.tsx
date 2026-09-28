'use client';

import { Button } from '@/components/atoms/button';

/**
 * FE_11 R5 — a route that can fail gets an error file, and it offers a retry rather than
 * only an apology. It is a client boundary by nature: the framework needs a component it
 * can re-render in place.
 *
 * FE_10 R5 — a server-render failure arrives here sanitized, carrying only a digest.
 * The server logs the API's correlation id against that digest (see instrumentation.ts),
 * so the digest is what a person quotes: shown small and copyable, next to the apology.
 */
export default function TodoListsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const reference = error.digest;

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-8">
      {/*
        `alert` rather than `status`: this replaced the page the person was trying to
        read, so it is worth interrupting for.
      */}
      <div
        role="alert"
        className="rounded-lg border border-subtle bg-surface-danger p-6"
      >
        <h1 className="text-lg font-semibold text-danger">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-body">
          Your lists could not be loaded.
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
