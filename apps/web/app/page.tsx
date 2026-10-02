import Link from 'next/link';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { apiBaseUrl } from '@/lib/api-client.service';

/**
 * The public landing route, deliberately empty of product: nothing is built ahead of the
 * first real feature, and the landing page replaces this. Until then it points developers at
 * the component showcase and the API's Scalar reference.
 *
 * Every class resolves to a token: a role for colour, shape and type, a scale for spacing.
 * `bg-primary-500` is not a class that exists, because the theme exposes colour only as roles.
 */
export default function Landing() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-24">
      <Text variant="display5" as="h1">
        Thrive
      </Text>
      <Text tone="muted">Ask for, give and act on feedback.</Text>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="primary" size="sm" className="w-fit">
          <Link href="/ui-showcase">See the components</Link>
        </Button>
        {/* Another origin, so a plain link: Next's `Link` is for this app's own routes. */}
        <Button asChild size="sm" className="w-fit">
          <a
            href={`${apiBaseUrl()}/reference`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open the API reference
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </Button>
      </div>
    </main>
  );
}
