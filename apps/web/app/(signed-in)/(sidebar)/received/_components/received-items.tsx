import { PersonalItemList } from '@/app/(signed-in)/(sidebar)/_components/personal-item-list';
import { PersonalItemsRetry } from '@/app/(signed-in)/(sidebar)/_components/personal-items-retry';
import { readFirstPage } from '@/app/(signed-in)/(sidebar)/_lib/read-first-page.service';
import { readReceivedItems } from '@/app/(signed-in)/(sidebar)/received/_lib/received-items.service';
import { readNextReceivedPage } from '@/app/(signed-in)/(sidebar)/received/_lib/received-items-actions.service';
import type { ReceivedShow } from '@/lib/routes.constant';
import type { MemberAccount } from '@/lib/session/session.service';
import { ReceivedEmpty } from './received-empty';

export type ReceivedItemsProps = {
  session: MemberAccount;
  /** The kind it is narrowed to, or all of them. */
  show: ReceivedShow;
};

/** The first page of Received, read here so the page renders around it while it is in flight. */
export async function ReceivedItems({ session, show }: ReceivedItemsProps) {
  const page = await readFirstPage(() =>
    readReceivedItems(session.membership, show),
  );

  if (!page) {
    return <PersonalItemsRetry />;
  }
  if (page.items.length === 0) {
    return <ReceivedEmpty session={session} show={show} />;
  }
  return (
    <PersonalItemList
      initialPage={page}
      side="received"
      readNext={readNextReceivedPage.bind(null, show)}
    />
  );
}
