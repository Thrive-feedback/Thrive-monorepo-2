import Link from 'next/link';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';

/**
 * The landing route, deliberately empty of product: the web app renders a page of its own,
 * and nothing is built ahead of the first real feature. The first real route replaces this.
 *
 * Every class resolves to a token: a role for colour, shape and type, a scale for spacing.
 * `bg-primary-500` is not a class that exists, because the theme exposes colour only as roles.
 */
export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-24">
      <Text variant="display5" as="h1">
        Thrive
      </Text>
      <Text tone="muted">Ask for, give and act on feedback.</Text>
      <Button asChild variant="primary" size="sm" className="w-fit">
        <Link href="/ui-showcase">See the components</Link>
      </Button>
    </main>
  );
}
