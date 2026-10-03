'use client';

import { SomethingWentWrong } from './_components/something-went-wrong';

/**
 * Catches a failure anywhere below the root layout, including the `(public)` layout: its
 * navbar is the first thing to ask the API on every page, and an error file only covers
 * the layouts nested under its own segment, never the one beside it.
 *
 * `retry` builds the failed part again, fetching fresh, so a short outage recovers without
 * a reload. Next requires an error file to be a client component with a default export.
 */
export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <SomethingWentWrong digest={error.digest} onRetry={retry} />;
}
