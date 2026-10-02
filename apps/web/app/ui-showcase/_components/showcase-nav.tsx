import { Link } from '@/components/atoms/link';

export function ShowcaseNav() {
  return (
    <header className="border-line border-b">
      <nav
        aria-label="Showcase"
        className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-4"
      >
        <span className="font-semibold">Thrive UI</span>
        <Link href="/ui-showcase">Components</Link>
        <Link href="/ui-showcase/tokens">Tokens</Link>
      </nav>
    </header>
  );
}
