import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BrandNewPageTitle } from '@/app/(signed-in)/(brand-new)/_components/brand-new-page-title';
import { HandwrittenNote } from '@/components/molecules/handwritten-note';
import { requireMember } from '@/lib/session/session.service';
import {
  KudosBoard,
  KudosBoardMonthFilter,
  KudosBoardMonthFilterSkeleton,
  KudosBoardSkeleton,
} from './_components/kudos-board';
import { KudosBoardPlacesProvider } from './_components/kudos-board-places';
import { KudosBoardTidy } from './_components/kudos-board-tidy';
import { BrandNewKudosSearchParams } from './_lib/brand-new-kudos-search-params.schema';
import {
  KUDOS_BOARD_COLUMN,
  KUDOS_BOARD_HEADING_ID,
} from './_lib/kudos-board.constant';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Kudos board',
  robots: { index: false, follow: false },
};

type BrandNewKudosProps = {
  /** `month` narrows the board to one month. */
  searchParams: Promise<{ month?: string | string[] }>;
};

/**
 * Every Kudos of the Workspace, each on the card it was written on, a page at a time. It reads
 * newest first, fits the window with no scrolling, and can be narrowed to one month. Where there is
 * a mouse the cards can be moved around, and Tidy up puts them back.
 */
export default async function BrandNewKudos({
  searchParams,
}: BrandNewKudosProps) {
  const { month } = BrandNewKudosSearchParams.parse(await searchParams);
  const { membership } = await requireMember();

  return (
    <KudosBoardPlacesProvider>
      <div className={KUDOS_BOARD_COLUMN}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <BrandNewPageTitle id={KUDOS_BOARD_HEADING_ID} tabIndex={-1}>
            Kudos board
          </BrandNewPageTitle>
          <HandwrittenNote
            size="md"
            writes="on-open"
            className="hidden -translate-y-1.5 md:block"
          >
            small wins, pinned up
          </HandwrittenNote>
          <div className="ms-auto flex items-center gap-3">
            <Suspense fallback={<KudosBoardMonthFilterSkeleton />}>
              <KudosBoardMonthFilter membership={membership} month={month} />
            </Suspense>
            <KudosBoardTidy />
          </div>
        </div>
        <Suspense key={month} fallback={<KudosBoardSkeleton />}>
          <KudosBoard membership={membership} month={month} />
        </Suspense>
      </div>
    </KudosBoardPlacesProvider>
  );
}
