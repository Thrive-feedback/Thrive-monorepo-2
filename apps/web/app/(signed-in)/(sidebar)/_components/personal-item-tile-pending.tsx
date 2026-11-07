import { useLinkStatus } from 'next/link';

/** Tells the box its postcard is on its way, while the page reads it. Only a link's child can tell. */
export function PersonalItemTilePending() {
  const { pending } = useLinkStatus();

  return (
    <span
      data-pending={pending || undefined}
      className="pointer-events-none absolute inset-0 rounded-page bg-surface-skeleton opacity-0 data-pending:opacity-60 motion-safe:data-pending:animate-pulse"
    />
  );
}
