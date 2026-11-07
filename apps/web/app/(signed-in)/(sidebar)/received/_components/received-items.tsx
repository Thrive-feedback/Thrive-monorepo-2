import { PersonalItemList } from '@/app/(signed-in)/(sidebar)/_components/personal-item-list';
import { PersonalItemsRetry } from '@/app/(signed-in)/(sidebar)/_components/personal-items-retry';
import { readFirstPage } from '@/app/(signed-in)/(sidebar)/_lib/read-first-page.service';
import { readReceivedItems } from '@/app/(signed-in)/(sidebar)/received/_lib/received-items.service';
import { readNextReceivedPage } from '@/app/(signed-in)/(sidebar)/received/_lib/received-items-actions.service';
import { Text } from '@/components/atoms/text';
import type { ReceivedShow } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';

/** What an empty Received says, for each kind it can be narrowed to. */
const EMPTY: Readonly<
  Record<ReceivedShow, { title: string; description: string }>
> = {
  all: {
    title: 'No Feedback for you yet',
    description: 'When someone gives you feedback, you can read it here.',
  },
  requests: {
    title: "You haven't asked anyone yet.",
    description:
      'Ask teammates what they think with + in the menu. Your request and every answer to it will be here.',
  },
  offered: {
    title: 'Nobody has given you feedback unasked yet.',
    description:
      'When a teammate gives you feedback without being asked, you can read it here.',
  },
  kudos: {
    title: 'No Kudos for you yet.',
    description: 'When a teammate gives you kudos, you can read it here.',
  },
};

export type ReceivedItemsProps = {
  membership: CurrentMembership;
  /** The kind it is narrowed to, or all of them. */
  show: ReceivedShow;
};

/** The first page of Received, read here so the page renders around it while it is in flight. */
export async function ReceivedItems({ membership, show }: ReceivedItemsProps) {
  const page = await readFirstPage(() => readReceivedItems(membership, show));

  if (!page) {
    return <PersonalItemsRetry />;
  }
  if (page.items.length === 0) {
    const { title, description } = EMPTY[show];
    return (
      <div className="flex flex-col gap-1 py-5">
        <Text as="p" variant="subtitle-3">
          {title}
        </Text>
        <Text as="p" variant="body-2" tone="muted">
          {description}
        </Text>
      </div>
    );
  }
  return (
    <PersonalItemList
      initialPage={page}
      side="received"
      readNext={readNextReceivedPage.bind(null, show)}
    />
  );
}
