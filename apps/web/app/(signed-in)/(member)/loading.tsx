import { Skeleton } from '@/components/atoms/skeleton';

/**
 * What a Member's page shows while the server builds it — every one of them asks the API who is
 * signed in first. The navbar stays, and the skeleton keeps the column where the page will be.
 */
export default function MemberLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="mx-auto flex w-full max-w-2xl flex-col gap-6"
    >
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-80 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
