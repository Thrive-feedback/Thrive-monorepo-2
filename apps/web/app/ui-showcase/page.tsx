import type { Metadata } from 'next';
import { ComponentIndex } from './_components/component-index';

export const metadata: Metadata = {
  title: 'Components',
  description:
    'Every shared component Thrive builds screens from, grouped by atomic level.',
  robots: { index: false, follow: false },
};

/**
 * The index `#104` asks a reader to open: every shared component as a card with a live
 * example, its name and its atomic level. Each card opens the component's own page.
 */
export default function ComponentsShowcasePage() {
  return <ComponentIndex />;
}
