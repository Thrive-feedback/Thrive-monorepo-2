import { PersonalItemsLoading } from '@/app/(signed-in)/(sidebar)/_components/personal-items-skeleton';
import {
  PAGE_COLUMN,
  PAGE_COLUMN_WIDTH,
} from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import { BAND_CORNERS } from '@/app/(signed-in)/(sidebar)/profile/[slug]/_components/profile-header';
import styles from '@/app/(signed-in)/(sidebar)/profile/[slug]/_components/profile-header.module.css';
import { Skeleton, SkeletonRegion } from '@/components/atoms/skeleton';
import { cn } from '@/lib/cn.util';
import { PERSONAL_VIEWS } from '@/lib/routes.constant';

/**
 * A Profile while the server builds it. The navbar and sidebar stay in place, the header's band is
 * already there with the person's face, name and standing in grey where they will be, and the list
 * under it waits as Received's does.
 */
export default function ProfileLoading() {
  return (
    <>
      <SkeletonRegion>
        <div className={cn(styles.band, BAND_CORNERS)}>
          <div
            className={cn(PAGE_COLUMN_WIDTH, 'flex flex-col gap-2 pt-8 pb-10')}
          >
            <div className="flex items-center gap-2.5">
              <Skeleton shape="circle" className="size-8" />
              <Skeleton className="h-9 w-40" />
            </div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
      </SkeletonRegion>
      <div className={cn(PAGE_COLUMN, 'flex flex-col gap-6')}>
        <PersonalItemsLoading view={PERSONAL_VIEWS[0]} />
      </div>
    </>
  );
}
