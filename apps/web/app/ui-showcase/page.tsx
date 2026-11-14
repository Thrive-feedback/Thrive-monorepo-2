import type { Metadata } from 'next';
import { requireUiShowcaseAccess } from '@/lib/ui-showcase/ui-showcase-access.service';
import { ComponentIndex } from './_components/component-index';

/** Asked here too, so someone not on the list is sent nothing about this page (ADR 0088). */
export async function generateMetadata(): Promise<Metadata> {
  await requireUiShowcaseAccess();
  return {
    title: 'Components',
    description:
      'Every shared component Thrive builds screens from, grouped by atomic level.',
    robots: { index: false, follow: false },
  };
}

/**
 * The index `#104` asks a reader to open: every shared component as a card with a live
 * example, its name and its atomic level. Each card opens the component's own page.
 */
export default async function ComponentsShowcasePage() {
  await requireUiShowcaseAccess();
  return <ComponentIndex />;
}
