import Link from 'next/link';

/**
 * The landing route, deliberately empty of product: the web app renders a page of its own,
 * and nothing is built ahead of the first real feature. The first real route replaces this.
 *
 * Every class resolves to a token. `bg-primary-500` is not a class that exists, because the
 * theme exposes colour only as roles.
 */
export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-24">
      <h1 className="font-semibold text-4xl">Thrive</h1>
      <p className="text-foreground-muted text-lg">
        Ask for, give and act on feedback.
      </p>
      <Link
        href="/ui-showcase/tokens"
        className="bg-action hover:bg-action-hover active:bg-action-pressed text-foreground-on-action rounded-control w-fit px-4 py-2 font-medium text-sm"
      >
        See the design tokens
      </Link>
    </main>
  );
}
