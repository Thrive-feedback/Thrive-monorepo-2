import type { ShowcaseComponent } from '@/app/ui-showcase/_lib/component-catalog.constant';
import { Link } from '@/components/atoms/link';
import { ROUTES } from '@/lib/routes.constant';

export type ShowcasePagerProps = {
  previous?: ShowcaseComponent;
  next?: ShowcaseComponent;
};

export function ShowcasePager({ previous, next }: ShowcasePagerProps) {
  return (
    <nav
      aria-label="More components"
      className="flex justify-between gap-4 border-line border-t pt-6 text-body2"
    >
      {previous ? (
        <Link href={ROUTES.uiShowcase.component(previous.slug)}>
          ← {previous.name}
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={ROUTES.uiShowcase.component(next.slug)}>{next.name} →</Link>
      )}
    </nav>
  );
}
