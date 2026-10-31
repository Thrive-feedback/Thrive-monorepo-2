import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BrandNewPageTitle } from '@/app/(signed-in)/(brand-new)/_components/brand-new-page-title';
import { BRAND_NEW_COLUMN } from '@/app/(signed-in)/(brand-new)/_lib/brand-new-column.constant';
import { cn } from '@/lib/cn.util';
import { requireMember } from '@/lib/session/session.service';
import { AnsweredAsksProvider } from './_components/answered-asks';
import { WaitingAsks, WaitingAsksSkeleton } from './_components/waiting-asks';
import { WAITING_HEADING_ID } from './_components/waiting-heading.constant';
import { WaitingPostcard } from './_components/waiting-postcard';
import { WaitingSort } from './_components/waiting-sort';
import { BrandNewWaitingSearchParams } from './_lib/brand-new-waiting-search-params.schema';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Waiting for me',
  robots: { index: false, follow: false },
};

type BrandNewWaitingProps = {
  /** `sort` is the order of the list, and `ask` the Ask open over it. */
  searchParams: Promise<{
    sort?: string | string[];
    ask?: string | string[];
  }>;
};

/**
 * Every Ask waiting for the person, each a card that opens the postcard it is answered on, named
 * in the address so a reload or a shared link opens it again.
 */
export default async function BrandNewWaiting({
  searchParams,
}: BrandNewWaitingProps) {
  const { sort, ask } = BrandNewWaitingSearchParams.parse(await searchParams);
  const session = await requireMember();

  return (
    <AnsweredAsksProvider>
      <div className={cn(BRAND_NEW_COLUMN, 'flex flex-col gap-4')}>
        <BrandNewPageTitle id={WAITING_HEADING_ID} tabIndex={-1}>
          Waiting for me
        </BrandNewPageTitle>
        <WaitingSort sort={sort} />
        <Suspense key={sort} fallback={<WaitingAsksSkeleton />}>
          <WaitingAsks membership={session.membership} sort={sort} />
        </Suspense>
      </div>
      {/* Always there, so a press holds the small postcard's pending mark until the postcard is
            ready, rather than committing to an empty fallback; a reload still does not wait. */}
      <Suspense fallback={null}>
        {ask !== undefined && (
          <WaitingPostcard
            key={ask}
            session={session}
            askId={ask}
            sort={sort}
          />
        )}
      </Suspense>
    </AnsweredAsksProvider>
  );
}
