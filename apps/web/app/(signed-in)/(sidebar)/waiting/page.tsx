import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageTitle } from '@/app/(signed-in)/(sidebar)/_components/page-title';
import { PAGE_COLUMN } from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import { cn } from '@/lib/cn.util';
import { requireMember } from '@/lib/session/session.service';
import { AnsweredAsksProvider } from './_components/answered-asks';
import { WaitingAsks, WaitingAsksSkeleton } from './_components/waiting-asks';
import { WAITING_HEADING_ID } from './_components/waiting-heading.constant';
import { WaitingPostcard } from './_components/waiting-postcard';
import { WaitingSort } from './_components/waiting-sort';
import { WaitingSearchParams } from './_lib/waiting-search-params.schema';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Waiting for me',
  robots: { index: false, follow: false },
};

type WaitingProps = {
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
export default async function Waiting({ searchParams }: WaitingProps) {
  const { sort, ask } = WaitingSearchParams.parse(await searchParams);
  const session = await requireMember();

  return (
    <AnsweredAsksProvider>
      <div className={cn(PAGE_COLUMN, 'flex flex-col gap-4')}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <PageTitle id={WAITING_HEADING_ID} tabIndex={-1}>
            Waiting for me
          </PageTitle>
          <WaitingSort sort={sort} />
        </div>
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
