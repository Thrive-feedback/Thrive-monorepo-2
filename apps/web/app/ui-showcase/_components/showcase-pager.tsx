import type { ShowcaseComponent } from '@/app/ui-showcase/_lib/component-catalog.constant';
import { Link } from '@/components/atoms/link';

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
        <Link href={`/ui-showcase/${previous.slug}`}>← {previous.name}</Link>
      ) : (
        <span />
      )}
      {next && <Link href={`/ui-showcase/${next.slug}`}>{next.name} →</Link>}
    </nav>
  );
}
