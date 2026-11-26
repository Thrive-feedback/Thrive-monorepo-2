import type { Metadata } from 'next';
import { readDeploymentFlags } from '@/lib/feature-flags/feature-flags.service';
import { requireUiShowcaseAccess } from '@/lib/ui-showcase/ui-showcase-access.service';
import { FeatureFlagsGallery } from './_components/feature-flags-gallery';

/** Asked here too, so someone not on the list is sent nothing about this page (ADR 0088). */
export async function generateMetadata(): Promise<Metadata> {
  await requireUiShowcaseAccess();
  return {
    title: 'Feature flags',
    description:
      'What this deployment has switched on, read from its API when the page opens.',
    robots: { index: false, follow: false },
  };
}

/** Every flag with the value this deployment answers for it right now (ADR 0087). */
export default async function FeatureFlagsShowcasePage() {
  await requireUiShowcaseAccess();
  return <FeatureFlagsGallery flags={await readDeploymentFlags()} />;
}
