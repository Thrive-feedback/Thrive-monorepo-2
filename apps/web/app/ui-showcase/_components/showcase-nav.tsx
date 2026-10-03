import { Link } from '@/components/atoms/link';
import { ROUTES } from '@/lib/routes.constant';

export function ShowcaseNav() {
  return (
    <header className="border-line border-b">
      <nav
        aria-label="Showcase"
        className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-4"
      >
        <span className="font-semibold">Thrive UI</span>
        <Link href={ROUTES.uiShowcase.index}>Components</Link>
        <Link href={ROUTES.uiShowcase.tokens}>Tokens</Link>
      </nav>
    </header>
  );
}
