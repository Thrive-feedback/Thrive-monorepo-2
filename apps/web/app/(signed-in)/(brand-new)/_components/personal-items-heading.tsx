import { Suspense } from 'react';
import { BrandNewPageTitle } from '@/app/(signed-in)/(brand-new)/_components/brand-new-page-title';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { PersonalItemsViewToggle } from './personal-items-view-toggle';

/**
 * The head of Received: what it is, and how to lay it out. The choice reads the address, which the
 * loading screen is built without, so it waits behind its own boundary, keeping its place.
 */
export function PersonalItemsHeading() {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <BrandNewPageTitle>Received</BrandNewPageTitle>
        <Text as="p" variant="body-1" tone="muted">
          Feedback and kudos people wrote to you.
        </Text>
      </div>
      <Suspense fallback={<Skeleton className="h-9 w-19 shrink-0" />}>
        <PersonalItemsViewToggle />
      </Suspense>
    </div>
  );
}
