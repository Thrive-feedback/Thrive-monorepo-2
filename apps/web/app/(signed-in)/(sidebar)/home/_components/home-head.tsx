import { HangingBandGround } from '@/app/(signed-in)/(sidebar)/_components/hanging-band';
import { PAGE_COLUMN_WIDTH } from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import {
  HOME_HEAD,
  HOME_HEADING_LINE,
  HOME_SETTLE_MARK,
  HOME_SETTLE_MARK_ID,
} from '@/app/(signed-in)/(sidebar)/home/_lib/home-layout.constant';
import { cn } from '@/lib/cn.util';
import { HomeTitle } from './home-title';

export type HomeHeadProps = {
  /** The heading's id, for the button back to the top; left out while the page loads. */
  headingId?: string;
};

/**
 * Home's heading, standing where the band's contents begin, before the band and over it. At the top
 * of the page it is the band's display line; from `md` it settles to a page title as the page
 * begins to scroll and stays under the navbar, the band's ground behind it, so the week passes under
 * the heading rather than through it. On a phone it scrolls with the band, big, and needs no ground.
 * The mark it settles at comes first, in the page's flow, since the heading itself stays put.
 */
export function HomeHead({ headingId }: HomeHeadProps) {
  return (
    <>
      <div
        id={HOME_SETTLE_MARK_ID}
        aria-hidden="true"
        className={HOME_SETTLE_MARK}
      />
      <div className={HOME_HEAD}>
        <HangingBandGround className="absolute inset-0 hidden md:block" />
        <div className={cn(PAGE_COLUMN_WIDTH, 'relative', HOME_HEADING_LINE)}>
          <HomeTitle id={headingId} />
        </div>
      </div>
    </>
  );
}
