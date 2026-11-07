import { PersonalItemList } from '@/app/(signed-in)/(brand-new)/_components/personal-item-list';
import { PersonalItemsRetry } from '@/app/(signed-in)/(brand-new)/_components/personal-items-retry';
import { readFirstPage } from '@/app/(signed-in)/(brand-new)/_lib/read-first-page.service';
import { readGivenItems } from '@/app/(signed-in)/(brand-new)/given/_lib/given-items.service';
import { readNextGivenPage } from '@/app/(signed-in)/(brand-new)/given/_lib/given-items-actions.service';
import type { MemberAccount } from '@/lib/session/session.service';
import { GivenEmpty } from './given-empty';

export type GivenItemsProps = {
  session: MemberAccount;
};

/** The first page of Given, read here so the page renders around it while it is in flight. */
export async function GivenItems({ session }: GivenItemsProps) {
  const page = await readFirstPage(() => readGivenItems(session.membership));

  if (!page) {
    return <PersonalItemsRetry />;
  }
  if (page.items.length === 0) {
    return <GivenEmpty session={session} />;
  }
  // The list keeps what it read, so a card the person just sent would not show. All of this is theirs,
  // so the newest card changing is what starts it again, as on Home.
  return (
    <PersonalItemList
      key={page.items[0]?.id}
      initialPage={page}
      side="given"
      readNext={readNextGivenPage}
    />
  );
}
