import type { Metadata } from 'next';
import { requireUiShowcaseAccess } from '@/lib/ui-showcase/ui-showcase-access.service';
import { OneOnOneGallery } from './_components/one-on-one-gallery';

/** Asked here too, so someone not on the list is sent nothing about this page (ADR 0088). */
export async function generateMetadata(): Promise<Metadata> {
  await requireUiShowcaseAccess();
  return {
    title: '1:1s',
    description:
      'Every state of a 1:1, from each side of it, with the list, the dialogs and the empty page.',
    robots: { index: false, follow: false },
  };
}

export default async function OneOnOnesShowcasePage() {
  await requireUiShowcaseAccess();
  return <OneOnOneGallery />;
}
