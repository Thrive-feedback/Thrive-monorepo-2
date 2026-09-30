import { ShowcaseBreadcrumb } from '@/app/ui-showcase/_components/showcase-breadcrumb';
import { ShowcasePager } from '@/app/ui-showcase/_components/showcase-pager';
import type { ShowcaseComponent } from '@/app/ui-showcase/_lib/component-catalog.constant';

export type ComponentPageProps = {
  entry: ShowcaseComponent;
  previous?: ShowcaseComponent;
  next?: ShowcaseComponent;
};

export function ComponentPage({ entry, previous, next }: ComponentPageProps) {
  const { name, Entry } = entry;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12">
      <ShowcaseBreadcrumb current={name} />
      <Entry />
      <ShowcasePager previous={previous} next={next} />
    </main>
  );
}
