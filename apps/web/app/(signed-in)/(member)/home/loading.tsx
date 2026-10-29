import { SkeletonRegion } from '@/components/atoms/skeleton';
import { HomeViewSkeleton } from '@/components/templates/home-view';
import styles from './_components/home-split.module.css';
import { NewHomeBanner } from './_components/new-home-banner';

/**
 * Home while the server builds it: both of its layouts, in grey, at their real size. The banner
 * reads nothing, so it is drawn as it will be.
 */
export default function HomeLoading() {
  return (
    <>
      <NewHomeBanner />
      <SkeletonRegion>
        <HomeViewSkeleton splitClassName={styles.split} />
      </SkeletonRegion>
    </>
  );
}
