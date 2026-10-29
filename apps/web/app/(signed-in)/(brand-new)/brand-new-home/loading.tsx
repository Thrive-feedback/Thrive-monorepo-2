import { SkeletonRegion } from '@/components/atoms/skeleton';

/**
 * The new Home while the server builds it. It has nothing drawn yet besides its navbar and
 * sidebar, which stay in place, so this only says it is loading.
 */
export default function BrandNewHomeLoading() {
  return (
    <SkeletonRegion>
      <div />
    </SkeletonRegion>
  );
}
