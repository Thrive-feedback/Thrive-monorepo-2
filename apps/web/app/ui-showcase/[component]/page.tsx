import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ComponentPage } from '@/app/ui-showcase/_components/component-page';
import { COMPONENT_CATALOG } from '@/app/ui-showcase/_lib/component-catalog.constant';

// Typed here rather than with Next's generated `PageProps`, which exists only after a build
// or dev server has run, so a clean checkout's type-check would not find it.
type ComponentShowcasePageProps = {
  params: Promise<{ component: string }>;
};

/** Every page is built ahead of time; a slug that is not in the catalog is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return COMPONENT_CATALOG.map(({ slug }) => ({ component: slug }));
}

export async function generateMetadata({
  params,
}: ComponentShowcasePageProps): Promise<Metadata> {
  const { component } = await params;
  const entry = COMPONENT_CATALOG.find(({ slug }) => slug === component);
  return {
    title: entry ? `${entry.name} · Components` : 'Components',
    robots: { index: false, follow: false },
  };
}

/**
 * One component per page, so each can be read — and linked to — on its own. The segment is
 * checked against the catalog rather than trusted, and the order there drives the
 * previous/next links.
 */
export default async function ComponentShowcasePage({
  params,
}: ComponentShowcasePageProps) {
  const { component } = await params;
  const index = COMPONENT_CATALOG.findIndex(({ slug }) => slug === component);
  const entry = COMPONENT_CATALOG[index];
  if (!entry) {
    notFound();
  }

  return (
    <ComponentPage
      entry={entry}
      previous={COMPONENT_CATALOG[index - 1]}
      next={COMPONENT_CATALOG[index + 1]}
    />
  );
}
