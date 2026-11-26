import { PageTitle } from '@/app/(signed-in)/(sidebar)/_components/page-title';
import { Skeleton, SkeletonRegion } from '@/components/atoms/skeleton';
import { cn } from '@/lib/cn.util';
import { ONE_ON_ONES_COLUMN } from './_lib/one-on-ones-layout.constant';
import styles from './page.module.css';

/**
 * The 1:1s while the server reads them: the heading as it will be, the strip's cards and the open
 * 1:1's panel holding the room they will take, so nothing jumps.
 */
export default function OneOnOnesLoading() {
  return (
    <div className={cn(ONE_ON_ONES_COLUMN, styles.frame)}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <PageTitle>1:1s</PageTitle>
        <div className="ms-auto">
          <SkeletonRegion>
            <Skeleton shape="control" className="h-10 w-40" />
          </SkeletonRegion>
        </div>
      </div>
      <SkeletonRegion>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <div className="flex gap-3 overflow-hidden pb-2 lg:w-72 lg:shrink-0 lg:flex-col lg:pb-0">
            {[0, 1, 2].map((card) => (
              <Skeleton
                key={card}
                shape="card"
                className="h-21 w-52 shrink-0 lg:w-full"
              />
            ))}
          </div>
          <Skeleton shape="card" className="h-72 w-full lg:flex-1" />
        </div>
      </SkeletonRegion>
    </div>
  );
}
