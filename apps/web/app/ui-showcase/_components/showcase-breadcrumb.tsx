import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/atoms/breadcrumb';
import { Link } from '@/components/atoms/link';
import { ROUTES } from '@/lib/routes.constant';

export type ShowcaseBreadcrumbProps = {
  current: string;
};

/** Index, then the page itself: the shared Breadcrumb with the showcase's "/" separator. */
export function ShowcaseBreadcrumb({ current }: ShowcaseBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={ROUTES.uiShowcase.index}>Index</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>{current}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
