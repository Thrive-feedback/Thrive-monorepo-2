import { SkeletonRegion } from '@/components/atoms/skeleton';

export type SettingsSkeletonProps = {
  /** The section's cards, drawn in grey. */
  children: React.ReactNode;
};

/**
 * A Settings section's cards while it loads, announced once as loading. The region holds every
 * card, so it spaces them itself, by the same gap the section column puts between the real ones
 * (`SettingsPanes`); otherwise the grey cards would sit edge to edge and spring apart on arrival.
 */
export function SettingsSkeleton({ children }: SettingsSkeletonProps) {
  return (
    <SkeletonRegion>
      <div className="flex flex-col gap-6">{children}</div>
    </SkeletonRegion>
  );
}
