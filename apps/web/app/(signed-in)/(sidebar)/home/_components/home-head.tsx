import { HangingBandGround } from '@/app/(signed-in)/(sidebar)/_components/hanging-band';
import { PAGE_COLUMN_WIDTH } from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import {
  HOME_HEAD,
  HOME_HEADING_ROOM,
} from '@/app/(signed-in)/(sidebar)/home/_lib/home-layout.constant';
import { cn } from '@/lib/cn.util';

export type HomeHeadProps = {
  /** The page's title. */
  children: React.ReactNode;
};

/**
 * Home's heading, standing where the band's contents begin, before the band and over it, and from
 * `md` staying under the navbar as the page scrolls. There the band's ground lies behind it, so the
 * week passes under the heading rather than through it; on a phone, where it scrolls with the band,
 * it needs none.
 */
export function HomeHead({ children }: HomeHeadProps) {
  return (
    <div className={HOME_HEAD}>
      <HangingBandGround className="absolute inset-0 hidden md:block" />
      <div className={cn(PAGE_COLUMN_WIDTH, 'relative', HOME_HEADING_ROOM)}>
        {children}
      </div>
    </div>
  );
}
