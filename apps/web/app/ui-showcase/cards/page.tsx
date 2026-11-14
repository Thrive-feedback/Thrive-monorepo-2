import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requireUiShowcaseAccess } from '@/lib/ui-showcase/ui-showcase-access.service';
import { CardGallery } from './_components/card-gallery';

/** Asked here too, so someone not on the list is sent nothing about this page (ADR 0088). */
export async function generateMetadata(): Promise<Metadata> {
  await requireUiShowcaseAccess();
  return {
    title: 'Cards',
    description: 'Every card in the app, side by side.',
    robots: { index: false, follow: false },
  };
}

/**
 * Every card at once, to compare them. Some read the address's search params, so the gallery waits
 * for them under a boundary of its own.
 */
export default async function CardsPage() {
  await requireUiShowcaseAccess();
  return (
    <Suspense>
      <CardGallery />
    </Suspense>
  );
}
