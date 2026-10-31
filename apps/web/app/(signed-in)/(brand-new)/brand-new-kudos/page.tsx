import type { Metadata } from 'next';
import { BrandNewPageTitle } from '@/app/(signed-in)/(brand-new)/_components/brand-new-page-title';
import { BRAND_NEW_COLUMN } from '@/app/(signed-in)/(brand-new)/_lib/brand-new-column.constant';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import { requireMember } from '@/lib/session/session.service';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Kudos board',
  robots: { index: false, follow: false },
};

/** Where a sent Kudos is read. It is a place to land until the board itself is built. */
export default async function BrandNewKudos() {
  await requireMember();

  return (
    <div className={cn(BRAND_NEW_COLUMN, 'flex flex-col gap-4')}>
      <BrandNewPageTitle>Kudos board</BrandNewPageTitle>
      <Text
        as="p"
        variant="subtitle-handwrite-1"
        className="-rotate-3 self-center py-24 text-action-secondary-hover"
      >
        soon
      </Text>
    </div>
  );
}
