import { SettingsCard } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-card';
import { Skeleton } from '@/components/atoms/skeleton';

/** One template layer's card while the catalog is read: its title, and a few rows in grey. */
function LayerCardSkeleton({ title }: { title: string }) {
  return (
    <SettingsCard title={title}>
      <div className="flex flex-col gap-3 py-4">
        <Skeleton shape="control" />
        <Skeleton shape="control" />
      </div>
    </SettingsCard>
  );
}

/** The template cards while the catalog is read, before anyone knows which Workspace it is for. */
export function TemplateLibrarySkeleton() {
  return (
    <>
      <LayerCardSkeleton title="Your templates" />
      <LayerCardSkeleton title="Your Workspace’s templates" />
      <LayerCardSkeleton title="Thrive’s templates" />
    </>
  );
}
