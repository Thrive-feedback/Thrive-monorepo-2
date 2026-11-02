import { PersonalItemList } from '@/app/(signed-in)/(brand-new)/_components/personal-item-list';
import { PersonalItemsRetry } from '@/app/(signed-in)/(brand-new)/_components/personal-items-retry';
import { readFirstPage } from '@/app/(signed-in)/(brand-new)/_lib/read-first-page.service';
import { readReceivedItems } from '@/app/(signed-in)/(brand-new)/brand-new-received/_lib/received-items.service';
import { readNextReceivedPage } from '@/app/(signed-in)/(brand-new)/brand-new-received/_lib/received-items-actions.service';
import { Text } from '@/components/atoms/text';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type ReceivedItemsProps = {
  membership: CurrentMembership;
};

/** The first page of Received, read here so the page renders around it while it is in flight. */
export async function ReceivedItems({ membership }: ReceivedItemsProps) {
  const page = await readFirstPage(() => readReceivedItems(membership));

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
    <PersonalItemList
      initialPage={page}
      side="received"
      readNext={readNextReceivedPage}
    />
  );
}
