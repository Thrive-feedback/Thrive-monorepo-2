import { ShowcaseBreadcrumb } from '@/app/ui-showcase/_components/showcase-breadcrumb';
import { ShowcasePage } from '@/app/ui-showcase/_components/showcase-page';
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
    <ShowcasePage>
      <ShowcaseBreadcrumb current={name} />
      <Entry />
      <ShowcasePager previous={previous} next={next} />
    </ShowcasePage>
  );
}
