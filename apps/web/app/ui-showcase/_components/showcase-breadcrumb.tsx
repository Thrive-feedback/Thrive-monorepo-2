import { Link } from '@/components/atoms/link';
import { ROUTES } from '@/lib/routes.constant';

export type ShowcaseBreadcrumbProps = {
  current: string;
};

/** The last crumb is the page itself: text, not a link, marked as the current page. */
export function ShowcaseBreadcrumb({ current }: ShowcaseBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-body2">
        <li>
          <Link href={ROUTES.uiShowcase.index}>Index</Link>
        </li>
        <li aria-hidden="true" className="text-foreground-muted">
          /
        </li>
        <li>
          <span aria-current="page" className="font-medium">
            {current}
          </span>
        </li>
      </ol>
    </nav>
  );
}
