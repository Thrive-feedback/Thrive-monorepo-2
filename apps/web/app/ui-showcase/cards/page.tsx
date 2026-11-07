import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CardGallery } from './_components/card-gallery';

export const metadata: Metadata = {
  title: 'Cards',
  description: 'Every card in the app, side by side.',
  robots: { index: false, follow: false },
};

/**
 * Every card at once, to compare them. Some read the address's search params, so the gallery waits
 * for them under a boundary rather than making the whole page dynamic.
 */
export default function CardsPage() {
  return (
    <Suspense>
      <CardGallery />
    </Suspense>
  );
}
