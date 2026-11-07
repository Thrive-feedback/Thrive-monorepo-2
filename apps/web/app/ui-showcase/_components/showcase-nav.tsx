import { Link } from '@/components/atoms/link';
import { ThemeToggle } from '@/components/molecules/theme-toggle';
import { ROUTES } from '@/lib/routes.constant';

/** The showcase's one bar, held at the top while a long page scrolls, so the other pages stay a click away. */
export function ShowcaseNav() {
  return (
    <header className="sticky top-0 z-40 border-border-default border-b bg-surface-base">
      <nav
        aria-label="Showcase"
        className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-4"
      >
        <span className="font-semibold">Thrive UI</span>
        <Link href={ROUTES.uiShowcase.index}>Components</Link>
        <Link href={ROUTES.uiShowcase.tokens}>Tokens</Link>
        <Link href={ROUTES.uiShowcase.cards}>Cards</Link>
        <div className="ms-auto">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
