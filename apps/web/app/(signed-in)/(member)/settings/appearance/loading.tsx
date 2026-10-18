import { SkeletonRegion } from '@/components/atoms/skeleton';
import { AppearanceSectionSkeleton } from './_components/appearance-section';

/** Appearance while the session is read: the Theme row, with its picker in grey. */
export default function AppearanceLoading() {
  return (
    <SkeletonRegion>
      <AppearanceSectionSkeleton />
    </SkeletonRegion>
  );
}
