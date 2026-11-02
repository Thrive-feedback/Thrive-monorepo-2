import { ApiError } from '@repo/api';
import { PersonalItemList } from '@/app/(signed-in)/(brand-new)/_components/personal-item-list';
import { PersonalItemsRetry } from '@/app/(signed-in)/(brand-new)/_components/personal-items-retry';
import { PersonalItemsSkeleton } from '@/app/(signed-in)/(brand-new)/_components/personal-items-skeleton';
import { readReceivedItems } from '@/app/(signed-in)/(brand-new)/brand-new-received/_lib/received-items.service';
import { readNextReceivedPage } from '@/app/(signed-in)/(brand-new)/brand-new-received/_lib/received-items-actions.service';
import { SkeletonRegion } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import type { BrandNewPersonalView } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type ReceivedItemsProps = {
  membership: CurrentMembership;
};

async function readFirstPage(membership: CurrentMembership) {
  try {
    return await readReceivedItems(membership);
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return null;
  }
}

/** The first page of Received, read here so the page renders around it while it is in flight. */
export async function ReceivedItems({ membership }: ReceivedItemsProps) {
  const page = await readFirstPage(membership);

  if (!page) {
    return <PersonalItemsRetry />;
  }
  if (page.items.length === 0) {
    return (
      <div className="flex flex-col gap-1 py-5">
        <Text as="p" variant="subtitle-3">
          No Feedback for you yet
        </Text>
        <Text as="p" variant="body-2" tone="muted">
          When someone gives you feedback, you can read it here.
        </Text>
      </div>
    );
  }
  return (
    <PersonalItemList initialPage={page} readNext={readNextReceivedPage} />
  );
}

export type PersonalItemsLoadingProps = {
  view: BrandNewPersonalView;
};

/** `ReceivedItems` still loading, in the view it will be drawn in. */
export function PersonalItemsLoading({ view }: PersonalItemsLoadingProps) {
  return (
    <SkeletonRegion>
      <PersonalItemsSkeleton view={view} />
    </SkeletonRegion>
  );
}
