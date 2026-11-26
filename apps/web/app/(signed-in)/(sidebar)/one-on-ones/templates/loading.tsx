import { PageTitle } from '@/app/(signed-in)/(sidebar)/_components/page-title';
import { Skeleton, SkeletonRegion } from '@/components/atoms/skeleton';
import { TEMPLATES_COLUMN } from './_lib/templates-layout.constant';

/**
 * The templates while the server reads them: the heading as it will be, and the three layers
 * holding the room they will take. Without it, the 1:1s page's own skeleton would stand in.
 */
export default function OneOnOneTemplatesLoading() {
  return (
    <div className={TEMPLATES_COLUMN}>
      <div className="flex flex-col gap-3">
        <SkeletonRegion>
          <Skeleton className="h-5 w-12" />
        </SkeletonRegion>
        <PageTitle>Templates</PageTitle>
      </div>
      <SkeletonRegion>
        <div className="flex flex-col gap-10">
          {['yours', 'workspace', 'thrive'].map((layer) => (
            <div key={layer} className="flex flex-col gap-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton shape="card" className="h-40 w-full" />
            </div>
          ))}
        </div>
      </SkeletonRegion>
    </div>
  );
}
