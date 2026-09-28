import type { Metadata } from 'next';
import { TokenGallery } from './_components/token-gallery';

export const metadata: Metadata = {
  title: 'Design tokens',
  description:
    'Every semantic token Thrive can paint with, shown with its name.',
};

/**
 * FE_01 R2 — a route file wires a URL to a view and renders a named component defined
 * elsewhere. The view starts in this route's private folder (`FE_01` R3) because it has one
 * consumer; a second route importing it is what would earn the move to `components/`.
 *
 * This page is the check `#47` asks a reader to make: the semantic layer, visible, by name.
 */
export default function DesignTokensPage() {
  return <TokenGallery />;
}
