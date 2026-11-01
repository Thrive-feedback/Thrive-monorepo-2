import { BrandNewPageTitle } from '@/app/(signed-in)/(brand-new)/_components/brand-new-page-title';
import {
  KudosBoardMonthFilterSkeleton,
  KudosBoardSkeleton,
} from './_components/kudos-board';
import { KudosBoardTidy } from './_components/kudos-board-tidy';
import { KUDOS_BOARD_COLUMN } from './_lib/kudos-board.constant';

/**
 * The Kudos board while the server builds it. The navbar and sidebar stay in place, so this holds
 * the board's own shape in grey, so nothing jumps when it arrives.
 */
export default function BrandNewKudosLoading() {
  return (
    <div className={KUDOS_BOARD_COLUMN}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <BrandNewPageTitle>Kudos board</BrandNewPageTitle>
        <div className="ms-auto flex items-center gap-3">
          <KudosBoardMonthFilterSkeleton />
          <KudosBoardTidy />
        </div>
      </div>
      <KudosBoardSkeleton />
    </div>
  );
}
