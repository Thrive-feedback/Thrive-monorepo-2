'use client';

import { SomethingWentWrong } from '@/app/_components/something-went-wrong';

/**
 * Catches a failure in a Member's page while keeping the navbar, so the person can still go
 * Home or sign out. A failure in the navbar itself is the root error file's to catch, because
 * an error file covers only what is nested under its own layout.
 */
export default function MemberError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <SomethingWentWrong
      digest={error.digest}
      onRetry={retry}
      fullPage={false}
    />
  );
}
