import { SkeletonRegion } from '@/components/atoms/skeleton';
import { HomeViewSkeleton } from '@/components/templates/home-view';
import styles from './_components/home-split.module.css';

/** Home while the server builds it: both of its layouts, in grey, at their real size. */
export default function HomeLoading() {
  return (
    <SkeletonRegion>
      <HomeViewSkeleton splitClassName={styles.split} />
    </SkeletonRegion>
  );
}
